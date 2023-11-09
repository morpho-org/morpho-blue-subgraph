import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  FeeRecipient,
  MetaMorphoDeposit,
  MetaMorphoMarket,
  MetaMorphoPosition,
  NewQueue,
  PendingCap,
  PendingGuardian,
  PendingTimelock,
} from "../generated/schema";
import {
  AccrueFee as AccrueFeeEvent,
  Approval as ApprovalEvent,
  Deposit as DepositEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OwnershipTransferStarted as OwnershipTransferStartedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
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
  RevokeCap,
  RevokeGuardian,
  RevokeTimelock,
} from "../generated/templates/MetaMorpho/MetaMorpho";

import { toAssetsDown } from "./maths/shares";
import { AccountManager } from "./sdk/account";
import {
  loadMetaMorpho,
  loadMetaMorphoMarket,
  PendingValueStatus,
  QueueType,
  updateMMRate,
} from "./sdk/metamorpho";
import { TokenManager } from "./sdk/token";

export function handleAccrueFee(event: AccrueFeeEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.feeAccrued = mm.feeAccrued.plus(event.params.feeShares);
  // Convert to assets
  const feeAssets = toAssetsDown(
    event.params.feeShares,
    mm.totalShares,
    mm.lastTotalAssets
  );
  mm.feeAccruedAssets = mm.feeAccruedAssets.plus(feeAssets);
  mm.save();

  if (!mm.feeRecipient) {
    log.critical("MetaMorpho {} has no fee recipient", [
      event.address.toHexString(),
    ]);
    return;
  }
  const feeRecipient = FeeRecipient.load(mm.feeRecipient!);
  if (!feeRecipient) {
    log.critical("FeeRecipient {} not found", [mm.feeRecipient!.toHexString()]);
    return;
  }
  feeRecipient.feeAccrued = feeRecipient.feeAccrued.plus(
    event.params.feeShares
  );
  feeRecipient.feeAccruedAssets = feeRecipient.feeAccruedAssets.plus(feeAssets);
  feeRecipient.save();
}

export function handleApproval(event: ApprovalEvent): void {}

export function handleDeposit(event: DepositEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.totalShares = mm.totalShares.plus(event.params.shares);
  mm.save();

  const positionID = event.address.concat(event.params.owner);
  let position = MetaMorphoPosition.load(positionID);
  if (!position) {
    position = new MetaMorphoPosition(positionID);
    position.metaMorpho = mm.id;
    position.account = new AccountManager(event.params.owner).getAccount().id;
    position.shares = BigInt.zero();
    position.save();
  }
  position.shares = position.shares.plus(event.params.shares);

  const toAssets = toAssetsDown(
    event.params.shares,
    mm.totalShares,
    mm.lastTotalAssets
  );
  position.lastAssetsBalance = toAssets;

  const token = new TokenManager(mm.asset, event);
  position.lastAssetsBalanceUSD = token.getAmountUSD(toAssets);

  position.save();

  updateMMRate(event.address);

  const deposit = new MetaMorphoDeposit(
    event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  deposit.hash = event.transaction.hash;
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.gasPrice = event.transaction.gasPrice;
  deposit.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  deposit.gasLimit = event.transaction.gasLimit;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = position.account;
  deposit.accountActor = new AccountManager(
    event.params.sender
  ).getAccount().id;
  deposit.asset = mm.asset;
  deposit.amount = event.params.assets;
  deposit.amountUSD = token.getAmountUSD(event.params.assets);
  deposit.shares = event.params.shares;
  deposit.metaMorpho = mm.id;
  deposit.save();
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent
): void {}

export function handleOwnershipTransferStarted(
  event: OwnershipTransferStartedEvent
): void {}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  const mm = loadMetaMorpho(event.address);
  mm.owner = event.params.newOwner;
  mm.save();
}
//
// export function handleReallocateIdle(event: ReallocateIdleEvent): void {}
//
// export function handleReallocateSupply(event: ReallocateSupplyEvent): void {}
//
// export function handleReallocateWithdraw(
//   event: ReallocateWithdrawEvent
// ): void {}

export function handleRevokePendingCap(event: RevokeCap): void {
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);

  if (!mmMarket.currentPendingCap) {
    log.critical("MetaMorphoMarket {} has no pending cap", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingCap = PendingCap.load(mmMarket.currentPendingCap!);
  if (!pendingCap) {
    log.critical("PendingCap {} not found", [
      mmMarket.currentPendingCap!.toHexString(),
    ]);
    return;
  }

  pendingCap.status = PendingValueStatus.REJECTED;
  pendingCap.save();

  mmMarket.currentPendingCap = null;
  mmMarket.save();
}

export function handleRevokePendingGuardian(event: RevokeGuardian): void {
  const mm = loadMetaMorpho(event.address);
  if (!mm.currentPendingGuardian) {
    log.critical("MetaMorpho {} has no pending guardian", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingGuardian = PendingGuardian.load(mm.currentPendingGuardian!);
  if (!pendingGuardian) {
    log.critical("PendingGuardian {} not found", [
      mm.currentPendingGuardian!.toHexString(),
    ]);
    return;
  }
  pendingGuardian.status = PendingValueStatus.REJECTED;
  pendingGuardian.save();

  mm.currentPendingGuardian = null;
  mm.save();
}

export function handleRevokePendingTimelock(event: RevokeTimelock): void {
  const mm = loadMetaMorpho(event.address);
  if (!mm.currentPendingTimelock) {
    log.critical("MetaMorpho {} has no pending timelock", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingTimelock = PendingTimelock.load(mm.currentPendingTimelock!);
  if (!pendingTimelock) {
    log.critical("PendingTimelock {} not found", [
      mm.currentPendingTimelock!.toHexString(),
    ]);
    return;
  }
  pendingTimelock.status = PendingValueStatus.REJECTED;
  pendingTimelock.save();

  mm.currentPendingTimelock = null;
  mm.save();
}

export function handleSetCap(event: SetCapEvent): void {
  const mm = loadMetaMorpho(event.address);
  const mmMarket = loadMetaMorphoMarket(event.address, event.params.id);

  if (event.params.cap.gt(BigInt.zero()) && !mmMarket.isInWithdrawQueue) {
    const supplyQueue = mm.supplyQueue;
    supplyQueue.push(mmMarket.id);
    const withdrawQueue = mm.withdrawQueue;
    withdrawQueue.push(mmMarket.id);

    mm.supplyQueue = supplyQueue;
    mm.withdrawQueue = withdrawQueue;

    mm.save();
    mmMarket.withdrawRank = BigInt.fromI32(mm.withdrawQueue.length);
    mmMarket.isInSupplyQueue = true;
    mmMarket.isInWithdrawQueue = true;
    mmMarket.save();
  }

  mmMarket.cap = event.params.cap;
  if (mmMarket.currentPendingCap) {
    const pendingCap = PendingCap.load(mmMarket.currentPendingCap!);
    if (!pendingCap) {
      log.critical("PendingCap {} not found", [
        mmMarket.currentPendingCap!.toHexString(),
      ]);
      return;
    }
    pendingCap.status = pendingCap.cap.equals(event.params.cap)
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;

    pendingCap.save();
    mmMarket.currentPendingCap = null;
  }
  mmMarket.save();
}

export function handleSetCurator(event: SetCuratorEvent): void {}

export function handleSetFee(event: SetFeeEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.fee = event.params.newFee;
  mm.save();
}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {
  const mm = loadMetaMorpho(event.address);
  const currentFeeRecipient = mm.feeRecipient
    ? FeeRecipient.load(mm.feeRecipient!)
    : null;
  if (currentFeeRecipient) {
    currentFeeRecipient.isCurrentFeeRecipient = false;
    currentFeeRecipient.save();
  }
  let feeRecipient = FeeRecipient.load(event.params.newFeeRecipient);
  if (!feeRecipient) {
    feeRecipient = new FeeRecipient(event.params.newFeeRecipient);
    feeRecipient.account = new AccountManager(
      event.params.newFeeRecipient
    ).getAccount().id;
    feeRecipient.isCurrentFeeRecipient = true;
    feeRecipient.metaMorpho = mm.id;
    feeRecipient.feeAccrued = BigInt.zero();
    feeRecipient.feeAccruedAssets = BigInt.zero();
    feeRecipient.save();
  }
  mm.feeRecipient = feeRecipient.id;
  mm.save();
}

export function handleSetGuardian(event: SetGuardianEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingGuardian) {
    const pendingGuardian = PendingGuardian.load(mm.currentPendingGuardian!);
    if (!pendingGuardian) {
      log.critical("PendingGuardian {} not found", [
        mm.currentPendingGuardian!.toHexString(),
      ]);
      return;
    }
    pendingGuardian.status = pendingGuardian.guardian.equals(
      event.params.guardian
    )
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;
    pendingGuardian.save();
    mm.currentPendingGuardian = null;
  }
  mm.guardian = event.params.guardian;
  mm.save();
}

export function handleSetIsAllocator(event: SetIsAllocatorEvent): void {}

export function handleSetRewardsRecipient(
  event: SetRewardsRecipientEvent
): void {}

export function handleSetSupplyQueue(event: SetSupplyQueueEvent): void {
  // Supply queue on subgraph is a list of MetaMorphoMarket ids, not Market ids.
  const mm = loadMetaMorpho(event.address);
  const newSupplyQueue: Array<Bytes> = [];
  const addedMarkets: Array<Bytes> = [];
  const seen = new Map<Bytes, boolean>();
  for (let i = 0; i < event.params.newSupplyQueue.length; i++) {
    const mmMarket = loadMetaMorphoMarket(
      event.address,
      event.params.newSupplyQueue[i]
    );
    if (!mmMarket.isInSupplyQueue) {
      addedMarkets.push(mmMarket.id);
      mmMarket.isInSupplyQueue = true;
      mmMarket.save();
    }
    seen.set(mmMarket.id, true);
    newSupplyQueue.push(mmMarket.id);
  }
  const removedMarkets: Array<Bytes> = [];
  for (let i = 0; i < mm.supplyQueue.length; i++) {
    if (!seen.has(mm.supplyQueue[i])) {
      const mmMarket = loadMetaMorphoMarket(event.address, mm.supplyQueue[i]);
      mmMarket.isInSupplyQueue = false;
      mmMarket.save();
      removedMarkets.push(mmMarket.id);
    }
  }
  const newQueue = new NewQueue(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  newQueue.queueType = QueueType.SUPPLY_QUEUE;
  // TODO: add caller once redeployed
  newQueue.caller = new AccountManager(Address.zero()).getAccount().id;
  newQueue.metaMorpho = mm.id;
  newQueue.submittedAt = event.block.timestamp;
  newQueue.removedMarkets = removedMarkets;
  newQueue.previousQueue = mm.supplyQueue;
  newQueue.newQueue = newSupplyQueue;
  newQueue.addedMarkets = addedMarkets;
  newQueue.save();

  mm.supplyQueue = newSupplyQueue;
  mm.save();
}

export function handleSetTimelock(event: SetTimelockEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingTimelock) {
    const pendingTimelock = PendingTimelock.load(mm.currentPendingTimelock!);
    if (!pendingTimelock) {
      log.critical("PendingTimelock {} not found", [
        mm.currentPendingTimelock!.toHexString(),
      ]);
      return;
    }
    pendingTimelock.status = pendingTimelock.timelock.equals(
      event.params.newTimelock
    )
      ? PendingValueStatus.ACCEPTED
      : PendingValueStatus.OVERRIDDEN;

    pendingTimelock.save();
    mm.currentPendingTimelock = null;
  }
  mm.timelock = event.params.newTimelock;
  mm.save();
}

export function handleSetWithdrawQueue(event: SetWithdrawQueueEvent): void {
  // Withdraw queue on subgraph is a list of MetaMorphoMarket ids, not Market ids.
  const mm = loadMetaMorpho(event.address);
  const newWithdrawQueue: Array<Bytes> = [];
  const seen = new Map<Bytes, boolean>();
  for (let i = 0; i < event.params.newWithdrawQueue.length; i++) {
    const mmMarket = loadMetaMorphoMarket(
      event.address,
      event.params.newWithdrawQueue[i]
    );
    mmMarket.withdrawRank = BigInt.fromI32(i + 1);
    mmMarket.save();
    seen.set(mmMarket.id, true);
    newWithdrawQueue.push(mmMarket.id);
  }
  const removedMarkets: Array<Bytes> = [];
  for (let i = 0; i < mm.withdrawQueue.length; i++) {
    if (!seen.has(mm.withdrawQueue[i])) {
      // TODO: we can add a check that the supply on the market is 0
      const mmMarket = loadMetaMorphoMarket(event.address, mm.withdrawQueue[i]);
      mmMarket.withdrawRank = BigInt.zero();
      mmMarket.isInWithdrawQueue = false;
      mmMarket.save();
      removedMarkets.push(mmMarket.id);
    }
  }
  const newQueue = new NewQueue(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  newQueue.queueType = QueueType.WITHDRAW_QUEUE;
  // TODO: add caller once redeployed
  newQueue.caller = new AccountManager(Address.zero()).getAccount().id;
  newQueue.metaMorpho = mm.id;
  newQueue.submittedAt = event.block.timestamp;
  newQueue.removedMarkets = removedMarkets;
  newQueue.previousQueue = mm.withdrawQueue;
  newQueue.newQueue = newWithdrawQueue;
  newQueue.addedMarkets = []; // cannot add markets to the withdraw queue
  newQueue.save();

  mm.withdrawQueue = newWithdrawQueue;
  mm.save();
}

export function handleSubmitCap(event: SubmitCapEvent): void {
  const mm = loadMetaMorpho(event.address);
  const id = event.address
    .concat(event.params.id)
    .concat(Bytes.fromHexString(event.block.timestamp.toHexString()))
    .concat(Bytes.fromI32(event.logIndex.toI32()))
    .concat(Bytes.fromI32(event.transactionLogIndex.toI32()));

  const pendingCap = new PendingCap(id);
  pendingCap.metaMorpho = mm.id;
  pendingCap.cap = event.params.cap;

  const mmMarketId = event.address.concat(event.params.id);
  let metaMorphoMarket = MetaMorphoMarket.load(mmMarketId);

  pendingCap.isNewMarket =
    !metaMorphoMarket || metaMorphoMarket.cap === BigInt.zero();

  pendingCap.validAt = event.block.timestamp.plus(mm.timelock);
  pendingCap.submittedAt = event.block.timestamp;
  pendingCap.status = "PENDING";
  pendingCap.metaMorphoMarket = mmMarketId;
  pendingCap.save();

  if (!metaMorphoMarket) {
    // This is the only way to create a new MetaMorphoMarket
    metaMorphoMarket = new MetaMorphoMarket(mmMarketId);
    metaMorphoMarket.metaMorpho = mm.id;
    metaMorphoMarket.cap = BigInt.zero();
    metaMorphoMarket.market = event.params.id;
    metaMorphoMarket.withdrawRank = BigInt.zero();
    metaMorphoMarket.isInSupplyQueue = false;
    metaMorphoMarket.isInWithdrawQueue = false;
  }
  metaMorphoMarket.currentPendingCap = pendingCap.id;
  metaMorphoMarket.save();
}

export function handleSubmitFee(event: SubmitFeeEvent): void {
  // Fee submission is no longer subject to a timelock, will be removed in last update.
}

export function handleSubmitGuardian(event: SubmitGuardianEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.currentPendingGuardian) {
    log.critical("MetaMorpho {} already has a pending guardian", [
      event.address.toHexString(),
    ]);
    return;
  }
  const id = event.address
    .concat(Bytes.fromHexString(event.block.timestamp.toHexString()))
    .concat(Bytes.fromI32(event.logIndex.toI32()))
    .concat(Bytes.fromI32(event.transactionLogIndex.toI32()));

  const pendingGuardian = new PendingGuardian(id);
  pendingGuardian.metaMorpho = mm.id;
  pendingGuardian.guardian = event.params.newGuardian;
  pendingGuardian.submittedAt = event.block.timestamp;
  pendingGuardian.validAt = event.block.timestamp.plus(mm.timelock);
  pendingGuardian.status = PendingValueStatus.PENDING;
  pendingGuardian.save();

  mm.currentPendingGuardian = pendingGuardian.id;
  mm.save();
}

export function handleSubmitTimelock(event: SubmitTimelockEvent): void {
  const mm = loadMetaMorpho(event.address);
  if (mm.pendingTimelock) {
    log.critical("MetaMorpho {} already has a pending timelock", [
      event.address.toHexString(),
    ]);
    return;
  }
  const pendingTimelock = new PendingTimelock(
    event.address
      .concat(Bytes.fromI32(event.block.timestamp.toI32()))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
      .concat(Bytes.fromI32(event.transactionLogIndex.toI32()))
  );
  pendingTimelock.timelock = event.params.newTimelock;
  pendingTimelock.metaMorpho = mm.id;
  pendingTimelock.submittedAt = event.block.timestamp;
  pendingTimelock.validAt = event.block.timestamp.plus(mm.timelock);
  pendingTimelock.status = PendingValueStatus.PENDING;
  pendingTimelock.save();

  mm.currentPendingTimelock = pendingTimelock.id;
  mm.save();
}

export function handleTransfer(event: TransferEvent): void {
  updateMMRate(event.address);
}

export function handleTransferRewards(event: TransferRewardsEvent): void {}

export function handleUpdateLastTotalAssets(
  event: UpdateLastTotalAssetsEvent
): void {
  const mm = loadMetaMorpho(event.address);
  mm.lastTotalAssets = event.params.newTotalAssets;
  mm.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const mm = loadMetaMorpho(event.address);
  mm.totalShares = mm.totalShares.minus(event.params.shares);
  mm.save();

  updateMMRate(event.address);
}
