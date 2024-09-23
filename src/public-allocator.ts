import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  PublicReallocateTo,
  PublicWithdrawal,
  SetAdmin,
  SetFee,
  SetFlowCaps,
  TransferFee,
} from "../generated/PublicAllocator/PublicAllocator";
import {
  Account,
  MarketFlowCapsSet,
  MetaMorpho,
  MetaMorphoAllocator,
  MetaMorphoPublicAllocator,
  MetaMorphoPublicAllocatorMarket,
  PublicAllocatorReallocationToEvent,
  PublicAllocatorWithdrawalEvent,
  SetFlowCapsEvent,
} from "../generated/schema";

import { loadMetaMorpho, loadMetaMorphoMarket } from "./sdk/metamorpho";
import { getPublicAllocatorAddress } from "./utils/publicAllocator";

export function loadPublicAllocatorVault(
  metaMorpho: Address
): MetaMorphoPublicAllocator {
  const id = getPublicAllocatorAddress().concat(metaMorpho);

  let pa = MetaMorphoPublicAllocator.load(id);

  if (!pa) {
    pa = new MetaMorphoPublicAllocator(id);

    const mmAllocator = MetaMorphoAllocator.load(id);
    if (mmAllocator) {
      // a vault owner can set flow caps before having set a public allocator.
      // in this case, allocator is added dynamically.
      pa.allocator = mmAllocator.id;
    }
    const mm = loadMetaMorpho(metaMorpho);
    pa.metaMorpho = mm.id;

    pa.fee = BigInt.zero();
    pa.accruedFee = BigInt.zero();
    pa.claimableFee = BigInt.zero();
    pa.claimedFee = BigInt.zero();
    pa.save();
  }
  return pa;
}

export function loadPublicAllocatorMarket(
  metaMorpho: Address,
  market: Bytes
): MetaMorphoPublicAllocatorMarket {
  const id = metaMorpho.concat(market);
  let paMarket = MetaMorphoPublicAllocatorMarket.load(id);

  if (!paMarket) {
    paMarket = new MetaMorphoPublicAllocatorMarket(id);

    const mmMarket = loadMetaMorphoMarket(metaMorpho, market);
    paMarket.market = mmMarket.id;

    const paVault = loadPublicAllocatorVault(metaMorpho);
    paMarket.metaMorphoPublicAllocator = paVault.id;

    paMarket.flowCapIn = BigInt.zero();
    paMarket.flowCapOut = BigInt.zero();

    paMarket.save();
  }
  return paMarket;
}

/**
 * Public allocator can be defined for any address, even if its not a vault.
 * The indexer supports only metaMorpho created through the factory.
 * These vaults cannot have a config defined before creation, because of the msg.sender === vault.owner() check.
 * @param address the address of the vault
 */
function metaMorphoExists(address: Address): boolean {
  const mm = MetaMorpho.load(address);
  return mm !== null;
}

export function handlePublicReallocateTo(event: PublicReallocateTo): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }

  const paMarket = loadPublicAllocatorMarket(
    event.params.vault,
    event.params.supplyMarketId
  );
  const newFlowCapIn = paMarket.flowCapIn.minus(event.params.suppliedAssets);

  const eventId = event.transaction.hash.concat(
    Bytes.fromI32(event.logIndex.toI32())
  );

  const marketFlowCapsSet = new MarketFlowCapsSet(eventId);
  marketFlowCapsSet.metaMorphoPublicAllocator =
    paMarket.metaMorphoPublicAllocator;
  marketFlowCapsSet.marketPublicAllocator = paMarket.market;

  marketFlowCapsSet.prevFlowCapIn = paMarket.flowCapIn;
  marketFlowCapsSet.flowCapIn = newFlowCapIn;

  marketFlowCapsSet.prevFlowCapOut = paMarket.flowCapOut;
  marketFlowCapsSet.flowCapOut = paMarket.flowCapOut;

  const reallocateToEvent = new PublicAllocatorReallocationToEvent(eventId);

  reallocateToEvent.hash = event.transaction.hash;
  reallocateToEvent.nonce = event.transaction.nonce;
  reallocateToEvent.logIndex = event.logIndex.toI32();
  reallocateToEvent.gasPrice = event.transaction.gasPrice;
  reallocateToEvent.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  reallocateToEvent.gasLimit = event.transaction.gasLimit;
  reallocateToEvent.blockNumber = event.block.number;
  reallocateToEvent.timestamp = event.block.timestamp;
  reallocateToEvent.metaMorphoPublicAllocator =
    paMarket.metaMorphoPublicAllocator;
  reallocateToEvent.marketPublicAllocator = paMarket.id;
  reallocateToEvent.suppliedAssets = event.params.suppliedAssets;
  reallocateToEvent.save();

  marketFlowCapsSet.publicReallocationEvent = reallocateToEvent.id;
  marketFlowCapsSet.save();
  paMarket.flowCapIn = newFlowCapIn;
  paMarket.save();
}

export function handlePublicWithdrawal(event: PublicWithdrawal): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }

  const paVault = loadPublicAllocatorVault(event.params.vault);
  paVault.accruedFee = paVault.accruedFee.plus(paVault.fee);
  paVault.claimableFee = paVault.claimableFee.plus(paVault.fee);
  paVault.save();

  const paMarket = loadPublicAllocatorMarket(
    event.params.vault,
    event.params.id
  );
  const newFlowCapOut = paMarket.flowCapIn.minus(event.params.withdrawnAssets);

  const eventId = event.transaction.hash.concat(
    Bytes.fromI32(event.logIndex.toI32())
  );

  const marketFlowCapsSet = new MarketFlowCapsSet(eventId);
  marketFlowCapsSet.metaMorphoPublicAllocator =
    paMarket.metaMorphoPublicAllocator;
  marketFlowCapsSet.marketPublicAllocator = paMarket.market;

  marketFlowCapsSet.prevFlowCapIn = paMarket.flowCapIn;
  marketFlowCapsSet.flowCapIn = paMarket.flowCapIn;

  marketFlowCapsSet.prevFlowCapOut = paMarket.flowCapOut;
  marketFlowCapsSet.flowCapOut = newFlowCapOut;

  const withdrawalEvent = new PublicAllocatorWithdrawalEvent(eventId);

  withdrawalEvent.hash = event.transaction.hash;
  withdrawalEvent.nonce = event.transaction.nonce;
  withdrawalEvent.logIndex = event.logIndex.toI32();
  withdrawalEvent.gasPrice = event.transaction.gasPrice;
  withdrawalEvent.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  withdrawalEvent.gasLimit = event.transaction.gasLimit;
  withdrawalEvent.blockNumber = event.block.number;
  withdrawalEvent.timestamp = event.block.timestamp;
  withdrawalEvent.metaMorphoPublicAllocator =
    paMarket.metaMorphoPublicAllocator;
  withdrawalEvent.marketPublicAllocator = paMarket.id;
  withdrawalEvent.withdrawnAssets = event.params.withdrawnAssets;
  withdrawalEvent.save();

  marketFlowCapsSet.publicWithdrawalEvent = withdrawalEvent.id;
  marketFlowCapsSet.save();
  paMarket.flowCapOut = newFlowCapOut;
  paMarket.save();
}

export function handleSetAdmin(event: SetAdmin): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
  const paVault = loadPublicAllocatorVault(event.params.vault);
  paVault.admin = new Account(event.params.admin).id;
  paVault.save();
}

export function handleSetFee(event: SetFee): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
  const paVault = loadPublicAllocatorVault(event.params.vault);
  paVault.fee = event.params.fee;
  paVault.save();
}

export function handleSetFlowCaps(event: SetFlowCaps): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
  const paVault = loadPublicAllocatorVault(event.params.vault);

  const eventId = event.transaction.hash.concat(
    Bytes.fromI32(event.logIndex.toI32())
  );

  const setFlowCapsEvent = new SetFlowCapsEvent(eventId);

  setFlowCapsEvent.hash = event.transaction.hash;
  setFlowCapsEvent.nonce = event.transaction.nonce;
  setFlowCapsEvent.logIndex = event.logIndex.toI32();
  setFlowCapsEvent.gasPrice = event.transaction.gasPrice;
  setFlowCapsEvent.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  setFlowCapsEvent.gasLimit = event.transaction.gasLimit;
  setFlowCapsEvent.blockNumber = event.block.number;
  setFlowCapsEvent.timestamp = event.block.timestamp;
  setFlowCapsEvent.metaMorphoPublicAllocator = paVault.id;

  setFlowCapsEvent.save();

  for (let i = 0; i < event.params.config.length; i++) {
    const config = event.params.config[i];

    const paMarket = loadPublicAllocatorMarket(event.params.vault, config.id);

    const marketFlowCapsSet = new MarketFlowCapsSet(eventId.concat(config.id));
    marketFlowCapsSet.metaMorphoPublicAllocator =
      paMarket.metaMorphoPublicAllocator;
    marketFlowCapsSet.marketPublicAllocator = paMarket.id;
    marketFlowCapsSet.prevFlowCapIn = paMarket.flowCapIn;
    marketFlowCapsSet.flowCapIn = config.caps.maxIn;
    marketFlowCapsSet.prevFlowCapOut = paMarket.flowCapOut;
    marketFlowCapsSet.flowCapOut = config.caps.maxOut;
    marketFlowCapsSet.setFlowCapsEvent = setFlowCapsEvent.id;
    marketFlowCapsSet.save();

    paMarket.flowCapIn = config.caps.maxIn;
    paMarket.flowCapOut = config.caps.maxOut;
    paMarket.save();
  }
}

export function handleTransferFee(event: TransferFee): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
  const pa = loadPublicAllocatorVault(event.params.vault);
  pa.claimableFee = pa.claimableFee.minus(event.params.amount);
  pa.claimedFee = pa.claimedFee.plus(event.params.amount);
  pa.save();
}
