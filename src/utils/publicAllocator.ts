import { Address, dataSource } from "@graphprotocol/graph-ts";

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

  if (network == "arbitrum-one") {
    return Address.fromString("0x769583Af5e9D03589F159EbEC31Cc2c23E8C355E");
  }

  if (network == "fraxtal") {
    return Address.fromString("0x37a888192165fC39884f87c64E2476BfD2C09675");
  }

  if (network == "ink") {
    return Address.fromString("0x85416891752a6B81106c1C2999AE1AF5d8Cd3357");
  }

  if (network == "matic") {
    return Address.fromString("0xfac15aff53ADd2ff80C2962127C434E8615Df0d3");
  }

  if (network == "scroll") {
    return Address.fromString("0x8a7f671E45E51dE245649Cf916cA0256FB8a9927");
  }

  if (network == "unichain") {
    return Address.fromString("0xB0c9a107fA17c779B3378210A7a593e88938C7C9");
  }

  if (network == "sonic") {
    return Address.fromString("0x6Cef2EDC70D87E8f1623f3096efF05d066E59B36");
  }

  return Address.zero();
}
