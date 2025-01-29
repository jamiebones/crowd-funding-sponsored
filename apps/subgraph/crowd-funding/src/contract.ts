import { BigInt, Bytes, dataSource, DataSourceContext, DataSourceTemplate, json, log } from "@graphprotocol/graph-ts";
import {
    NewCrowdFundingContractCreated as NewCrowdFundingContractCreatedEvent, 
    FundingFeeUpdated as FundingFeeUpdatedEvent
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
    MilestoneWithdrawal as MilestoneWithdrawalEvent, UserDonatedToProject as UserDonatedToProjectEvent,
    DonationRetrievedByDonor as DonationRetrievedByDonorEvent,
    CampaignEnded as CampaignEndedEvent, MileStoneStatusUpdated as MilestoneStatusChangedEvent,
    VotedOnMilestone as VotedOnMilestoneEvent, 
} from "../generated/templates/Campaign/CrowdFundingContract";


import {
    Campaign, CampaignContent, CampaignCreator, Milestone, DonorWithdrawal,
    Donation, MilestoneContent, Statistic, Vote
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

    let hash = newCampaign.campaignCID;
    let context = new DataSourceContext();
    context.setBytes(CAMPAIGN_ID_KEY, newCampaign.id);
    DataSourceTemplate.createWithContext("ArweaveContentCampaign", [hash], context);

    CampaignTemplate.create(event.params.contractAddress);

    if (!stats) {
        stats = new Statistic(STATS_ID);
        stats.totalContracts = BigInt.fromI32(1);
        stats.totalBackers = BigInt.fromI32(0);
        stats.totalFundingRequest = BigInt.fromI32(0);
        stats.totalFundingGiven = BigInt.fromI32(0);
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


export function handleUserDonatedToProject(event: UserDonatedToProjectEvent): void {
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
        if (campaignCreator) {
            campaignCreator.fundingGiven = campaignCreator.fundingGiven!.plus(event.params.amount);
            campaignCreator.save();

            log.info('Campaign Creator Updated: {}', [
                'Address: ' + campaignCreator.id,
                'Funding Given: ' + campaignCreator.fundingGiven!.toString()
            ]);
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

export function handleUserVotedOnMileStone(event: VotedOnMilestoneEvent): void {
    log.info('User Voted on Milestone Event: {}', [
        'Project: ' + event.params.project.toHexString(),
        'Voter: ' + event.params.voter.toHexString(),
        'Support: ' + event.params.support.toString(),
        'Weight: ' + event.params.amount.toString(),
        'Date: ' + event.params.timestamp.toString(),
        'Milestone CID: ' + event.params.milestoneCID
    ]);

    let vote = new Vote(Bytes.fromUTF8(event.params.project.toHexString() + event.params.voter.toHexString() + event.params.timestamp.toString()))
    let milestone = Milestone.load((event.params.milestoneCID))
    let campaign = Campaign.load(Bytes.fromUTF8(event.params.project.toHexString()))
    vote.voter = event.params.voter.toHexString();
    vote.support = event.params.support;
    vote.weight = event.params.amount;
    vote.timestamp = event.params.timestamp;
    vote.milestoneCID = event.params.milestoneCID;
    if (milestone && campaign) {
        vote.milestone = milestone.id;
        vote.project = campaign.id.toString();
    } else {
        log.warning('Vote Event for Non-Existent Milestone or Campaign: {}', [
            'Milestone CID: ' + event.params.milestoneCID,
            'Project: ' + event.params.project.toHexString()
        ]);
    }
    vote.save();
    log.info('Vote Recorded: {}', [
        'Vote ID: ' + vote.id.toHexString(),
        'Voter: ' + vote.voter,
        'Project: ' + vote.project,
        'Support: ' + vote.support.toString(),
        'Weight: ' + vote.weight.toString(),
        'Milestone CID: ' + vote.milestoneCID
    ]);
}

export function handleDonationRetrievedByDonor(event: DonationRetrievedByDonorEvent): void {
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
        campaign.save();
        donationWithdrawal.amount = event.params.amountReceived;
        donationWithdrawal.donor = event.params.donor.toHexString();
        campaign.backers = campaign.backers.minus(BigInt.fromI32(1));
        donationWithdrawal.withdrawingFrom = campaign.id;
        donationWithdrawal.timestamp = event.params.date;
        donationWithdrawal.save();
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
        'Milestone CID: ' + event.params.milestoneCID.toString(),
        'Period to Vote: ' + event.params.period.toString(),
        'Date Created: ' + event.params.datecreated.toString()
    ]);

    const newMilestone = new Milestone(event.params.milestoneCID)
    const campaign = Campaign.load(Bytes.fromUTF8(event.transaction.to!.toHexString()));
    if (campaign) {
        newMilestone.campaign = campaign.id;
        newMilestone.status = MilestoneStatus.Pending;
        newMilestone.milestoneCID = event.params.milestoneCID;
        newMilestone.periodToVote = event.params.period;
        newMilestone.dateCreated = event.params.datecreated;
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

        let hash = newMilestone.milestoneCID;
        let context = new DataSourceContext();
        context.setBytes(MILESTONE_ID_KEY, Bytes.fromUTF8(newMilestone.id));
        DataSourceTemplate.createWithContext("ArweaveContentMilestone", [hash], context);
    } else {
        log.warning('Milestone Creation for Non-Existent Campaign: {}', [
            'Transaction To: ' + event.transaction.to!.toHexString()
        ]);
    }
}


export function handleMilestoneStatusChanged(event: MilestoneStatusChangedEvent): void {
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

export function handleFundsWithdrawn(event: MilestoneWithdrawalEvent): void {
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



export function handleCampaignContent(content: Bytes): void {
    log.info("handlingcampaigncontent", ["campaign content started"])
    let hash = dataSource.stringParam();
    let context = dataSource.context();
    let id = context.getBytes(CAMPAIGN_ID_KEY);
    let campaignContent = new CampaignContent(id);

    let value = json.fromBytes(content).toObject();
    let title = value.get("title");
    let media = value.get("media");
    let description = value.get("description");
    let category = value.get("category");
    let amount = value.get("amount");
    let date = value.get("date");

    campaignContent.campaign = id;
    if (title) {
        campaignContent.title = title.toString();
    }

    if (description) {
        campaignContent.details = description.toString();
    }
    if (category) {
        campaignContent.category = category.toString();
    }
    if (amount) {
        campaignContent.amount = amount.toString();
    }
    if (date) {
        campaignContent.date = date.toString();
    }
    let mediaArray: string[] = [];
    if (media && media.toArray().length > 0) {
        for (let i = 0; i < media.toArray().length; i++) {
            const url = media.toArray()[i].toString();
            mediaArray.push(url)
        }
        campaignContent.media = mediaArray;
    }

    campaignContent.hash = hash;
    campaignContent.save();
    log.info("handlingcampaigncontent", ["campaign content ended"])
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
    let details = value.get("details");

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

