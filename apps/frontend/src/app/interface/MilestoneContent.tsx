"use client";

import Milestone from "./Milestone";

interface MilestoneContent {
    id: string
    milestone: Milestone
    details: string
    title: string
    media: string[]
    hash: string
}

export default MilestoneContent