import { BigInt } from "@graphprotocol/graph-ts";

import { BIGINT_WAD } from "../sdk/constants";

import { mulDivDown, mulDivUp } from "./maths";

const VIRTUAL_SHARES = BIGINT_WAD;
const VIRTUAL_ASSETS = BigInt.zero();

export function toAssetsUp(
  shares: BigInt,
  totalShares: BigInt,
  totalAssets: BigInt
): BigInt {
  return mulDivUp(
    shares,
    totalAssets.plus(VIRTUAL_ASSETS),
    totalShares.plus(VIRTUAL_SHARES)
  );
}

export function toAssetsDown(
  shares: BigInt,
  totalShares: BigInt,
  totalAssets: BigInt
): BigInt {
  return mulDivDown(
    shares,
    totalAssets.plus(VIRTUAL_ASSETS),
    totalShares.plus(VIRTUAL_SHARES)
  );
}
