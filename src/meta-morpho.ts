import {
  AccrueFee as AccrueFeeEvent,
  Approval as ApprovalEvent,
  Deposit as DepositEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OwnershipTransferStarted as OwnershipTransferStartedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  ReallocateIdle as ReallocateIdleEvent,
  ReallocateSupply as ReallocateSupplyEvent,
  ReallocateWithdraw as ReallocateWithdrawEvent,
  RevokePendingCap as RevokePendingCapEvent,
  RevokePendingGuardian as RevokePendingGuardianEvent,
  RevokePendingTimelock as RevokePendingTimelockEvent,
  SetCap as SetCapEvent,
  SetCurator as SetCuratorEvent,
  SetFee as SetFeeEvent,
  SetFeeRecipient as SetFeeRecipientEvent,
  SetGuardian as SetGuardianEvent,
  SetIsAllocator as SetIsAllocatorEvent,
  SetRewardsRecipient as SetRewardsRecipientEvent,
  SetSupplyQueue as SetSupplyQueueEvent,
  SetTimelock as SetTimelockEvent,
  SetWithdrawQueue as SetWithdrawQueueEvent,
  SubmitCap as SubmitCapEvent,
  SubmitFee as SubmitFeeEvent,
  SubmitGuardian as SubmitGuardianEvent,
  SubmitTimelock as SubmitTimelockEvent,
  Transfer as TransferEvent,
  TransferRewards as TransferRewardsEvent,
  UpdateLastTotalAssets as UpdateLastTotalAssetsEvent,
  Withdraw as WithdrawEvent,
} from "../generated/templates/MetaMorpho/MetaMorpho";

export function handleAccrueFee(event: AccrueFeeEvent): void {}

export function handleApproval(event: ApprovalEvent): void {}

export function handleDeposit(event: DepositEvent): void {}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent
): void {}

export function handleOwnershipTransferStarted(
  event: OwnershipTransferStartedEvent
): void {}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {}

export function handleReallocateIdle(event: ReallocateIdleEvent): void {}

export function handleReallocateSupply(event: ReallocateSupplyEvent): void {}

export function handleReallocateWithdraw(
  event: ReallocateWithdrawEvent
): void {}

export function handleRevokePendingCap(event: RevokePendingCapEvent): void {}

export function handleRevokePendingGuardian(
  event: RevokePendingGuardianEvent
): void {}

export function handleRevokePendingTimelock(
  event: RevokePendingTimelockEvent
): void {}

export function handleSetCap(event: SetCapEvent): void {}

export function handleSetCurator(event: SetCuratorEvent): void {}

export function handleSetFee(event: SetFeeEvent): void {}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {}

export function handleSetGuardian(event: SetGuardianEvent): void {}

export function handleSetIsAllocator(event: SetIsAllocatorEvent): void {}

export function handleSetRewardsRecipient(
  event: SetRewardsRecipientEvent
): void {}

export function handleSetSupplyQueue(event: SetSupplyQueueEvent): void {}

export function handleSetTimelock(event: SetTimelockEvent): void {}

export function handleSetWithdrawQueue(event: SetWithdrawQueueEvent): void {}

export function handleSubmitCap(event: SubmitCapEvent): void {}

export function handleSubmitFee(event: SubmitFeeEvent): void {}

export function handleSubmitGuardian(event: SubmitGuardianEvent): void {}

export function handleSubmitTimelock(event: SubmitTimelockEvent): void {}

export function handleTransfer(event: TransferEvent): void {}

export function handleTransferRewards(event: TransferRewardsEvent): void {}

export function handleUpdateLastTotalAssets(
  event: UpdateLastTotalAssetsEvent
): void {}

export function handleWithdraw(event: WithdrawEvent): void {}
