// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CrowdFundingFactory.sol";
import "./CrowdFundingToken.sol";
import "hardhat/console.sol";

/**
 * @title CrowdFunding
 * @dev Main contract for crowdfunding campaigns
 */
contract CrowdFunding is Initializable, ReentrancyGuard {
    // Structs
    struct Milestone {
        string milestoneCID;
        bool approved;
        uint256 votingPeriod;
        MilestoneStatus status;
        uint256 supportVote;
        uint256 againstVote;
        mapping(address => bool) hasVoted;
    }

    // Errors
    error CamPaignEndedErrorNoLongerAcceptingDonations();
    error InsufficientFunds();
    error YouAreNotTheOwnerOfTheCampaign();
    error YouHaveAPendingMileStone();
    error TheMaximumMilestoneHaveBeenCreated();
    error YouDidNotDonateToThisCampaign();
    error CantWithdrawFundsCampaignEnded(address _donorAddress);
    error WithdrawalFailed(uint256 amount);
    error CanNotVoteOnMileStone(address _address);
    error YouHaveVotedForThisMilestoneAlready(address _address);
    error MileStoneVotingHasElapsed();
    error MileStoneVotingPeriodHasNotElapsed();
    error MilestoneHasEnded();
    error MaximumNumberofWithdrawalExceeded();
    error CampaignStillRunning();
    error NewDurationSmallerThanPreviousDuration();
    error CampaignHasEnded();

    // Events
    event MilestoneCreated(
        address indexed owner,
        uint256 datecreated,
        uint256 period,
        string milestoneCID
    );

    event UserDonatedToProject(
        address indexed donor,
        uint256 amount,
        address indexed project,
        uint256 date
    );

    event UserVotedOnMileStone(
        address indexed voter,
        address indexed project,
        bool vote,
        uint256 date
    );

    event MileStoneStatusUpdated(
        address indexed project,
        MilestoneStatus status,
        string milestoneCID,
        uint256 date
    );

    event MilestoneWithdrawal(
        address indexed owner,
        uint256 amount,
        uint256 date
    );

    event CampaignEnded(address indexed project, uint256 data);
    event DonationRetrievedByDonor(
        address indexed project,
        address indexed donor,
        uint256 amountReceived,
        uint256 amountDonated,
        uint256 date
    );
    event VotedOnMilestone(
        address indexed voter,
        address indexed project,
        bool support,
        uint256 amount,
        uint256 timestamp,
        string milestoneCID
    );

    // State variables
    bool public campaignEnded;
    address payable private campaignOwner;
    address private factoryContractAddress;
    Category private category;
    string private title;
    string private contractDetailsId;
    uint256 private targetAmount;
    uint256 private campaignDuration;
    uint256 private amountDonated;
    uint256 private numberOfDonors;
    uint256 private milestoneCounter;
    uint256 private approvedMilestone;
    uint256 private numberOfWithdrawal;
    uint256 private amountRecalledByDonor;
    uint256 constant baseNumber = 10 ** 18;
    uint256 constant taxOnWithdrawingDonation = 20; //20% tax on withdrawing your donation
    CrowdFundingToken public donationToken;

    mapping(address => uint256) public donors;
    mapping(uint256 => Milestone) public milestones;

    enum MilestoneStatus {
        Default,
        Pending,
        Approved,
        Declined
    }

    enum Category {
        TECHNOLOGY,
        ARTS,
        COMMUNITY,
        EDUCATION,
        ENVIRONMENT,
        HEALTH,
        SOCIAL,
        CHARITY,
        OTHER
    }

    modifier onlycampaignOwner(address _address) {
        if (_address != campaignOwner) {
            revert YouAreNotTheOwnerOfTheCampaign();
        }
        _;
    }

    //function to initilize the contract:
    function initialize(
        string calldata _contractDetailsId,
        string calldata _title,
        Category _category,
        uint256 _amount,
        uint256 _duration,
        address _factoryAddress,
        address _donationTokenAddress,
        address _owner
    ) external initializer {
        contractDetailsId = _contractDetailsId;
        title = _title;
        category = _category;
        campaignDuration = _duration;
        targetAmount = _amount;
        factoryContractAddress = _factoryAddress;
        campaignOwner = payable(_owner);
        donationToken = CrowdFundingToken(_donationTokenAddress);
    }

    /// @notice Allows users to donate funds to the campaign
    /// @dev Emits UserDonatedToProject event on successful donation
    /// @custom:security non-reentrant
    function giveDonationToCause() external payable nonReentrant {
        // Check campaign state
        if (campaignEnded) {
            revert CamPaignEndedErrorNoLongerAcceptingDonations();
        }

        if (block.timestamp >= campaignDuration) {
            revert CamPaignEndedErrorNoLongerAcceptingDonations();
        }

        if (numberOfWithdrawal >= 3) {
            revert CamPaignEndedErrorNoLongerAcceptingDonations();
        }

        uint256 donationAmount = msg.value;
        if (donationAmount == 0) {
            revert InsufficientFunds();
        }

        // Update donor statistics
        if (donors[msg.sender] == 0) {
            numberOfDonors++;
        }

        // Check for overflow before updating amounts
        donors[msg.sender] += donationAmount;
        amountDonated += donationAmount;

        donationToken.mint(msg.sender, donationAmount);

        emit UserDonatedToProject(
            msg.sender,
            donationAmount,
            address(this),
            block.timestamp
        );
    }

    function createNewMilestone(
        string memory milestoneCID
    ) external onlycampaignOwner(msg.sender) nonReentrant {
        require(bytes(milestoneCID).length > 0, "Empty milestone CID");
        // Check milestone constraints
        if (milestones[milestoneCounter].status == MilestoneStatus.Pending) {
            revert YouHaveAPendingMileStone();
        }
        if (numberOfWithdrawal >= 3) {
            revert TheMaximumMilestoneHaveBeenCreated();
        }
        // Create new milestone
        uint256 newMilestoneId = milestoneCounter + 1;
        Milestone storage newMilestone = milestones[newMilestoneId];
        // Set milestone properties
        newMilestone.status = MilestoneStatus.Pending;
        newMilestone.milestoneCID = milestoneCID;
        newMilestone.approved = false;
        newMilestone.votingPeriod = block.timestamp + 14 days;
        newMilestone.supportVote = 0;
        newMilestone.againstVote = 0;

        // Update counter
        milestoneCounter = newMilestoneId;

        emit MilestoneCreated(
            msg.sender,
            block.timestamp,
            newMilestone.votingPeriod,
            milestoneCID
        );
    }

    /// @notice Allows donors to withdraw their donations with a withdrawal fee
    /// @dev Implements checks-effects-interactions pattern and includes withdrawal penalties based on milestone progress
    function retrieveDonatedAmount() external nonReentrant {
        // Cache state variables
        uint256 userDonation = donors[msg.sender];
        uint256 currentApprovedMilestones = approvedMilestone;
        uint256 contractBal = address(this).balance;

        // Input validation
        if (userDonation == 0) {
            revert YouDidNotDonateToThisCampaign();
        }
        if (currentApprovedMilestones >= 3) {
            revert CantWithdrawFundsCampaignEnded(msg.sender);
        }

        // Calculate withdrawal amount based on milestone progress
        uint256 donationDivider;
        if (currentApprovedMilestones == 0) {
            donationDivider = baseNumber; // 100% return
        } else if (currentApprovedMilestones == 1) {
            donationDivider = (2 * baseNumber) / 3; // 66.67% return
        } else if (currentApprovedMilestones == 2) {
            donationDivider = baseNumber / 3; // 33.33% return
        } else {
            revert("Invalid milestone state");
        }

        // Calculate amounts with tax
        uint256 withdrawalBase = (userDonation * donationDivider) / baseNumber;
        uint256 taxAmount = (withdrawalBase * taxOnWithdrawingDonation) / 100;
        uint256 userAmount = withdrawalBase - taxAmount;

        // Verify contract has sufficient balance for both transfers
        require(
            contractBal >= (userAmount + taxAmount),
            "Insufficient contract balance"
        );
        require(
            factoryContractAddress != address(0),
            "Invalid factory address"
        );

        // Update state (before external calls)
        donors[msg.sender] = 0;
        numberOfDonors--;
        amountRecalledByDonor += withdrawalBase;

        console.log("Tax amount", taxAmount);

        // Burn tokens before transfer
        donationToken.burnTokens(userDonation, msg.sender);

        // Transfer user amount first
        (bool successUser, ) = payable(msg.sender).call{value: userAmount}("");
        if (!successUser) {
            revert WithdrawalFailed(userAmount);
        }

        // Only attempt tax transfer if there's a tax amount
        if (taxAmount > 0) {
            (bool successTax, ) = payable(factoryContractAddress).call{
                value: taxAmount
            }("");
            if (!successTax) {
                revert WithdrawalFailed(taxAmount);
            }
        }

        emit DonationRetrievedByDonor(
            address(this),
            msg.sender,
            userAmount,
            userDonation,
            block.timestamp
        );
    }

    /// @notice Allows donors to vote on pending milestones
    /// @dev Votes are weighted by donation amount
    /// @param support True for supporting the milestone, false for opposing
    function voteOnMilestone(bool support) external nonReentrant {
        // Validate campaign state
        if (campaignEnded) {
            revert CampaignHasEnded();
        }

        // Validate milestone exists
        if (milestoneCounter == 0) {
            revert("No milestone exists");
        }

        Milestone storage currentMilestone = milestones[milestoneCounter];

        // Validate milestone state
        if (currentMilestone.status != MilestoneStatus.Pending) {
            revert CanNotVoteOnMileStone(msg.sender);
        }

        // Check voting period
        if (block.timestamp > currentMilestone.votingPeriod) {
            revert MileStoneVotingHasElapsed();
        }

        // Cache donor amount for gas optimization and multiple uses
        uint256 weight = donors[msg.sender];
        if (weight == 0) {
            revert YouDidNotDonateToThisCampaign();
        }

        // Check for duplicate votes
        if (currentMilestone.hasVoted[msg.sender]) {
            revert YouHaveVotedForThisMilestoneAlready(msg.sender);
        }

        // Record vote
        currentMilestone.hasVoted[msg.sender] = true;

        // Update vote tallies based on donation amount
        if (support) {
            currentMilestone.supportVote += weight;
        } else {
            currentMilestone.againstVote += weight;
        }

        emit VotedOnMilestone(
            msg.sender,
            address(this),
            support,
            weight,
            block.timestamp,
            currentMilestone.milestoneCID
        );
    }

    function withdrawMilestone()
        external
        nonReentrant
        onlycampaignOwner(msg.sender)
    {
        // Cache state variables to save gas
        uint256 currentWithdrawals = numberOfWithdrawal;
        uint256 currentBalance = address(this).balance;
        uint256 currentMilestoneCount = milestoneCounter;
        Milestone storage milestone = milestones[currentMilestoneCount];

        // Early validation checks
        if (currentWithdrawals >= 3) {
            revert MaximumNumberofWithdrawalExceeded();
        }
        if (block.timestamp < campaignDuration) {
            revert CampaignStillRunning();
        }

        // Handle first milestone withdrawal (special case)
        if (currentWithdrawals == 0 && currentMilestoneCount == 1) {
            milestone.approved = true;
            milestone.status = MilestoneStatus.Approved;

            unchecked {
                // These additions cannot overflow
                approvedMilestone++;
                numberOfWithdrawal = 1;
            }

            // Calculate first withdrawal amount (1/3 of balance)
            uint256 amountToWithdraw = currentBalance / 3;
            processWithdrawal(amountToWithdraw, false);
            return;
        }

        // Handle subsequent milestone withdrawals

        // Validate milestone voting period and status
        if (block.timestamp < milestone.votingPeriod) {
            revert MileStoneVotingPeriodHasNotElapsed();
        }
        if (milestone.status != MilestoneStatus.Pending) {
            revert MilestoneHasEnded();
        }

        // Calculate total votes and determine outcome
        uint256 supportVotes = milestone.supportVote;
        uint256 againstVotes = milestone.againstVote;
        uint256 totalVotes = supportVotes + againstVotes;

        // Handle no-vote case or successful vote case
        bool isApproved;
        if (totalVotes == 0) {
            isApproved = true;
        } else {
            // Check if support votes >= 2/3 of total votes
            isApproved = (supportVotes * 100) >= ((totalVotes * 2) / 3) * 100;
        }

        if (!isApproved) {
            milestone.status = MilestoneStatus.Declined;
            milestone.approved = false;
            emit MileStoneStatusUpdated(
                address(this),
                milestone.status,
                milestone.milestoneCID,
                block.timestamp
            );
            return;
        }

        // Update milestone state
        milestone.status = MilestoneStatus.Approved;
        milestone.approved = true;
        unchecked {
            approvedMilestone++;
            numberOfWithdrawal++;
        }

        emit MileStoneStatusUpdated(
            address(this),
            milestone.status,
            milestone.milestoneCID,
            block.timestamp
        );

        // Calculate withdrawal amounts
        uint256 withdrawalAmount;
        uint256 taxAmount;

        if (currentWithdrawals == 1) {
            // Second withdrawal: 2/3 of remaining balance
            withdrawalAmount =
                (currentBalance * 2 * baseNumber) /
                3 /
                baseNumber;
        } else {
            // Final withdrawal: Remaining balance minus 1% tax
            taxAmount = currentBalance / 100; // 1% tax
            withdrawalAmount = currentBalance - taxAmount;

            if (taxAmount > 0) {
                processWithdrawal(taxAmount, true);
            }

            emit CampaignEnded(address(this), block.timestamp);
        }

        if (withdrawalAmount > 0) {
            processWithdrawal(withdrawalAmount, false);
        }
    }

    function checkMilestoneStatus(Milestone storage milestone) internal {
        if (block.timestamp < milestone.votingPeriod) {
            revert MileStoneVotingPeriodHasNotElapsed();
        }
        if (milestone.status != MilestoneStatus.Pending) {
            revert MilestoneHasEnded();
        }
        if (milestone.againstVote >= milestone.supportVote) {
            rejectMilestone(milestone);
        }
    }

    function approveMilestone(Milestone storage milestone) internal {
        milestone.status = MilestoneStatus.Approved;
        milestone.approved = true;
        approvedMilestone++;
        emit MileStoneStatusUpdated(
            address(this),
            milestone.status,
            milestone.milestoneCID,
            block.timestamp
        );
    }

    function rejectMilestone(Milestone storage milestone) internal {
        milestone.status = MilestoneStatus.Declined;
        milestone.approved = false;
        emit MileStoneStatusUpdated(
            address(this),
            milestone.status,
            milestone.milestoneCID,
            block.timestamp
        );
    }

    function processWithdrawal(uint256 amount, bool isTaxPayment) internal {
        address recipient = isTaxPayment ? factoryContractAddress : msg.sender;
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) {
            revert WithdrawalFailed(amount);
        }
        if (recipient == msg.sender) {
            emit MilestoneWithdrawal(msg.sender, amount, block.timestamp);
        }
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getFundingDetails()
        public
        view
        returns (address, uint256, uint256)
    {
        return (campaignOwner, campaignDuration, targetAmount);
    }

    function hasVotedOnMilestone(
        address _donorAddress
    ) public view returns (bool) {
        Milestone storage milestone = milestones[milestoneCounter];
        if (milestone.hasVoted[_donorAddress]) {
            return true;
        }
        return false;
    }

    function totalVotesOnMilestone() public view returns (uint256, uint256) {
        Milestone storage milestone = milestones[milestoneCounter];
        return (milestone.supportVote, milestone.againstVote);
    }

    function increaseCampaignPeriod(
        uint256 newPeriod
    ) public onlycampaignOwner(msg.sender) {
        if (newPeriod <= campaignDuration) {
            revert NewDurationSmallerThanPreviousDuration();
        }
        campaignDuration = newPeriod;
    }

    receive() external payable {}
}

//1::1 =>
