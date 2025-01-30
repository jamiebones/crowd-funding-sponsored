"use client";
import Milestone from "./Milestone";


interface Vote {
    id: string;
    voter: string;
    project: string;
    weight: string;
    support: boolean;
    timestamp: string;
    milestoneCID: string;
    milestone: Milestone;
}


export default Vote