import { BigInt } from "@graphprotocol/graph-ts";

export const zeroFlorSub = (a: BigInt, b: BigInt): BigInt => {
  if (a.lt(b)) {
    return BigInt.zero();
  }
  return a.minus(b);
};
