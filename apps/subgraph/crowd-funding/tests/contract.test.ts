import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach,
  beforeAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  handleNewCrowdFundingContractCreated,
  handleDonationReceived,
  handleDonationWithdrawn,
  handleMilestoneCreated,
  handleVotedOnMilestone,
  handleMilestoneStatusUpdated,
  handleMilestoneWithdrawn,
  handleCampaignEnded
} from "../src/contract"
import {
  createNewCrowdFundingContractCreatedEvent,
  createDonationReceivedEvent,
  createDonationWithdrawnEvent,
  createMilestoneCreatedEvent,
  createVotedOnMilestoneEvent,
  createMilestoneStatusUpdatedEvent,
  createMilestoneWithdrawnEvent,
  createCampaignEndedEvent
} from "./contract-utils"

// Test addresses
const OWNER_ADDRESS = "0x0000000000000000000000000000000000000001"
const PROJECT_ADDRESS = "0x0000000000000000000000000000000000000002"
const DONOR1_ADDRESS = "0x0000000000000000000000000000000000000003"
const DONOR2_ADDRESS = "0x0000000000000000000000000000000000000004"

describe("Campaign Creation Tests", () => {
  afterEach(() => {
    clearStore()
  })

  test("Should create campaign entity when NewCrowdFundingContractCreated event is emitted", () => {
    let owner = Address.fromString(OWNER_ADDRESS)
    let contractAddress = Address.fromString(PROJECT_ADDRESS)
    let contractDetailsId = "QmTestCID123"
    let title = "Test Campaign Title"
    let category = 0 // TECHNOLOGY
    let duration = BigInt.fromI32(30 * 24 * 60 * 60) // 30 days
    let goal = BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)) // 10 ETH

    let event = createNewCrowdFundingContractCreatedEvent(
      owner,
      contractAddress,
      contractDetailsId,
      title,
      category,
      duration,
      goal
    )

    handleNewCrowdFundingContractCreated(event)

    // Check Campaign entity
    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    assert.entityCount("Campaign", 1)
    assert.fieldEquals("Campaign", campaignId, "campaignCID", contractDetailsId)
    assert.fieldEquals("Campaign", campaignId, "owner", OWNER_ADDRESS)
    assert.fieldEquals("Campaign", campaignId, "category", "0")
    assert.fieldEquals("Campaign", campaignId, "amountSought", goal.toString())
    assert.fieldEquals("Campaign", campaignId, "campaignRunning", "true")
    assert.fieldEquals("Campaign", campaignId, "active", "true")
    assert.fieldEquals("Campaign", campaignId, "backers", "0")
    assert.fieldEquals("Campaign", campaignId, "amountRaised", "0")

    // Check CampaignCreator entity
    assert.entityCount("CampaignCreator", 1)
    assert.fieldEquals("CampaignCreator", OWNER_ADDRESS, "fundingGiven", "0")
    assert.fieldEquals("CampaignCreator", OWNER_ADDRESS, "fundingWithdrawn", "0")

    // Check Statistic entity
    let statsId = Bytes.fromUTF8("0x26471bEF27bA75c8965fCD382c89121d5d70B49a").toHexString()
    assert.entityCount("Statistic", 1)
    assert.fieldEquals("Statistic", statsId, "totalContracts", "1")
    assert.fieldEquals("Statistic", statsId, "totalBackers", "0")
  })
})

describe("Donation Tests", () => {
  beforeEach(() => {
    // Create a campaign first
    let event = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(event)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should create donation and update campaign stats", () => {
    let donor = Address.fromString(DONOR1_ADDRESS)
    let project = Address.fromString(PROJECT_ADDRESS)
    let amount = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18)) // 5 ETH
    let date = BigInt.fromI32(1000000)

    let event = createDonationReceivedEvent(donor, amount, project, date)
    handleDonationReceived(event)

    // Check Donation entity
    assert.entityCount("Donation", 1)

    // Check Campaign updated
    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    assert.fieldEquals("Campaign", campaignId, "amountRaised", amount.toString())
    assert.fieldEquals("Campaign", campaignId, "backers", "1")

    // Check Donor entity
    assert.entityCount("Donor", 1)
    assert.fieldEquals("Donor", DONOR1_ADDRESS, "totalDonated", amount.toString())
    assert.fieldEquals("Donor", DONOR1_ADDRESS, "totalWithdrawn", "0")
  })

  test("Should handle multiple donations from same donor", () => {
    let donor = Address.fromString(DONOR1_ADDRESS)
    let project = Address.fromString(PROJECT_ADDRESS)
    let amount1 = BigInt.fromI32(3).times(BigInt.fromI32(10).pow(18))
    let amount2 = BigInt.fromI32(2).times(BigInt.fromI32(10).pow(18))

    let event1 = createDonationReceivedEvent(donor, amount1, project, BigInt.fromI32(1000000))
    let event2 = createDonationReceivedEvent(donor, amount2, project, BigInt.fromI32(2000000))

    handleDonationReceived(event1)
    handleDonationReceived(event2)

    assert.entityCount("Donation", 2)

    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    let totalAmount = amount1.plus(amount2)
    assert.fieldEquals("Campaign", campaignId, "amountRaised", totalAmount.toString())
    assert.fieldEquals("Campaign", campaignId, "backers", "2") // Two separate donations
  })
})

describe("Donation Withdrawal Tests", () => {
  beforeEach(() => {
    // Create campaign and donation
    let campaignEvent = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(campaignEvent)

    let donationAmount = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))
    let donationEvent = createDonationReceivedEvent(
      Address.fromString(DONOR1_ADDRESS),
      donationAmount,
      Address.fromString(PROJECT_ADDRESS),
      BigInt.fromI32(1000000)
    )
    handleDonationReceived(donationEvent)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should handle donor withdrawal correctly", () => {
    let project = Address.fromString(PROJECT_ADDRESS)
    let donor = Address.fromString(DONOR1_ADDRESS)
    let amountDonated = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))
    let amountReceived = BigInt.fromI32(45).times(BigInt.fromI32(10).pow(17)) // 4.5 ETH (after 10% tax)
    let date = BigInt.fromI32(2000000)

    let event = createDonationWithdrawnEvent(
      project,
      donor,
      amountReceived,
      amountDonated,
      date
    )
    handleDonationWithdrawn(event)

    // Check DonorWithdrawal entity
    assert.entityCount("DonorWithdrawal", 1)

    // Check Campaign updated
    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    assert.fieldEquals("Campaign", campaignId, "amountRaised", "0")
    assert.fieldEquals("Campaign", campaignId, "backers", "0")

    // Check Donor updated
    assert.fieldEquals("Donor", DONOR1_ADDRESS, "totalDonated", "0")
    assert.fieldEquals("Donor", DONOR1_ADDRESS, "totalWithdrawn", amountReceived.toString())
  })
})

describe("Milestone Tests", () => {
  beforeEach(() => {
    // Create campaign
    let event = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(event)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should create milestone entity", () => {
    let owner = Address.fromString(OWNER_ADDRESS)
    let dateCreated = BigInt.fromI32(1000000)
    let period = BigInt.fromI32(14 * 24 * 60 * 60) // 14 days
    let milestoneCID = "QmMilestone1"
    let milestoneId = Bytes.fromUTF8(milestoneCID).toHexString()
    let project = Address.fromString(PROJECT_ADDRESS)

    let event = createMilestoneCreatedEvent(
      owner,
      dateCreated,
      period,
      milestoneCID,
      project
    )
    handleMilestoneCreated(event)

    // Check Milestone entity
    assert.entityCount("Milestone", 1)
    assert.fieldEquals("Milestone", milestoneId, "milestoneCID", milestoneId)
    assert.fieldEquals("Milestone", milestoneId, "status", "1") // Pending
    assert.fieldEquals("Milestone", milestoneId, "periodToVote", period.toString())

    // Check Campaign updated with current milestone
    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    assert.fieldEquals("Campaign", campaignId, "currentMilestone", milestoneId)
  })

  test("Should update milestone status", () => {
    // Create milestone first
    let milestoneCID = "QmMilestone1"
    let milestoneId = Bytes.fromUTF8(milestoneCID).toHexString()

    let createEvent = createMilestoneCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      BigInt.fromI32(1000000),
      BigInt.fromI32(14 * 24 * 60 * 60),
      milestoneCID,
      Address.fromString(PROJECT_ADDRESS)
    )
    handleMilestoneCreated(createEvent)

    // Update status
    let statusEvent = createMilestoneStatusUpdatedEvent(
      Address.fromString(PROJECT_ADDRESS),
      2, // Approved
      milestoneCID,
      BigInt.fromI32(2000000)
    )
    handleMilestoneStatusUpdated(statusEvent)

    assert.fieldEquals("Milestone", milestoneId, "status", "2") // Approved
  })
})

describe("Voting Tests", () => {
  beforeEach(() => {
    // Create campaign and milestone
    let campaignEvent = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(campaignEvent)

    let milestoneEvent = createMilestoneCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      BigInt.fromI32(1000000),
      BigInt.fromI32(14 * 24 * 60 * 60),
      "QmMilestone1",
      Address.fromString(PROJECT_ADDRESS)
    )
    handleMilestoneCreated(milestoneEvent)

    // Add donation first
    let donationEvent = createDonationReceivedEvent(
      Address.fromString(DONOR1_ADDRESS),
      BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18)),
      Address.fromString(PROJECT_ADDRESS),
      BigInt.fromI32(900000)
    )
    handleDonationReceived(donationEvent)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should create vote entity for support vote", () => {
    let voter = Address.fromString(DONOR1_ADDRESS)
    let project = Address.fromString(PROJECT_ADDRESS)
    let support = true
    let amount = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))
    let timestamp = BigInt.fromI32(1500000)
    let milestoneCID = "QmMilestone1"

    let event = createVotedOnMilestoneEvent(
      voter,
      project,
      support,
      amount,
      timestamp,
      milestoneCID
    )
    handleVotedOnMilestone(event)

    assert.entityCount("Vote", 1)

    let voteId = Bytes.fromUTF8(PROJECT_ADDRESS + DONOR1_ADDRESS + timestamp.toString()).toHexString()
    assert.fieldEquals("Vote", voteId, "voter", DONOR1_ADDRESS)
    assert.fieldEquals("Vote", voteId, "support", "true")
    assert.fieldEquals("Vote", voteId, "weight", amount.toString())
    assert.fieldEquals("Vote", voteId, "milestoneCID", milestoneCID)
  })

  test("Should create vote entity for against vote", () => {
    let voter = Address.fromString(DONOR1_ADDRESS)
    let project = Address.fromString(PROJECT_ADDRESS)
    let support = false
    let amount = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))
    let timestamp = BigInt.fromI32(1500000)
    let milestoneCID = "QmMilestone1"

    let event = createVotedOnMilestoneEvent(
      voter,
      project,
      support,
      amount,
      timestamp,
      milestoneCID
    )
    handleVotedOnMilestone(event)

    assert.entityCount("Vote", 1)

    let voteId = Bytes.fromUTF8(PROJECT_ADDRESS + DONOR1_ADDRESS + timestamp.toString()).toHexString()
    assert.fieldEquals("Vote", voteId, "support", "false")
  })
})

describe("Milestone Withdrawal Tests", () => {
  beforeEach(() => {
    // Setup campaign and milestone
    let campaignEvent = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(campaignEvent)

    let milestoneEvent = createMilestoneCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      BigInt.fromI32(1000000),
      BigInt.fromI32(14 * 24 * 60 * 60),
      "QmMilestone1",
      Address.fromString(PROJECT_ADDRESS)
    )
    handleMilestoneCreated(milestoneEvent)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should update campaign creator funding withdrawn", () => {
    let owner = Address.fromString(OWNER_ADDRESS)
    let amount = BigInt.fromI32(3).times(BigInt.fromI32(10).pow(18))
    let date = BigInt.fromI32(2000000)
    let project = Address.fromString(PROJECT_ADDRESS)
    let milestoneId = Bytes.fromUTF8("QmMilestone1").toHexString()

    let event = createMilestoneWithdrawnEvent(owner, amount, date, project)
    handleMilestoneWithdrawn(event)

    assert.fieldEquals("CampaignCreator", OWNER_ADDRESS, "fundingWithdrawn", amount.toString())

    // Check milestone status updated to Approved
    assert.fieldEquals("Milestone", milestoneId, "status", "2") // Approved
  })
})

describe("Campaign End Tests", () => {
  beforeEach(() => {
    let event = createNewCrowdFundingContractCreatedEvent(
      Address.fromString(OWNER_ADDRESS),
      Address.fromString(PROJECT_ADDRESS),
      "QmTestCID123",
      "Test Campaign",
      0,
      BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18)),
      BigInt.fromI32(30 * 24 * 60 * 60)
    )
    handleNewCrowdFundingContractCreated(event)
  })

  afterEach(() => {
    clearStore()
  })

  test("Should mark campaign as inactive when ended", () => {
    let project = Address.fromString(PROJECT_ADDRESS)
    let date = BigInt.fromI32(3000000)

    let event = createCampaignEndedEvent(project, date)
    handleCampaignEnded(event)

    let campaignId = Bytes.fromUTF8(PROJECT_ADDRESS).toHexString()
    assert.fieldEquals("Campaign", campaignId, "active", "false")
  })
})
