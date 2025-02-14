import { Address, dataSource, log } from "@graphprotocol/graph-ts";

export function getPublicAllocatorAddress(): Address {
  const network = dataSource.network();
  switch (network) {
    case "mainnet":
      return Address.fromString("0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D");
    case "base":
      return Address.fromString("0xA090dD1a701408Df1d4d0B85b716c87565f90467");
    case "optimism":
      return Address.fromString("0x0d68a97324E602E02799CD83B42D337207B40658");
    case "arbitrum-one":
      return Address.fromString("0x769583Af5e9D03589F159EbEC31Cc2c23E8C355E");
    case "fraxtal":
      return Address.fromString("0x37a888192165fC39884f87c64E2476BfD2C09675");
    default:
      return Address.zero();
  }
}
