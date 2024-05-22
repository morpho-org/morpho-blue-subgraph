import { BigInt, log } from "@graphprotocol/graph-ts";

import { InterestRate } from "../../generated/schema";

export function cloneRate(rateId: string, timestamp: BigInt): InterestRate {
  const rate = InterestRate.load(rateId);
  if (!rate) {
    log.critical("InterestRate {} not found", [rateId]);
    return new InterestRate("");
  }

  const newRateId = rate.id + "-" + timestamp.toString();
  let newRate = InterestRate.load(newRateId);
  if (newRate) {
    return newRate as InterestRate;
  }

  newRate = new InterestRate(newRateId);
  newRate.rate = rate.rate;
  newRate.market = rate.market;
  newRate.side = rate.side;
  newRate.type = rate.type;
  newRate.save();

  return newRate;
}

export function cloneRates(rateIds: string[], timestamp: BigInt): string[] {
  const rates: string[] = [];
  for (let i = 0; i < rateIds.length; i++) {
    log.info("rateId: {}", [rateIds[i]]);
    rates.push(cloneRate(rateIds[i], timestamp).id);
  }
  return rates;
}
