import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { NewCrowdFundingContractCreated } from "../generated/schema"
import { NewCrowdFundingContractCreated as NewCrowdFundingContractCreatedEvent } from "../generated/Contract/Contract"
import { handleNewCrowdFundingContractCreated } from "../src/contract"
import { createNewCrowdFundingContractCreatedEvent } from "./contract-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let owner = Address.fromString("0x0000000000000000000000000000000000000001")
    let amount = BigInt.fromI32(234)
    let cloneAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let fundingDetailsId = "Example string value"
    let duration = BigInt.fromI32(234)
    let category = "Example string value"
    let newNewCrowdFundingContractCreatedEvent =
      createNewCrowdFundingContractCreatedEvent(
        owner,
        amount,
        cloneAddress,
        fundingDetailsId,
        duration,
        category
      )
    handleNewCrowdFundingContractCreated(newNewCrowdFundingContractCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewCrowdFundingContractCreated created and stored", () => {
    assert.entityCount("NewCrowdFundingContractCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "owner",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "cloneAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fundingDetailsId",
      "Example string value"
    )
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "duration",
      "234"
    )
    assert.fieldEquals(
      "NewCrowdFundingContractCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "category",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
