// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CrowdFundingGovernance
 * @dev Governance contract for crowdfunding campaigns
 */
contract CrowdFundingGovernance {
    // Structs
    struct Proposal {
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
        uint256 deadline;
        bytes callData;
        address target;
    }

    // Events
    event ProposalCreated(uint256 indexed proposalId, address creator);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    uint256 public proposalCount;
    address public crowdfundingContract;

    /**
     * @dev Initialize governance for a campaign
     */
    constructor(address _crowdfundingContract);

    /**
     * @dev Create a new proposal
     */
    function propose(
        string memory _title,
        string memory _description,
        address _target,
        bytes memory _callData
    ) external returns (uint256 proposalId);

    /**
     * @dev Cast vote on a proposal
     */
    function castVote(uint256 _proposalId, bool _support) external;

    /**
     * @dev Execute a successful proposal
     */
    function executeProposal(uint256 _proposalId) external;

    /**
     * @dev Cancel a proposal
     */
    function cancelProposal(uint256 _proposalId) external;

    /**
     * @dev Calculate voting power based on contribution
     */
    function calculateVotingPower(address _voter) external view returns (uint256);

    /**
     * @dev Check if proposal is active
     */
    function isProposalActive(uint256 _proposalId) external view returns (bool);

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId) external view returns (
        string memory title,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool canceled,
        uint256 deadline
    );

    /**
     * @dev Check if address has voted on proposal
     */
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool);

    /**
     * @dev Get proposal result
     */
    function getProposalResult(uint256 _proposalId) external view returns (bool passed, bool executed);
} 