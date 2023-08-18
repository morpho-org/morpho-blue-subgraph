import { newMockEvent } from "matchstick-as";

import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts";

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

export function createAccrueInterestsEvent(
  id: Bytes,
  prevBorrowRate: BigInt,
  accruedInterests: BigInt,
  feeShares: BigInt
): AccrueInterests {
  let accrueInterestsEvent = changetype<AccrueInterests>(newMockEvent());

  accrueInterestsEvent.parameters = new Array();

  accrueInterestsEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  accrueInterestsEvent.parameters.push(
    new ethereum.EventParam(
      "prevBorrowRate",
      ethereum.Value.fromUnsignedBigInt(prevBorrowRate)
    )
  );
  accrueInterestsEvent.parameters.push(
    new ethereum.EventParam(
      "accruedInterests",
      ethereum.Value.fromUnsignedBigInt(accruedInterests)
    )
  );
  accrueInterestsEvent.parameters.push(
    new ethereum.EventParam(
      "feeShares",
      ethereum.Value.fromUnsignedBigInt(feeShares)
    )
  );

  return accrueInterestsEvent;
}

export function createBorrowEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt,
  shares: BigInt
): Borrow {
  let borrowEvent = changetype<Borrow>(newMockEvent());

  borrowEvent.parameters = new Array();

  borrowEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return borrowEvent;
}

export function createCreateMarketEvent(
  id: Bytes,
  market: ethereum.Tuple
): CreateMarket {
  let createMarketEvent = changetype<CreateMarket>(newMockEvent());

  createMarketEvent.parameters = new Array();

  createMarketEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  createMarketEvent.parameters.push(
    new ethereum.EventParam("market", ethereum.Value.fromTuple(market))
  );

  return createMarketEvent;
}

export function createEnableIrmEvent(irm: Address): EnableIrm {
  let enableIrmEvent = changetype<EnableIrm>(newMockEvent());

  enableIrmEvent.parameters = new Array();

  enableIrmEvent.parameters.push(
    new ethereum.EventParam("irm", ethereum.Value.fromAddress(irm))
  );

  return enableIrmEvent;
}

export function createEnableLltvEvent(lltv: BigInt): EnableLltv {
  let enableLltvEvent = changetype<EnableLltv>(newMockEvent());

  enableLltvEvent.parameters = new Array();

  enableLltvEvent.parameters.push(
    new ethereum.EventParam("lltv", ethereum.Value.fromUnsignedBigInt(lltv))
  );

  return enableLltvEvent;
}

export function createFlashLoanEvent(
  caller: Address,
  token: Address,
  assets: BigInt
): FlashLoan {
  let flashLoanEvent = changetype<FlashLoan>(newMockEvent());

  flashLoanEvent.parameters = new Array();

  flashLoanEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  flashLoanEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  );
  flashLoanEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );

  return flashLoanEvent;
}

export function createIncrementNonceEvent(
  caller: Address,
  authorizer: Address,
  usedNonce: BigInt
): IncrementNonce {
  let incrementNonceEvent = changetype<IncrementNonce>(newMockEvent());

  incrementNonceEvent.parameters = new Array();

  incrementNonceEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  incrementNonceEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  );
  incrementNonceEvent.parameters.push(
    new ethereum.EventParam(
      "usedNonce",
      ethereum.Value.fromUnsignedBigInt(usedNonce)
    )
  );

  return incrementNonceEvent;
}

export function createLiquidateEvent(
  id: Bytes,
  caller: Address,
  borrower: Address,
  repaid: BigInt,
  repaidShares: BigInt,
  seized: BigInt,
  badDebtShares: BigInt
): Liquidate {
  let liquidateEvent = changetype<Liquidate>(newMockEvent());

  liquidateEvent.parameters = new Array();

  liquidateEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("borrower", ethereum.Value.fromAddress(borrower))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("repaid", ethereum.Value.fromUnsignedBigInt(repaid))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "repaidShares",
      ethereum.Value.fromUnsignedBigInt(repaidShares)
    )
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("seized", ethereum.Value.fromUnsignedBigInt(seized))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "badDebtShares",
      ethereum.Value.fromUnsignedBigInt(badDebtShares)
    )
  );

  return liquidateEvent;
}

export function createRepayEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt,
  shares: BigInt
): Repay {
  let repayEvent = changetype<Repay>(newMockEvent());

  repayEvent.parameters = new Array();

  repayEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return repayEvent;
}

export function createSetAuthorizationEvent(
  caller: Address,
  authorizer: Address,
  authorized: Address,
  newIsAuthorized: boolean
): SetAuthorization {
  let setAuthorizationEvent = changetype<SetAuthorization>(newMockEvent());

  setAuthorizationEvent.parameters = new Array();

  setAuthorizationEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  setAuthorizationEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  );
  setAuthorizationEvent.parameters.push(
    new ethereum.EventParam(
      "authorized",
      ethereum.Value.fromAddress(authorized)
    )
  );
  setAuthorizationEvent.parameters.push(
    new ethereum.EventParam(
      "newIsAuthorized",
      ethereum.Value.fromBoolean(newIsAuthorized)
    )
  );

  return setAuthorizationEvent;
}

export function createSetFeeEvent(id: Bytes, fee: BigInt): SetFee {
  let setFeeEvent = changetype<SetFee>(newMockEvent());

  setFeeEvent.parameters = new Array();

  setFeeEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  setFeeEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  );

  return setFeeEvent;
}

export function createSetFeeRecipientEvent(
  feeRecipient: Address
): SetFeeRecipient {
  let setFeeRecipientEvent = changetype<SetFeeRecipient>(newMockEvent());

  setFeeRecipientEvent.parameters = new Array();

  setFeeRecipientEvent.parameters.push(
    new ethereum.EventParam(
      "feeRecipient",
      ethereum.Value.fromAddress(feeRecipient)
    )
  );

  return setFeeRecipientEvent;
}

export function createSetOwnerEvent(newOwner: Address): SetOwner {
  let setOwnerEvent = changetype<SetOwner>(newMockEvent());

  setOwnerEvent.parameters = new Array();

  setOwnerEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  );

  return setOwnerEvent;
}

export function createSupplyEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt,
  shares: BigInt
): Supply {
  let supplyEvent = changetype<Supply>(newMockEvent());

  supplyEvent.parameters = new Array();

  supplyEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return supplyEvent;
}

export function createSupplyCollateralEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt
): SupplyCollateral {
  let supplyCollateralEvent = changetype<SupplyCollateral>(newMockEvent());

  supplyCollateralEvent.parameters = new Array();

  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );

  return supplyCollateralEvent;
}

export function createWithdrawEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt,
  shares: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent());

  withdrawEvent.parameters = new Array();

  withdrawEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return withdrawEvent;
}

export function createWithdrawCollateralEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt
): WithdrawCollateral {
  let withdrawCollateralEvent = changetype<WithdrawCollateral>(newMockEvent());

  withdrawCollateralEvent.parameters = new Array();

  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );

  return withdrawCollateralEvent;
}
