import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  NewCrowdFundingContractCreated,
  FundsWithdrawn as FactoryFundsWithdrawn
} from "../generated/CrowdFundingFactory/CrowdFundingFactory"
import {
  MilestoneCreated,
  DonationReceived,
  DonationWithdrawn,
  VotedOnMilestone,
  MilestoneStatusUpdated,
  MilestoneWithdrawn,
  CampaignEnded
} from "../generated/templates/Campaign/CrowdFundingContract"

export function createNewCrowdFundingContractCreatedEvent(
  owner: Address,
  contractAddress: Address,
  contractDetailsId: string,
  title: string,
  category: i32,
  duration: BigInt,
  goal: BigInt
): NewCrowdFundingContractCreated {
  let event = changetype<NewCrowdFundingContractCreated>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  event.parameters.push(
    new ethereum.EventParam("contractAddress", ethereum.Value.fromAddress(contractAddress))
  )
  event.parameters.push(
    new ethereum.EventParam("contractDetailsId", ethereum.Value.fromString(contractDetailsId))
  )
  event.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromBytes(Bytes.fromUTF8(title)))
  )
  event.parameters.push(
    new ethereum.EventParam("category", ethereum.Value.fromI32(category))
  )
  event.parameters.push(
    new ethereum.EventParam("duration", ethereum.Value.fromUnsignedBigInt(duration))
  )
  event.parameters.push(
    new ethereum.EventParam("goal", ethereum.Value.fromUnsignedBigInt(goal))
  )

  return event
}

export function createDonationReceivedEvent(
  donor: Address,
  amount: BigInt,
  project: Address,
  date: BigInt
): DonationReceived {
  let event = changetype<DonationReceived>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor))
  )
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )
  event.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  // Set transaction.to to project address
  event.transaction.to = project

  return event
}

export function createDonationWithdrawnEvent(
  project: Address,
  donor: Address,
  amountReceived: BigInt,
  amountDonated: BigInt,
  date: BigInt
): DonationWithdrawn {
  let event = changetype<DonationWithdrawn>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )
  event.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor))
  )
  event.parameters.push(
    new ethereum.EventParam("amountReceived", ethereum.Value.fromUnsignedBigInt(amountReceived))
  )
  event.parameters.push(
    new ethereum.EventParam("amountDonated", ethereum.Value.fromUnsignedBigInt(amountDonated))
  )
  event.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  return event
}

export function createMilestoneCreatedEvent(
  owner: Address,
  dateCreated: BigInt,
  period: BigInt,
  milestoneCID: string,
  projectAddress: Address
): MilestoneCreated {
  let event = changetype<MilestoneCreated>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  event.parameters.push(
    new ethereum.EventParam("dateCreated", ethereum.Value.fromUnsignedBigInt(dateCreated))
  )
  event.parameters.push(
    new ethereum.EventParam("period", ethereum.Value.fromUnsignedBigInt(period))
  )
  event.parameters.push(
    new ethereum.EventParam("milestoneCID", ethereum.Value.fromBytes(Bytes.fromUTF8(milestoneCID)))
  )

  // Set transaction.to to project address
  event.transaction.to = projectAddress

  return event
}

export function createVotedOnMilestoneEvent(
  voter: Address,
  project: Address,
  support: boolean,
  amount: BigInt,
  timestamp: BigInt,
  milestoneCID: string
): VotedOnMilestone {
  let event = changetype<VotedOnMilestone>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter))
  )
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )
  event.parameters.push(
    new ethereum.EventParam("support", ethereum.Value.fromBoolean(support))
  )
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  event.parameters.push(
    new ethereum.EventParam("timestamp", ethereum.Value.fromUnsignedBigInt(timestamp))
  )
  event.parameters.push(
    new ethereum.EventParam("milestoneCID", ethereum.Value.fromString(milestoneCID))
  )

  return event
}

export function createMilestoneStatusUpdatedEvent(
  project: Address,
  status: i32,
  milestoneCID: string,
  date: BigInt
): MilestoneStatusUpdated {
  let event = changetype<MilestoneStatusUpdated>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )
  event.parameters.push(
    new ethereum.EventParam("status", ethereum.Value.fromI32(status))
  )
  event.parameters.push(
    new ethereum.EventParam("milestoneCID", ethereum.Value.fromString(milestoneCID))
  )
  event.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  return event
}

export function createMilestoneWithdrawnEvent(
  owner: Address,
  amount: BigInt,
  date: BigInt,
  projectAddress: Address
): MilestoneWithdrawn {
  let event = changetype<MilestoneWithdrawn>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  event.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  // Set transaction.to to project address
  event.transaction.to = projectAddress

  return event
}

export function createCampaignEndedEvent(
  project: Address,
  date: BigInt
): CampaignEnded {
  let event = changetype<CampaignEnded>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )
  event.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  return event
}

export function createFactoryFundsWithdrawnEvent(
  owner: Address,
  amount: BigInt
): FactoryFundsWithdrawn {
  let event = changetype<FactoryFundsWithdrawn>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return event
}
