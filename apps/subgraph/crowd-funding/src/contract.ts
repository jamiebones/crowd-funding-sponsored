import { BigInt, Bytes, dataSource, DataSourceContext, DataSourceTemplate, json, log } from "@graphprotocol/graph-ts";
import {
    NewCrowdFundingContractCreated as NewCrowdFundingContractCreatedEvent,
    FundingFeeUpdated as FundingFeeUpdatedEvent,
    FundsWithdrawn as FundsWithdrawnEvent
} from "../generated/CrowdFundingFactory/CrowdFundingFactory";



enum MilestoneStatus {
    Default,
    Pending,
    Approved,
    Declined
}

import { Campaign as CampaignTemplate } from "../generated/templates";

import {
    MilestoneCreated as MilestoneCreatedEvent,
    MilestoneWithdrawn as MilestoneWithdrawnEvent,
    DonationReceived as DonationReceivedEvent,
    DonationWithdrawn as DonationWithdrawnEvent,
    CampaignEnded as CampaignEndedEvent,
    MilestoneStatusUpdated as MilestoneStatusUpdatedEvent,
    VotedOnMilestone as VotedOnMilestoneEvent,
} from "../generated/templates/Campaign/CrowdFundingContract";


import {
    Campaign, CampaignContent, CampaignCreator, Milestone, DonorWithdrawal,
    Donation, MilestoneContent, Statistic, Vote,
    Donor
} from "../generated/schema";

const CAMPAIGN_ID_KEY = "campaignID";
const MILESTONE_ID_KEY = "milestoneID";
const STATS_ID = Bytes.fromUTF8("0x26471bEF27bA75c8965fCD382c89121d5d70B49a");

export function handleNewCrowdFundingContractCreated(
    event: NewCrowdFundingContractCreatedEvent
): void {
    // Comprehensive logging for event details
    log.info('New Crowd Funding Contract Created Event: {}', [
        'Owner: ' + event.params.owner.toHexString(),
        'Clone Address: ' + event.params.contractAddress.toHexString(),
        'Funding Details ID: ' + event.params.contractDetailsId.toString(),
        'Category: ' + event.params.category.toString(),
        'Amount: ' + event.params.goal.toString(),
        'Duration: ' + event.params.duration.toString(),
        'Block Number: ' + event.block.number.toString()
    ]);

    let campaignCreator = CampaignCreator.load(event.params.owner.toHexString());
    let stats = Statistic.load(STATS_ID);
    let newCampaign = new Campaign(
        Bytes.fromUTF8(event.params.contractAddress.toHexString())
    );
    newCampaign.campaignCID = event.params.contractDetailsId;
    newCampaign.owner = event.params.owner.toHexString();
    newCampaign.dateCreated = event.block.timestamp;
    newCampaign.category = event.params.category;
    newCampaign.amountSought = event.params.goal;
    newCampaign.campaignRunning = true;
    newCampaign.active = true;
    newCampaign.amountRaised = BigInt.fromI32(0);
    newCampaign.contractAddress = event.params.contractAddress.toHexString();
    newCampaign.projectDuration = event.params.duration;
    newCampaign.backers = BigInt.fromI32(0);
    newCampaign.save();

    log.info('Campaign Created: {}', [
        'Campaign ID: ' + newCampaign.id.toHexString(),
        'Contract Address: ' + newCampaign.contractAddress,
        'Amount Sought: ' + newCampaign.amountSought.toString()
    ]);

    CampaignTemplate.create(event.params.contractAddress);

    if (!stats) {
        stats = new Statistic(STATS_ID);
        stats.totalContracts = BigInt.fromI32(1);
        stats.totalBackers = BigInt.fromI32(0);
        stats.totalFundingRequest = BigInt.fromI32(0);
        stats.totalFundingGiven = event.params.goal;
        stats.totalWithdrawals = BigInt.fromI32(0);
    } else {
        stats.totalContracts = stats.totalContracts.plus(BigInt.fromI32(1));
        stats.totalFundingRequest = stats.totalFundingRequest.plus(event.params.goal);
    }

    stats.save();
    log.info('Global Statistics Updated: {}', [
        'Total Contracts: ' + stats.totalContracts.toString(),
        'Total Funding Requested: ' + stats.totalFundingRequest.toString()
    ]);

    if (campaignCreator === null) {
        campaignCreator = new CampaignCreator(event.params.owner.toHexString());
        campaignCreator.fundingGiven = new BigInt(0);
        campaignCreator.fundingWithdrawn = new BigInt(0);
        campaignCreator.save();

        log.info('New Campaign Creator Added: {}', [
            'Address: ' + event.params.owner.toHexString()
        ]);
    }
}


export function handleDonationReceived(event: DonationReceivedEvent): void {
    log.info('Funds Donated Event: {}', [
        'Donor: ' + event.params.donor.toHexString(),
        'Project: ' + event.params.project.toHexString(),
        'Amount: ' + event.params.amount.toString(),
        'Date: ' + event.params.date.toString()
    ]);

    const stats = Statistic.load(STATS_ID);
    const campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()));

    if (campaign) {
        let donation = new Donation(Bytes.fromUTF8(event.params.donor.toHexString()
            + "_" + event.params.date.toString() + "_" + event.params.project.toHexString()))
        donation.amount = event.params.amount;
        donation.donatingTo = campaign.id;
        donation.timestamp = event.params.date;
        donation.donor = event.params.donor.toHexString();
        donation.save();

        log.info('Donation Recorded: {}', [
            'Donation ID: ' + donation.id.toHexString(),
            'Amount: ' + donation.amount.toString(),
            'Donor: ' + donation.donor
        ]);

        campaign.amountRaised = campaign.amountRaised!.plus(event.params.amount);
        campaign.backers = campaign.backers.plus(BigInt.fromI32(1));
        campaign.save();

        log.info('Campaign Updated After Donation: {}', [
            'Campaign ID: ' + campaign.id.toHexString(),
            'Amount Raised: ' + campaign.amountRaised!.toString(),
            'Total Backers: ' + campaign.backers.toString()
        ]);

        const campaignCreator = CampaignCreator.load(campaign.owner);
        const donor = Donor.load(event.params.donor.toHexString());
        if (campaignCreator) {
            campaignCreator.fundingGiven = campaignCreator.fundingGiven!.plus(event.params.amount);
            campaignCreator.save();

            log.info('Campaign Creator Updated: {}', [
                'Address: ' + campaignCreator.id,
                'Funding Given: ' + campaignCreator.fundingGiven!.toString()
            ]);
        }

        if (donor) {
            donor.totalDonated = donor.totalDonated.plus(event.params.amount);
            donor.save();
        } else {
            const newDonor = new Donor(event.params.donor.toHexString());
            newDonor.totalDonated = event.params.amount;
            newDonor.totalWithdrawn = BigInt.fromI32(0);
            newDonor.save();
        }

        if (stats) {
            stats.totalBackers = stats.totalBackers.plus(BigInt.fromI32(1));
            stats.totalFundingGiven = stats.totalFundingGiven.plus(event.params.amount);
            stats.save();

            log.info('Global Statistics Updated: {}', [
                'Total Backers: ' + stats.totalBackers.toString(),
                'Total Funding Given: ' + stats.totalFundingGiven.toString()
            ]);
        }
    } else {
        log.warning('Donation Event for Non-Existent Campaign: {}', [
            'Project: ' + event.params.project.toHexString()
        ]);
    }
}

export function handleVotedOnMilestone(event: VotedOnMilestoneEvent): void {
    log.info('User Voted on Milestone Event: {}', [
        'Project: ' + event.params.project.toHexString(),
        'Voter: ' + event.params.voter.toHexString(),
        'Support: ' + event.params.support.toString(),
        'Weight: ' + event.params.amount.toString(),
        'Date: ' + event.params.timestamp.toString(),
        'Milestone CID: ' + event.params.milestoneCID
    ]);

    let vote = new Vote(Bytes.fromUTF8(event.params.project.toHexString() + event.params.voter.toHexString() + event.params.timestamp.toString()))

    // Convert milestoneCID to hex for lookup
    let milestoneId = Bytes.fromUTF8(event.params.milestoneCID).toHexString()
    let milestone = Milestone.load(milestoneId)
    let campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()))
    if (!milestone) {
        log.warning('Vote Event for Non-Existent Milestone: {}', [
            'Milestone CID: ' + event.params.milestoneCID
        ]);
    }
    if (!campaign) {
        log.warning('Vote Event for Non-Existent Campaign: {}', [
            'Campaign ID: ' + event.params.project.toHexString()
        ]);
    }
    vote.voter = event.params.voter.toHexString();
    vote.support = event.params.support;
    vote.weight = event.params.amount;
    vote.timestamp = event.params.timestamp;
    vote.milestoneCID = event.params.milestoneCID;
    if (milestone) {
        vote.milestone = milestone.id;
    }
    if (campaign) {
        vote.project = campaign.id.toString();
    }
    vote.save();

    log.info('Vote Recorded: {}', [
        'Vote ID: ' + vote.id.toHexString(),
        'Voter: ' + vote.voter,
        'Support: ' + vote.support.toString(),
        'Weight: ' + vote.weight.toString(),
        'Milestone CID: ' + vote.milestoneCID
    ]);

}

export function handleDonationWithdrawn(event: DonationWithdrawnEvent): void {
    log.info("handles donation retrieval", ["donation retrieval started"])
    let campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()));
    let stats = Statistic.load(STATS_ID);
    let donationWithdrawal = new DonorWithdrawal(Bytes.fromUTF8(event.params.project.toHexString()
        + event.params.donor.toHexString() + event.params.date.toString()))
    if (campaign) {
        let campaignCreator = CampaignCreator.load(campaign.owner);
        if (campaignCreator) {
            campaignCreator.fundingGiven = campaignCreator.fundingGiven!.minus(event.params.amountDonated);
            campaignCreator.save();
        }
        campaign.amountRaised = campaign.amountRaised!.minus(event.params.amountDonated);
        campaign.backers = campaign.backers.minus(BigInt.fromI32(1));
        campaign.save();
        donationWithdrawal.amount = event.params.amountReceived;
        donationWithdrawal.donor = event.params.donor.toHexString();
        donationWithdrawal.withdrawingFrom = campaign.id;
        donationWithdrawal.timestamp = event.params.date;
        donationWithdrawal.save();

        const donor = Donor.load(event.params.donor.toHexString());
        if (donor) {
            donor.totalDonated = donor.totalDonated.minus(event.params.amountDonated);
            donor.totalWithdrawn = donor.totalWithdrawn.plus(event.params.amountReceived);
            donor.save();
        }
    }
    if (stats) {
        stats.totalBackers = stats.totalBackers.minus(BigInt.fromI32(1));
        stats.totalFundingGiven = stats.totalFundingGiven.minus(event.params.amountDonated);
        stats.save();
    }
    log.info("handles donation retrieval", ["donation retrieval ended"])
}

export function handleMilestoneCreated(event: MilestoneCreatedEvent): void {
    log.info('Milestone Created Event: {}', [
        'Transaction Hash: ' + event.transaction.hash.toHexString(),
        'From: ' + event.transaction.from.toHexString(),
        'To: ' + event.transaction.to!.toHexString(),
        'Milestone CID: ' + event.params.milestoneCID.toHexString(),
        'Period to Vote: ' + event.params.period.toString(),
        'Date Created: ' + event.params.dateCreated.toString()
    ]);

    const newMilestone = new Milestone(event.params.milestoneCID.toHexString())
    const campaign = Campaign.load(Bytes.fromUTF8(event.transaction.to!.toHexString()));
    if (campaign) {
        newMilestone.campaign = campaign.id;
        newMilestone.status = MilestoneStatus.Pending;
        newMilestone.milestoneCID = event.params.milestoneCID.toHexString();
        newMilestone.periodToVote = event.params.period;
        newMilestone.dateCreated = event.params.dateCreated;
        newMilestone.save();
        log.info('Milestone Recorded: {}', [
            'Milestone ID: ' + newMilestone.id,
            'Status: Pending',
            'Campaign ID: ' + campaign.id.toHexString()
        ]);

        //update the campaign with the current milestone
        campaign.currentMilestone = newMilestone.id;
        campaign.save()

        log.info('Campaign Updated with Current Milestone: {}', [
            'Campaign ID: ' + campaign.id.toHexString(),
            'Current Milestone ID: ' + newMilestone.id
        ]);
    } else {
        log.warning('Milestone Creation for Non-Existent Campaign: {}', [
            'Transaction To: ' + event.transaction.to!.toHexString()
        ]);
    }
}


export function handleMilestoneStatusUpdated(event: MilestoneStatusUpdatedEvent): void {
    log.info('Milestone Status Changed Event: {}', [
        'Project: ' + event.params.project.toHexString()
    ]);

    let campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()))
    if (campaign && campaign.currentMilestone) {
        const currentMilestoneId = campaign.currentMilestone;
        const milestone = Milestone.load(currentMilestoneId!);
        if (milestone) {
            milestone.dateCreated = event.params.date;
            milestone.status = event.params.status;
            milestone.save();
            log.info('Milestone Status Updated: {}', [
                'Milestone ID: ' + milestone.id,
                'New Status: ' + milestone.status.toString(),
                'Campaign ID: ' + campaign.id.toHexString()
            ]);
        }
    }
}

export function handleMilestoneWithdrawn(event: MilestoneWithdrawnEvent): void {
    log.info('Funds Withdrawn Event: {}', [
        'Owner: ' + event.params.owner.toHexString(),
        'Amount: ' + event.params.amount.toString()
    ]);

    let creatorId = event.params.owner.toHexString();
    let campaignCreator = CampaignCreator.load(creatorId);
    const stats = Statistic.load(STATS_ID);

    if (campaignCreator) {
        campaignCreator.fundingWithdrawn = campaignCreator.fundingWithdrawn!.plus(event.params.amount);
        campaignCreator.save();

        log.info('Campaign Creator Withdrawal Updated: {}', [
            'Address: ' + campaignCreator.id,
            'Total Withdrawn: ' + campaignCreator.fundingWithdrawn!.toString()
        ]);
    }

    let campaignId = Bytes.fromUTF8(event.transaction.to!.toHexString());
    let campaign = Campaign.load(campaignId);

    if (campaign) {
        let milestone = Milestone.load(campaign.currentMilestone!);
        if (milestone && milestone.status == MilestoneStatus.Pending) {
            milestone.status = MilestoneStatus.Approved;
            milestone.save();

            log.info('Milestone Status Updated: {}', [
                'Milestone ID: ' + milestone.id,
                'New Status: Approved'
            ]);
        }
    }

    if (stats) {
        stats.totalWithdrawals = stats.totalWithdrawals.plus(event.params.amount);
        stats.save();

        log.info('Global Statistics Updated: {}', [
            'Total Withdrawals: ' + stats.totalWithdrawals.toString()
        ]);
    }
}


export function handleCampaignEnded(event: CampaignEndedEvent): void {
    log.info('Campaign Ended Event: {}', [
        'Project: ' + event.params.project.toHexString()
    ]);

    const campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()));
    if (campaign) {
        campaign.active = false;
        campaign.save();

        log.info('Campaign Status Updated: {}', [
            'Campaign ID: ' + campaign.id.toHexString(),
            'Active Status: false'
        ]);
    } else {
        log.warning('End Campaign Event for Non-Existent Campaign: {}', [
            'Project: ' + event.params.project.toHexString()
        ]);
    }
}

// description: details.description,
// category: details.category,
// amount: details.amount || "",
// date: details.date || "",
// media: results.transactionIds,
// title: details.title


export function handleCampaignContent(content: Bytes): void {
    log.info("1. Function started", ["handleCampaignContent"])
    log.info("handlingcampaigncontent", ["campaign content started"])
    let hash = dataSource.stringParam();
    log.info("2. Got hash", [hash])

    let context = dataSource.context();
    log.info("3. Got context", ["context retrieved"])

    let id = context.getBytes(CAMPAIGN_ID_KEY);
    log.info("4. Got campaign ID", [id.toHexString()])

    let campaignContent = new CampaignContent(id);
    log.info("5. Created new CampaignContent", [id.toHexString()])

    let value = json.fromBytes(content).toObject();
    log.info("6. Parsed content to JSON object", ["success"])

    let title = value.get("title");
    log.info("7. Got title", [title ? title.toString() : "null"])

    let media = value.get("media");
    log.info("8. Got media", [media ? "media found" : "null"])

    let description = value.get("description");
    log.info("9. Got description", [description ? "description found" : "null"])

    campaignContent.campaign = id;
    log.info("13. Set campaign ID", [id.toHexString()])

    if (title) {
        campaignContent.title = title.toString();
        log.info("14. Set title", [title.toString()])
    }

    if (description) {
        campaignContent.details = description.toString();
        log.info("15. Set description", [description.toString()])
    }

    let mediaArray: string[] = [];
    log.info("19. Created media array", ["initialized"])

    if (media && media.toArray().length > 0) {
        for (let i = 0; i < media.toArray().length; i++) {
            const url = media.toArray()[i].toString();
            mediaArray.push(url)
            log.info("20. Added media URL", [url])
        }
        campaignContent.media = mediaArray;
        log.info("21. Set media array", [mediaArray.length.toString()])
    }

    campaignContent.hash = hash;
    log.info("22. Set hash", [hash])

    campaignContent.save();
    log.info("23. Saved campaign content", ["success"])

    log.info("handlingcampaigncontent", ["campaign content ended"])
    log.info("24. Function completed", ["handleCampaignContent"])
}

export function handleMilestoneContent(content: Bytes): void {
    let hash = dataSource.stringParam();
    let context = dataSource.context();
    let id = context.getBytes(MILESTONE_ID_KEY);
    let milestoneContent = new MilestoneContent(id);
    milestoneContent.milestone = id.toString();

    let value = json.fromBytes(content).toObject();
    let title = value.get("title");
    let media = value.get("media");
    let details = value.get("description");

    if (title) {
        milestoneContent.title = title.toString();
    }

    if (details) {
        milestoneContent.details = details.toString();
    }
    let mediaArray: string[] = [];
    if (media && media.toArray().length > 0) {
        for (let i = 0; i < media.toArray().length; i++) {
            const url = media.toArray()[i].toString();
            mediaArray.push(url)
        }
        milestoneContent.media = mediaArray;
    }

    milestoneContent.hash = hash;
    milestoneContent.save();
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
    log.info('Factory Funds Withdrawn Event: {}', [
        'Owner: ' + event.params.owner.toHexString(),
        'Amount: ' + event.params.amount.toString()
    ]);

    // This event is from the factory contract when the owner withdraws accumulated tax fees
    // You could track this in a FactoryStatistics entity if needed
}

