"use client";
import Milestone from "./Milestone";
import Donor from "./Donor";
import DonorWithdrawal from "./DonationWithdrawn";
import CampaignCreator from "./CampaignCreator";
import Donation from "./Donations";


interface CampaignContent {
    media: string[];
    title: string;
    details: string;
}

interface Campaign {
    id: string;
    campaignCID: string;
    category: number;
    active: boolean;
    content: CampaignContent;
    owner: CampaignCreator;
    dateCreated: string;
    projectDuration: string;
    contractAddress: string;
    amountSought:string;
    amountRaised: string;
    currentMilestone: string;
    donors: Donor[]
    backers: number;
    milestone: Milestone[];
    campaignRunning: boolean;
    endDate: string;
    donations: Donation[];
    donorsRecall: DonorWithdrawal[];
}



export default Campaign