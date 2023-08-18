import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";

import { Bytes, BigInt } from "@graphprotocol/graph-ts";

import { handleAccrueInterests } from "../src/morpho-blue";

import { createAccrueInterestsEvent } from "./morpho-blue-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let id = Bytes.fromI32(1234567890);
    let prevBorrowRate = BigInt.fromI32(234);
    let accruedInterests = BigInt.fromI32(234);
    let feeShares = BigInt.fromI32(234);
    let newAccrueInterestsEvent = createAccrueInterestsEvent(
      id,
      prevBorrowRate,
      accruedInterests,
      feeShares
    );
    handleAccrueInterests(newAccrueInterestsEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("ExampleEntity created and stored", () => {
    assert.entityCount("ExampleEntity", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ExampleEntity",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      "prevBorrowRate",
      "234"
    );
    assert.fieldEquals(
      "ExampleEntity",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      "accruedInterests",
      "234"
    );
    assert.fieldEquals(
      "ExampleEntity",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      "feeShares",
      "234"
    );

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
