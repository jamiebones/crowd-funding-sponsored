// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFactory {
    function createNewCrowdFundingContract(
        string memory _contractDetailsId,
        uint8 _category,
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external payable returns (address);
}

interface ICampaign {
    function endCampaign() external;

    function createNewMilestone(string memory milestoneCID) external;

    function withdrawMilestone() external;
}

/**
 * @title NonPayableOwner
 * @notice Test contract without receive/fallback to simulate non-payable owner
 */
contract NonPayableOwner {
    // No receive() or fallback() - cannot accept ETH

    function createCampaign(
        address factory,
        string memory cid,
        uint8 category,
        string memory title,
        uint256 goal,
        uint256 duration
    ) external payable {
        IFactory(factory).createNewCrowdFundingContract{value: msg.value}(
            cid,
            category,
            title,
            goal,
            duration
        );
    }

    function endCampaign(address campaign) external {
        ICampaign(campaign).endCampaign();
    }

    function createMilestone(address campaign, string memory cid) external {
        ICampaign(campaign).createNewMilestone(cid);
    }

    function withdrawMilestone(address campaign) external {
        ICampaign(campaign).withdrawMilestone();
    }
}
