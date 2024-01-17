import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { ChainlinkPriceFeed } from "../generated/MorphoBlue/ChainlinkPriceFeed";
import { WstEth } from "../generated/MorphoBlue/WstEth";

import { BIGDECIMAL_WAD, BIGINT_WAD } from "./sdk/constants";

const wbib01 = Address.fromString("0xca2a7068e551d5c4482eb34880b194e4b945712f");
const wstEth = Address.fromString("0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0");
const weth = Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
const usdc = Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const usdPriceFeeds = new Map<Address, Address>();
usdPriceFeeds.set(
  wbib01,
  Address.fromString("0x32d1463EB53b73C095625719Afa544D5426354cB")
);
usdPriceFeeds.set(
  weth,
  Address.fromString("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419")
);
usdPriceFeeds.set(
  usdc,
  Address.fromString("0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6")
);

export function fetchUsdTokenPrice(tokenAddress: Address): BigDecimal {
  log.warning("fetchUsdTokenPrice({})", [tokenAddress.toHexString()]);
  if (usdPriceFeeds.has(tokenAddress)) {
    const chainlinkPriceFeed = ChainlinkPriceFeed.bind(
      usdPriceFeeds.get(tokenAddress)
    );
    return chainlinkPriceFeed
      .latestRoundData()
      .getAnswer()
      .toBigDecimal()
      .div(
        BigInt.fromString("10")
          .pow(8 as u8)
          .toBigDecimal()
      );
  }

  if (tokenAddress.equals(wstEth)) {
    const wstEthContract = WstEth.bind(wstEth);
    return wstEthContract
      .getStETHByWstETH(BIGINT_WAD)
      .toBigDecimal()
      .div(BIGDECIMAL_WAD)
      .times(fetchUsdTokenPrice(weth));
  }

  return BigDecimal.zero();
}
