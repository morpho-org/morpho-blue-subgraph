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
  MarketFlowCapsSet,
  MetaMorpho,
  MetaMorphoAllocator,
  MetaMorphoPublicAllocator,
  MetaMorphoPublicAllocatorMarket,
  PublicAllocatorReallocationToEvent,
  PublicAllocatorWithdrawalEvent,
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
    paMarket.metaMorpho = paVault.id;

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
  marketFlowCapsSet.metaMorpho = paMarket.metaMorpho;
  marketFlowCapsSet.market = paMarket.market;

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
  reallocateToEvent.metaMorpho = paMarket.metaMorpho;
  reallocateToEvent.market = paMarket.id;
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

  const paMarket = loadPublicAllocatorMarket(
    event.params.vault,
    event.params.id
  );
  const newFlowCapOut = paMarket.flowCapIn.minus(event.params.withdrawnAssets);

  const eventId = event.transaction.hash.concat(
    Bytes.fromI32(event.logIndex.toI32())
  );

  const marketFlowCapsSet = new MarketFlowCapsSet(eventId);
  marketFlowCapsSet.metaMorpho = paMarket.metaMorpho;
  marketFlowCapsSet.market = paMarket.market;

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
  withdrawalEvent.metaMorpho = paMarket.metaMorpho;
  withdrawalEvent.market = paMarket.id;
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
}

export function handleSetFee(event: SetFee): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
}

export function handleSetFlowCaps(event: SetFlowCaps): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
  const mm = loadMetaMorpho(event.params.vault);
}

export function handleTransferFee(event: TransferFee): void {
  if (!metaMorphoExists(event.params.vault)) {
    return;
  }
}
