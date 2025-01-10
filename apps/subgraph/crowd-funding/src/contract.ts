import {
  NewCrowdFundingContractCreated as NewCrowdFundingContractCreatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from "../generated/Contract/Contract"
import {
  NewCrowdFundingContractCreated,
  OwnershipTransferred
} from "../generated/schema"

export function handleNewCrowdFundingContractCreated(
  event: NewCrowdFundingContractCreatedEvent
): void {
  let entity = new NewCrowdFundingContractCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.amount = event.params.amount
  entity.cloneAddress = event.params.cloneAddress
  entity.fundingDetailsId = event.params.fundingDetailsId
  entity.duration = event.params.duration
  entity.category = event.params.category

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
