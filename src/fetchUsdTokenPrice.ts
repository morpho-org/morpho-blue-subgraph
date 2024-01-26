import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { ChainlinkPriceFeed } from "../generated/MorphoBlue/ChainlinkPriceFeed";
import { ERC4626 } from "../generated/MorphoBlue/ERC4626";
import { WstEth } from "../generated/MorphoBlue/WstEth";

import { BIGDECIMAL_WAD, BIGINT_WAD } from "./sdk/constants";

// I'm wrapping addresses and formatting them back to string to ensure resilience with capitalization.
const wbib01 = Address.fromString(
  "0xca2a7068e551d5c4482eb34880b194e4b945712f"
).toHexString();
const wstEth = Address.fromString(
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
).toHexString();
const weth = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
).toHexString();
const wbtc = Address.fromString(
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
).toHexString();
const usdc = Address.fromString(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
).toHexString();

const sdai = Address.fromString(
  "0x83F20F44975D03b1b09e64809B757c47f942BEeA"
).toHexString();
const dai = Address.fromString(
  "0x6B175474E89094C44Da98b954EedeAC495271d0F"
).toHexString();

const usdPriceFeeds = new Map<string, string>()
  .set(
    wbib01,
    Address.fromString(
      "0x32d1463EB53b73C095625719Afa544D5426354cB"
    ).toHexString()
  )
  .set(
    wbtc,
    Address.fromString(
      "0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23"
    ).toHexString()
  )
  .set(
    weth,
    Address.fromString(
      "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    ).toHexString()
  )
  .set(
    usdc,
    Address.fromString(
      "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"
    ).toHexString()
  )
  .set(
    dai,
    Address.fromString(
      "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
    ).toHexString()
  );

export function fetchUsdTokenPrice(tokenAddress: Address): BigDecimal {
  log.warning("fetchUsdTokenPrice({})", [tokenAddress.toHexString()]);
  log.info("fetchUsdTokenPrice({})", [tokenAddress.toHexString()]);
  log.error("fetchUsdTokenPrice({})", [tokenAddress.toHexString()]);
  if (usdPriceFeeds.has(tokenAddress.toHexString())) {
    const chainlinkPriceFeed = ChainlinkPriceFeed.bind(
      Address.fromString(usdPriceFeeds.get(tokenAddress.toHexString()))
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

  if (tokenAddress.equals(Address.fromString(wstEth))) {
    const wstEthContract = WstEth.bind(Address.fromString(wstEth));
    return wstEthContract
      .getStETHByWstETH(BIGINT_WAD)
      .toBigDecimal()
      .div(BIGDECIMAL_WAD)
      .times(fetchUsdTokenPrice(Address.fromString(weth)));
  }
  if (tokenAddress.equals(Address.fromString(sdai))) {
    const sDaiContract = ERC4626.bind(Address.fromString(sdai));
    return sDaiContract
      .convertToAssets(BIGINT_WAD)
      .toBigDecimal()
      .div(BIGDECIMAL_WAD)
      .times(fetchUsdTokenPrice(Address.fromString(dai)));
  }

  return BigDecimal.zero();
}
