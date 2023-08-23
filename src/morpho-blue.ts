import { BigInt, log } from "@graphprotocol/graph-ts";

import {
  AccrueInterests,
  Borrow,
  CreateMarket,
  EnableIrm,
  EnableLltv,
  FlashLoan,
  IncrementNonce,
  Liquidate,
  Repay,
  SetAuthorization,
  SetFee,
  SetFeeRecipient,
  SetOwner,
  Supply,
  SupplyCollateral,
  Withdraw,
  WithdrawCollateral,
} from "../generated/MorphoBlue/MorphoBlue";
import { Position } from "../generated/schema";

import { createMarket, getMarket, getZeroMarket } from "./initializers/markets";
import { getProtocol } from "./initializers/protocol";
import { toAssetsUp } from "./maths/shares";
import { AccountManager } from "./sdk/account";
import { BIGDECIMAL_WAD, PositionSide } from "./sdk/constants";
import { DataManager } from "./sdk/manager";
import { PositionManager } from "./sdk/position";
import { TokenManager } from "./sdk/token";

export function handleAccrueInterests(event: AccrueInterests): void {
  const market = getMarket(event.params.id);
  market.accruedInterests = market.accruedInterests.plus(
    event.params.accruedInterests
  );
  market.totalSupply = market.totalSupply.plus(event.params.accruedInterests);
  market.totalBorrow = market.totalBorrow.plus(event.params.accruedInterests);
  market.totalSupplyShares = market.totalSupplyShares.plus(
    event.params.feeShares
  );
  market.accruedInterests = market.accruedInterests.plus(
    event.params.accruedInterests
  );

  if (event.params.feeShares.gt(BigInt.zero())) {
    // We heck the consistency of the fee data
    // TODO: do we want to register theses invariants somewhere instead of throwing?
    if (market.fee.isZero()) {
      log.critical("Inconsistent fee data for market {}", [
        market.id.toHexString(),
      ]);
      const protocol = getProtocol();
      const feeRecipientAccount = new AccountManager(
        protocol.feeRecipient
      ).getAccount();
      const position = new PositionManager(
        feeRecipientAccount,
        market,
        PositionSide.SUPPLIER
      );
      // TODO: do not count the fee as a deposit in snapshots etc.
      position.addSupplyPosition(event, event.params.feeShares);
    }
  }

  market.save();

  const dataManager = new DataManager(market.id, event);

  // TODO: update protocol & market metrics
}

export function handleBorrow(event: Borrow): void {
  const market = getMarket(event.params.id);

  const account = new AccountManager(event.params.onBehalf).getAccount();

  const position = new PositionManager(account, market, PositionSide.BORROWER);

  position.addBorrowPosition(event, event.params.shares);

  // We update the market after updating the position
  market.totalBorrow = market.totalBorrow.plus(event.params.assets);
  market.totalBorrowShares = market.totalBorrowShares.plus(event.params.shares);
  market.save();
}

export function handleCreateMarket(event: CreateMarket): void {
  log.info("Handle new market created: {}", [event.params.id.toHexString()]);

  createMarket(event.params.id, event.params.market, event);
}

export function handleEnableIrm(event: EnableIrm): void {
  const protocol = getProtocol();

  const irmList = protocol.irmEnabled;
  irmList.push(event.params.irm);

  protocol.irmEnabled = irmList;
  protocol.save();
}

export function handleEnableLltv(event: EnableLltv): void {
  const protocol = getProtocol();

  const lltvList = protocol.lltvEnabled;
  lltvList.push(event.params.lltv);

  protocol.lltvEnabled = lltvList;
  protocol.save();
}

export function handleFlashLoan(event: FlashLoan): void {
  const market = getZeroMarket(event);
  const manager = new DataManager(market.id, event);

  const token = new TokenManager(event.params.token, event);

  const amountUsd = token.getAmountUSD(event.params.assets);
  manager.createFlashloan(
    event.params.token,
    event.params.caller,
    event.params.assets,
    amountUsd
  );
}

export function handleIncrementNonce(event: IncrementNonce): void {}

export function handleLiquidate(event: Liquidate): void {
  const market = getMarket(event.params.id);

  market.totalCollateral = market.totalCollateral.minus(event.params.seized);
  market.save();

  const account = new AccountManager(event.params.borrower).getAccount();

  const borrowPosition = new PositionManager(
    account,
    market,
    PositionSide.BORROWER
  );

  borrowPosition.reduceBorrowPosition(
    event,
    // count bad debt shares as the amount repaid by all the suppliers
    event.params.repaidShares.plus(event.params.badDebtShares)
  );
  // The current position must be defined for a Repay

  const collateralPosition = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  collateralPosition.reduceCollateralPosition(event, event.params.seized);

  market.totalBorrow = market.totalBorrow.minus(event.params.repaid);
  market.totalBorrowShares = market.totalBorrowShares.minus(
    event.params.repaidShares // we remove the bad debt shares after having computed the bad debt in assets
  );
  if (event.params.badDebtShares.gt(BigInt.zero())) {
    const badDebt = toAssetsUp(
      event.params.badDebtShares,
      market.totalBorrowShares,
      market.totalBorrow
    );
    market.totalSupply = market.totalSupply.minus(badDebt);
    market.totalBorrow = market.totalBorrow.minus(badDebt);
    market.totalBorrowShares = market.totalBorrowShares.minus(
      event.params.badDebtShares
    );
  }
  market.save();
}

export function handleRepay(event: Repay): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();

  const position = new PositionManager(account, market, PositionSide.BORROWER);

  // The current position must be defined for a Repay
  const currentPosition = Position.load(position.getPositionID()!)!;
  const initialShares = currentPosition.shares!;
  const userShares = initialShares.minus(event.params.shares);
  const newBalance = toAssetsUp(
    userShares,
    market.totalBorrowShares,
    market.totalBorrow
  );

  position.reduceBorrowPosition(event, event.params.shares);

  market.totalBorrow = market.totalBorrow.minus(event.params.assets);
  market.totalBorrowShares = market.totalBorrowShares.minus(
    event.params.shares
  );
  market.save();
}

export function handleSetAuthorization(event: SetAuthorization): void {}

export function handleSetFee(event: SetFee): void {
  const market = getMarket(event.params.id);
  market.fee = event.params.fee;
  market.reserveFactor = event.params.fee.toBigDecimal().div(BIGDECIMAL_WAD);
  market.save();
}

export function handleSetFeeRecipient(event: SetFeeRecipient): void {
  const protocol = getProtocol();
  protocol.feeRecipient = event.params.feeRecipient;
  protocol.save();
}

export function handleSetOwner(event: SetOwner): void {
  const protocol = getProtocol();
  protocol.owner = event.params.newOwner;
  protocol.save();
}

export function handleSupply(event: Supply): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();
  const position = new PositionManager(account, market, PositionSide.SUPPLIER);

  position.addSupplyPosition(event, event.params.shares);

  market.totalSupply = market.totalSupply.plus(event.params.assets);
  market.totalSupplyShares = market.totalSupplyShares.plus(event.params.shares);
  market.save();
}

export function handleSupplyCollateral(event: SupplyCollateral): void {
  const market = getMarket(event.params.id);
  market.totalCollateral = market.totalCollateral.plus(event.params.assets);
  market.save();

  const token = new TokenManager(market.borrowedToken, event);
  const account = new AccountManager(event.params.onBehalf).getAccount();
  const position = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  position.addCollateralPosition(event, event.params.assets);
}

export function handleWithdraw(event: Withdraw): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();
  const position = new PositionManager(account, market, PositionSide.SUPPLIER);

  position.reduceSupplyPosition(event, event.params.shares);

  market.totalSupply = market.totalSupply.minus(event.params.assets);
  market.totalSupplyShares = market.totalSupplyShares.minus(
    event.params.shares
  );
  market.save();
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const market = getMarket(event.params.id);
  market.totalCollateral = market.totalCollateral.minus(event.params.assets);
  market.save();

  const account = new AccountManager(event.params.onBehalf).getAccount();
  const position = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  position.reduceCollateralPosition(event, event.params.assets);
}
