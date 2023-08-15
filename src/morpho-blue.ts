import {BigInt, log} from "@graphprotocol/graph-ts"
import {
  MorphoBlue,
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
  WithdrawCollateral
} from "../generated/MorphoBlue/MorphoBlue"
import {getProtocol} from "./initializers/protocol";
import {createMarket, getMarket} from "./initializers/markets";
export function handleAccrueInterests(event: AccrueInterests): void {
  const market = getMarket(event.params.id);
  market.accruedInterests = market.accruedInterests.plus(event.params.accruedInterests);
  market.totalSupply = market.totalSupply.plus(event.params.accruedInterests);
  market.totalBorrow = market.totalBorrow.plus(event.params.accruedInterests);
  market.totalSupplyShares = market.totalSupplyShares.plus(event.params.feeShares);
  market.save();
}

export function handleBorrow(event: Borrow): void {
    const market = getMarket(event.params.id);
    market.totalBorrow = market.totalBorrow.plus(event.params.assets);
    market.totalBorrowShares = market.totalBorrowShares.plus(event.params.shares);
    market.save();
    // TODO: handle position
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
    protocol.save()
}

export function handleEnableLltv(event: EnableLltv): void {
    const protocol = getProtocol();

    const lltvList = protocol.lltvEnabled;
    lltvList.push(event.params.lltv);

    protocol.lltvEnabled = lltvList;
    protocol.save()
}

export function handleFlashLoan(event: FlashLoan): void {

}

export function handleIncrementNonce(event: IncrementNonce): void {}

export function handleLiquidate(event: Liquidate): void {
    const market = getMarket(event.params.id);
    market.totalBorrow = market.totalBorrow.minus(event.params.repaid);
    market.totalBorrowShares = market.totalBorrowShares.minus(event.params.repaidShares);

    market.totalCollateral = market.totalCollateral.minus(event.params.seized);
    market.save();
}

export function handleRepay(event: Repay): void {
    const market = getMarket(event.params.id);
    market.totalBorrow = market.totalBorrow.minus(event.params.assets);
    market.totalBorrowShares = market.totalBorrowShares.minus(event.params.shares);
    market.save();

    // TODO: handle position
}

export function handleSetAuthorization(event: SetAuthorization): void {}

export function handleSetFee(event: SetFee): void {}

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
    market.totalSupply = market.totalSupply.plus(event.params.assets);
    market.totalSupplyShares = market.totalSupplyShares.plus(event.params.shares);
    market.save();

    // TODO: handle position
}

export function handleSupplyCollateral(event: SupplyCollateral): void {
    const market = getMarket(event.params.id);
    market.totalCollateral = market.totalCollateral.plus(event.params.assets);
    market.save();

    // TODO: handle position
}

export function handleWithdraw(event: Withdraw): void {
    const market = getMarket(event.params.id);
    market.totalSupply = market.totalSupply.minus(event.params.assets);
    market.totalSupplyShares = market.totalSupplyShares.minus(event.params.shares);
    market.save();

    // TODO: handle position
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
    const market = getMarket(event.params.id);
    market.totalCollateral = market.totalCollateral.minus(event.params.assets);
    market.save();

    // TODO: handle position
}
