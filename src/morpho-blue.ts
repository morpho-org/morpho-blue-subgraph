import { BigInt } from "@graphprotocol/graph-ts"
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
import { ExampleEntity } from "../generated/schema"

export function handleAccrueInterests(event: AccrueInterests): void {
}

export function handleBorrow(event: Borrow): void {}

export function handleCreateMarket(event: CreateMarket): void {}

export function handleEnableIrm(event: EnableIrm): void {}

export function handleEnableLltv(event: EnableLltv): void {}

export function handleFlashLoan(event: FlashLoan): void {}

export function handleIncrementNonce(event: IncrementNonce): void {}

export function handleLiquidate(event: Liquidate): void {}

export function handleRepay(event: Repay): void {}

export function handleSetAuthorization(event: SetAuthorization): void {}

export function handleSetFee(event: SetFee): void {}

export function handleSetFeeRecipient(event: SetFeeRecipient): void {}

export function handleSetOwner(event: SetOwner): void {}

export function handleSupply(event: Supply): void {}

export function handleSupplyCollateral(event: SupplyCollateral): void {}

export function handleWithdraw(event: Withdraw): void {}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {}
