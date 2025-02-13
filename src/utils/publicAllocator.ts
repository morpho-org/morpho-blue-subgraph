import { Address, dataSource } from "@graphprotocol/graph-ts";

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
    case "ink":
      return Address.fromString("0x85416891752a6B81106c1C2999AE1AF5d8Cd3357");
    case "matic":
      return Address.fromString("0xfac15aff53ADd2ff80C2962127C434E8615Df0d3");
    case "scroll":
      return Address.fromString("0x8a7f671E45E51dE245649Cf916cA0256FB8a9927");
    default:
      return Address.zero();
  }
}
