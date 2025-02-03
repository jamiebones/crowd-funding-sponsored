
const milestoneStatus = [
    "Default",
    "Pending",
    "Approved",
    "Declined"
]

export const getMilestoneStatus = (status: number) => {
    return milestoneStatus[status];
}