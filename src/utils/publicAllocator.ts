import { Address, dataSource, log } from "@graphprotocol/graph-ts";

export function getPublicAllocatorAddress(): Address {
  const network = dataSource.network();
  if (network == "mainnet") {
    return Address.fromString("0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D");
  }

  if (network == "base") {
    return Address.fromString("0xA090dD1a701408Df1d4d0B85b716c87565f90467");
  }

  if (network == "optimism") {
    return Address.fromString("0x0d68a97324E602E02799CD83B42D337207B40658");
  }

  log.warning("Unsupported Network id: {}", [network]);
  return Address.zero();
}
