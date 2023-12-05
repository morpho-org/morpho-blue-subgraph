import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { CreateMetaMorpho } from "../generated/schema"
import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../generated/MetaMorphoFactory/MetaMorphoFactory"
import { handleCreateMetaMorpho } from "../src/meta-morpho-factory"
import { createCreateMetaMorphoEvent } from "./meta-morpho-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let metaMorpho = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let initialOwner = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let initialTimelock = BigInt.fromI32(234)
    let asset = Address.fromString("0x0000000000000000000000000000000000000001")
    let name = "Example string value"
    let symbol = "Example string value"
    let salt = Bytes.fromI32(1234567890)
    let newCreateMetaMorphoEvent = createCreateMetaMorphoEvent(
      metaMorpho,
      caller,
      initialOwner,
      initialTimelock,
      asset,
      name,
      symbol,
      salt
    )
    handleCreateMetaMorpho(newCreateMetaMorphoEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CreateMetaMorpho created and stored", () => {
    assert.entityCount("CreateMetaMorpho", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metaMorpho",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "caller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "initialOwner",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "initialTimelock",
      "234"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "asset",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "name",
      "Example string value"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "symbol",
      "Example string value"
    )
    assert.fieldEquals(
      "CreateMetaMorpho",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "salt",
      "1234567890"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
