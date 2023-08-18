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
import {DataManager} from "./sdk/manager";
import {TokenManager} from "./sdk/token";
import {AccountManager} from "./sdk/account";
import {PositionManager} from "./sdk/position";
import {PositionSide, TransactionType} from "./sdk/constants";
import {Position} from "../generated/schema";
import {toAssetsDown, toAssetsUp} from "./maths/shares";
export function handleAccrueInterests(event: AccrueInterests): void {
  const market = getMarket(event.params.id);
  market.accruedInterests = market.accruedInterests.plus(event.params.accruedInterests);
  market.totalSupply = market.totalSupply.plus(event.params.accruedInterests);
  market.totalBorrow = market.totalBorrow.plus(event.params.accruedInterests);
  market.totalSupplyShares = market.totalSupplyShares.plus(event.params.feeShares);
  market.save();
  // TODO: handle the fee

  // TODO: update protocol & market metrics
}

export function handleBorrow(event: Borrow): void {
    const market = getMarket(event.params.id);
    market.totalBorrow = market.totalBorrow.plus(event.params.assets);
    market.totalBorrowShares = market.totalBorrowShares.plus(event.params.shares);
    market.save();

    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.BORROWER);

    let initialShares = BigInt.zero();
    if(position.getPositionID() !== null) {
        const currentPosition = Position.load(position.getPositionID()!)!;
        initialShares = currentPosition.shares
    }
    const userShares = initialShares.plus(event.params.shares);
    const newBalance = toAssetsUp(userShares, market.totalBorrowShares, market.totalBorrow);

    position.addPosition(event, token.getToken().id, newBalance, userShares, TransactionType.BORROW, token.getPriceUSD());

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
    protocol.save()
}

export function handleFlashLoan(event: FlashLoan): void {

}

export function handleIncrementNonce(event: IncrementNonce): void {
}

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


    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.BORROWER);

    // The current position must be defined for a Repay
    const currentPosition = Position.load(position.getPositionID()!)!;
    const initialShares = currentPosition.shares!;
    const userShares = initialShares.minus(event.params.shares);
    const newBalance = toAssetsUp(userShares, market.totalBorrowShares, market.totalBorrow);

    position.subtractPosition(event, newBalance, userShares, TransactionType.REPAY, token.getPriceUSD());

}

export function handleSetAuthorization(event: SetAuthorization): void {}

export function handleSetFee(event: SetFee): void {
    const market = getMarket(event.params.id);
    market.fee = event.params.fee;
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
    market.totalSupply = market.totalSupply.plus(event.params.assets);
    market.totalSupplyShares = market.totalSupplyShares.plus(event.params.shares);
    market.save();

    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.SUPPLIER);

    let initialShares = BigInt.zero();
    if(position.getPositionID() !== null) {
        const currentPosition = Position.load(position.getPositionID()!)!;
        initialShares = currentPosition.shares
    }
    const userShares = initialShares.plus(event.params.shares);
    // TODO: check if we have to substract the user shares/assets to the total?
    const newBalance = toAssetsDown(userShares, market.totalSupplyShares, market.totalSupply);

    position.addPosition(event, token.getToken().id, newBalance, userShares, TransactionType.DEPOSIT, token.getPriceUSD());
}

export function handleSupplyCollateral(event: SupplyCollateral): void {
    const market = getMarket(event.params.id);
    market.totalCollateral = market.totalCollateral.plus(event.params.assets);
    market.save();

    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.COLLATERAL);

    let initialCollateral = BigInt.zero();
    if(position.getPositionID() !== null) {
        const currentPosition = Position.load(position.getPositionID()!)!;
        initialCollateral = currentPosition.balance
    }
    const newBalance = initialCollateral.plus(event.params.assets);

    position.addPosition(event, token.getToken().id, newBalance, BigInt.zero(), TransactionType.DEPOSIT_COLLATERAL, token.getPriceUSD());

}

export function handleWithdraw(event: Withdraw): void {
    const market = getMarket(event.params.id);
    market.totalSupply = market.totalSupply.minus(event.params.assets);
    market.totalSupplyShares = market.totalSupplyShares.minus(event.params.shares);
    market.save();

    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.SUPPLIER);

    let initialShares = BigInt.zero();
    if(position.getPositionID() !== null) {
        const currentPosition = Position.load(position.getPositionID()!)!;
        initialShares = currentPosition.shares
    }
    const userShares = initialShares.minus(event.params.shares);
    // TODO: check if we have to substract the user shares/assets to the total?
    const newBalance = toAssetsDown(userShares, market.totalSupplyShares, market.totalSupply);

    position.subtractPosition(event, newBalance, userShares, TransactionType.WITHDRAW, token.getPriceUSD());
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
    const market = getMarket(event.params.id);
    market.totalCollateral = market.totalCollateral.minus(event.params.assets);
    market.save();


    const token = new TokenManager(market.borrowedToken, event);

    const account = new AccountManager(event.params.onBehalf).getAccount();

    const position = new PositionManager(account, market, PositionSide.COLLATERAL);

    let initialCollateral = BigInt.zero();
    if(position.getPositionID() !== null) {
        const currentPosition = Position.load(position.getPositionID()!)!;
        initialCollateral = currentPosition.balance
    }
    const newBalance = initialCollateral.minus(event.params.assets);

    position.subtractPosition(event, newBalance, BigInt.zero(), TransactionType.WITHDRAW_COLLATERAL, token.getPriceUSD());

}
