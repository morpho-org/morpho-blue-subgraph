import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  AccrueFee,
  Approval,
  Deposit,
  EIP712DomainChanged,
  OwnershipTransferStarted,
  OwnershipTransferred,
  ReallocateIdle,
  ReallocateSupply,
  ReallocateWithdraw,
  RevokePendingCap,
  RevokePendingGuardian,
  RevokePendingTimelock,
  SetCap,
  SetCurator,
  SetFee,
  SetFeeRecipient,
  SetGuardian,
  SetIsAllocator,
  SetRewardsRecipient,
  SetSupplyQueue,
  SetTimelock,
  SetWithdrawQueue,
  SubmitCap,
  SubmitFee,
  SubmitGuardian,
  SubmitTimelock,
  Transfer,
  TransferRewards,
  UpdateLastTotalAssets,
  Withdraw
} from "../generated/MetaMorpho/MetaMorpho"

export function createAccrueFeeEvent(feeShares: BigInt): AccrueFee {
  let accrueFeeEvent = changetype<AccrueFee>(newMockEvent())

  accrueFeeEvent.parameters = new Array()

  accrueFeeEvent.parameters.push(
    new ethereum.EventParam(
      "feeShares",
      ethereum.Value.fromUnsignedBigInt(feeShares)
    )
  )

  return accrueFeeEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createDepositEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return depositEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createOwnershipTransferStartedEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferStarted {
  let ownershipTransferStartedEvent = changetype<OwnershipTransferStarted>(
    newMockEvent()
  )

  ownershipTransferStartedEvent.parameters = new Array()

  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferStartedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createReallocateIdleEvent(
  caller: Address,
  idle: BigInt
): ReallocateIdle {
  let reallocateIdleEvent = changetype<ReallocateIdle>(newMockEvent())

  reallocateIdleEvent.parameters = new Array()

  reallocateIdleEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  reallocateIdleEvent.parameters.push(
    new ethereum.EventParam("idle", ethereum.Value.fromUnsignedBigInt(idle))
  )

  return reallocateIdleEvent
}

export function createReallocateSupplyEvent(
  caller: Address,
  id: Bytes,
  suppliedAssets: BigInt,
  suppliedShares: BigInt
): ReallocateSupply {
  let reallocateSupplyEvent = changetype<ReallocateSupply>(newMockEvent())

  reallocateSupplyEvent.parameters = new Array()

  reallocateSupplyEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  reallocateSupplyEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )
  reallocateSupplyEvent.parameters.push(
    new ethereum.EventParam(
      "suppliedAssets",
      ethereum.Value.fromUnsignedBigInt(suppliedAssets)
    )
  )
  reallocateSupplyEvent.parameters.push(
    new ethereum.EventParam(
      "suppliedShares",
      ethereum.Value.fromUnsignedBigInt(suppliedShares)
    )
  )

  return reallocateSupplyEvent
}

export function createReallocateWithdrawEvent(
  caller: Address,
  id: Bytes,
  withdrawnAssets: BigInt,
  withdrawnShares: BigInt
): ReallocateWithdraw {
  let reallocateWithdrawEvent = changetype<ReallocateWithdraw>(newMockEvent())

  reallocateWithdrawEvent.parameters = new Array()

  reallocateWithdrawEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  reallocateWithdrawEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )
  reallocateWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawnAssets",
      ethereum.Value.fromUnsignedBigInt(withdrawnAssets)
    )
  )
  reallocateWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawnShares",
      ethereum.Value.fromUnsignedBigInt(withdrawnShares)
    )
  )

  return reallocateWithdrawEvent
}

export function createRevokePendingCapEvent(
  caller: Address,
  id: Bytes
): RevokePendingCap {
  let revokePendingCapEvent = changetype<RevokePendingCap>(newMockEvent())

  revokePendingCapEvent.parameters = new Array()

  revokePendingCapEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  revokePendingCapEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )

  return revokePendingCapEvent
}

export function createRevokePendingGuardianEvent(
  caller: Address
): RevokePendingGuardian {
  let revokePendingGuardianEvent = changetype<RevokePendingGuardian>(
    newMockEvent()
  )

  revokePendingGuardianEvent.parameters = new Array()

  revokePendingGuardianEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return revokePendingGuardianEvent
}

export function createRevokePendingTimelockEvent(
  caller: Address
): RevokePendingTimelock {
  let revokePendingTimelockEvent = changetype<RevokePendingTimelock>(
    newMockEvent()
  )

  revokePendingTimelockEvent.parameters = new Array()

  revokePendingTimelockEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return revokePendingTimelockEvent
}

export function createSetCapEvent(
  caller: Address,
  id: Bytes,
  cap: BigInt
): SetCap {
  let setCapEvent = changetype<SetCap>(newMockEvent())

  setCapEvent.parameters = new Array()

  setCapEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setCapEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )
  setCapEvent.parameters.push(
    new ethereum.EventParam("cap", ethereum.Value.fromUnsignedBigInt(cap))
  )

  return setCapEvent
}

export function createSetCuratorEvent(newCurator: Address): SetCurator {
  let setCuratorEvent = changetype<SetCurator>(newMockEvent())

  setCuratorEvent.parameters = new Array()

  setCuratorEvent.parameters.push(
    new ethereum.EventParam(
      "newCurator",
      ethereum.Value.fromAddress(newCurator)
    )
  )

  return setCuratorEvent
}

export function createSetFeeEvent(caller: Address, newFee: BigInt): SetFee {
  let setFeeEvent = changetype<SetFee>(newMockEvent())

  setFeeEvent.parameters = new Array()

  setFeeEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setFeeEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return setFeeEvent
}

export function createSetFeeRecipientEvent(
  newFeeRecipient: Address
): SetFeeRecipient {
  let setFeeRecipientEvent = changetype<SetFeeRecipient>(newMockEvent())

  setFeeRecipientEvent.parameters = new Array()

  setFeeRecipientEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeRecipient",
      ethereum.Value.fromAddress(newFeeRecipient)
    )
  )

  return setFeeRecipientEvent
}

export function createSetGuardianEvent(
  caller: Address,
  guardian: Address
): SetGuardian {
  let setGuardianEvent = changetype<SetGuardian>(newMockEvent())

  setGuardianEvent.parameters = new Array()

  setGuardianEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setGuardianEvent.parameters.push(
    new ethereum.EventParam("guardian", ethereum.Value.fromAddress(guardian))
  )

  return setGuardianEvent
}

export function createSetIsAllocatorEvent(
  allocator: Address,
  isAllocator: boolean
): SetIsAllocator {
  let setIsAllocatorEvent = changetype<SetIsAllocator>(newMockEvent())

  setIsAllocatorEvent.parameters = new Array()

  setIsAllocatorEvent.parameters.push(
    new ethereum.EventParam("allocator", ethereum.Value.fromAddress(allocator))
  )
  setIsAllocatorEvent.parameters.push(
    new ethereum.EventParam(
      "isAllocator",
      ethereum.Value.fromBoolean(isAllocator)
    )
  )

  return setIsAllocatorEvent
}

export function createSetRewardsRecipientEvent(
  newRewardsRecipient: Address
): SetRewardsRecipient {
  let setRewardsRecipientEvent = changetype<SetRewardsRecipient>(newMockEvent())

  setRewardsRecipientEvent.parameters = new Array()

  setRewardsRecipientEvent.parameters.push(
    new ethereum.EventParam(
      "newRewardsRecipient",
      ethereum.Value.fromAddress(newRewardsRecipient)
    )
  )

  return setRewardsRecipientEvent
}

export function createSetSupplyQueueEvent(
  caller: Address,
  newSupplyQueue: Array<Bytes>
): SetSupplyQueue {
  let setSupplyQueueEvent = changetype<SetSupplyQueue>(newMockEvent())

  setSupplyQueueEvent.parameters = new Array()

  setSupplyQueueEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setSupplyQueueEvent.parameters.push(
    new ethereum.EventParam(
      "newSupplyQueue",
      ethereum.Value.fromFixedBytesArray(newSupplyQueue)
    )
  )

  return setSupplyQueueEvent
}

export function createSetTimelockEvent(
  caller: Address,
  newTimelock: BigInt
): SetTimelock {
  let setTimelockEvent = changetype<SetTimelock>(newMockEvent())

  setTimelockEvent.parameters = new Array()

  setTimelockEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setTimelockEvent.parameters.push(
    new ethereum.EventParam(
      "newTimelock",
      ethereum.Value.fromUnsignedBigInt(newTimelock)
    )
  )

  return setTimelockEvent
}

export function createSetWithdrawQueueEvent(
  caller: Address,
  newWithdrawQueue: Array<Bytes>
): SetWithdrawQueue {
  let setWithdrawQueueEvent = changetype<SetWithdrawQueue>(newMockEvent())

  setWithdrawQueueEvent.parameters = new Array()

  setWithdrawQueueEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  setWithdrawQueueEvent.parameters.push(
    new ethereum.EventParam(
      "newWithdrawQueue",
      ethereum.Value.fromFixedBytesArray(newWithdrawQueue)
    )
  )

  return setWithdrawQueueEvent
}

export function createSubmitCapEvent(
  caller: Address,
  id: Bytes,
  cap: BigInt
): SubmitCap {
  let submitCapEvent = changetype<SubmitCap>(newMockEvent())

  submitCapEvent.parameters = new Array()

  submitCapEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  submitCapEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )
  submitCapEvent.parameters.push(
    new ethereum.EventParam("cap", ethereum.Value.fromUnsignedBigInt(cap))
  )

  return submitCapEvent
}

export function createSubmitFeeEvent(newFee: BigInt): SubmitFee {
  let submitFeeEvent = changetype<SubmitFee>(newMockEvent())

  submitFeeEvent.parameters = new Array()

  submitFeeEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return submitFeeEvent
}

export function createSubmitGuardianEvent(
  newGuardian: Address
): SubmitGuardian {
  let submitGuardianEvent = changetype<SubmitGuardian>(newMockEvent())

  submitGuardianEvent.parameters = new Array()

  submitGuardianEvent.parameters.push(
    new ethereum.EventParam(
      "newGuardian",
      ethereum.Value.fromAddress(newGuardian)
    )
  )

  return submitGuardianEvent
}

export function createSubmitTimelockEvent(newTimelock: BigInt): SubmitTimelock {
  let submitTimelockEvent = changetype<SubmitTimelock>(newMockEvent())

  submitTimelockEvent.parameters = new Array()

  submitTimelockEvent.parameters.push(
    new ethereum.EventParam(
      "newTimelock",
      ethereum.Value.fromUnsignedBigInt(newTimelock)
    )
  )

  return submitTimelockEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createTransferRewardsEvent(
  caller: Address,
  token: Address,
  amount: BigInt
): TransferRewards {
  let transferRewardsEvent = changetype<TransferRewards>(newMockEvent())

  transferRewardsEvent.parameters = new Array()

  transferRewardsEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  transferRewardsEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  transferRewardsEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return transferRewardsEvent
}

export function createUpdateLastTotalAssetsEvent(
  newTotalAssets: BigInt
): UpdateLastTotalAssets {
  let updateLastTotalAssetsEvent = changetype<UpdateLastTotalAssets>(
    newMockEvent()
  )

  updateLastTotalAssetsEvent.parameters = new Array()

  updateLastTotalAssetsEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalAssets",
      ethereum.Value.fromUnsignedBigInt(newTotalAssets)
    )
  )

  return updateLastTotalAssetsEvent
}

export function createWithdrawEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = new Array()

  withdrawEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return withdrawEvent
}
