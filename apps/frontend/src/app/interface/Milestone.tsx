"use client";

import Campaign from "./Campaign";
import MilestoneContent from "./MilestoneContent";
import Vote from "./Vote";


interface Milestone {
    id: string
    milestoneCID: string
    details: string
    campaign: Campaign
    status: number
    periodToVote: string;
    dateCreated: string;
    content: MilestoneContent;
    votes: Vote[];
}

export default Milestone