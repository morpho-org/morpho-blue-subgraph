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
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from)

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from)

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.MorphoBlue_id = event.params.id
  entity.prevBorrowRate = event.params.prevBorrowRate

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.DOMAIN_SEPARATOR(...)
  // - contract.borrow(...)
  // - contract.borrowShares(...)
  // - contract.collateral(...)
  // - contract.extsload(...)
  // - contract.fee(...)
  // - contract.feeRecipient(...)
  // - contract.idToMarket(...)
  // - contract.isAuthorized(...)
  // - contract.isIrmEnabled(...)
  // - contract.isLltvEnabled(...)
  // - contract.lastUpdate(...)
  // - contract.liquidate(...)
  // - contract.nonce(...)
  // - contract.owner(...)
  // - contract.repay(...)
  // - contract.supply(...)
  // - contract.supplyShares(...)
  // - contract.totalBorrow(...)
  // - contract.totalBorrowShares(...)
  // - contract.totalSupply(...)
  // - contract.totalSupplyShares(...)
  // - contract.withdraw(...)
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
