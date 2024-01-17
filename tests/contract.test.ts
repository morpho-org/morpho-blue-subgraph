import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { AccrueInterest } from "../generated/schema"
import { AccrueInterest as AccrueInterestEvent } from "../generated/Contract/Contract"
import { handleAccrueInterest } from "../src/contract"
import { createAccrueInterestEvent } from "./contract-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let newTotalAssets = BigInt.fromI32(234)
    let feeShares = BigInt.fromI32(234)
    let newAccrueInterestEvent = createAccrueInterestEvent(
      newTotalAssets,
      feeShares
    )
    handleAccrueInterest(newAccrueInterestEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccrueInterest created and stored", () => {
    assert.entityCount("AccrueInterest", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AccrueInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newTotalAssets",
      "234"
    )
    assert.fieldEquals(
      "AccrueInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeShares",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
