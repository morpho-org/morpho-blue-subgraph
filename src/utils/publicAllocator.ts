import { Address, dataSource, log } from "@graphprotocol/graph-ts";

export function getPublicAllocatorAddress(): Address {
  const network = dataSource.network();
  if (network === "mainnet") {
    return Address.fromString("0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D");
  }
  if (network === "base") {
    return Address.fromString("0xA090dD1a701408Df1d4d0B85b716c87565f90467");
  }

  log.critical("No public allocator for network: {}", [network]);
  return Address.zero();
}
