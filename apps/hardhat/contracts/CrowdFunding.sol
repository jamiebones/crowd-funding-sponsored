// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CrowdFundingFactory.sol";
import "./CrowdFundingToken.sol";

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
        mapping(address => uint256) voterSnapshot; // Snapshot of voter's donation at time of voting
        mapping(address => bool) voteDirection; // true = support, false = against
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
    error FundingGoalNotMet();
    error CampaignAlreadyEnded();

    // Events
    event MilestoneCreated(
        address indexed owner,
        uint256 indexed dateCreated,
        uint256 period,
        string milestoneCID
    );

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        address indexed project,
        uint256 indexed date
    );

    event MilestoneVoted(
        address indexed voter,
        address indexed project,
        bool vote,
        uint256 indexed date
    );

    event MilestoneStatusUpdated(
        address indexed project,
        MilestoneStatus status,
        string milestoneCID,
        uint256 indexed date
    );

    event MilestoneWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 indexed date
    );

    event CampaignEnded(address indexed project, uint256 indexed date);

    event DonationWithdrawn(
        address indexed project,
        address indexed donor,
        uint256 amountReceived,
        uint256 amountDonated,
        uint256 indexed date
    );

    event VotedOnMilestone(
        address indexed voter,
        address indexed project,
        bool support,
        uint256 amount,
        uint256 indexed timestamp,
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
    uint256 constant withdrawalTaxRate = 10; // Fixed 10% tax on early donor withdrawals
    uint256 public votingPeriodDays; // Configurable voting period
    CrowdFundingToken public donationToken;
    CrowdFundingFactory private factoryContract;

    mapping(address => uint256) public donors;
    mapping(address => uint256) public donorScale; // Stores the donation scale at time of donation
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //function to initilize the contract:
    function initialize(
        string calldata _contractDetailsId,
        string calldata _title,
        Category _category,
        uint256 _amount,
        uint256 _duration,
        address payable _factoryAddress,
        address _donationTokenAddress,
        address _owner
    ) external initializer {
        require(msg.sender == _factoryAddress, "Only factory can initialize");
        require(_factoryAddress != address(0), "Invalid factory address");
        require(_donationTokenAddress != address(0), "Invalid token address");
        require(_owner != address(0), "Invalid owner address");
        require(_amount >= 0.01 ether, "Minimum goal is 0.01 ETH");
        require(
            _duration >= 1 days && _duration <= 365 days,
            "Duration must be 1-365 days"
        );

        contractDetailsId = _contractDetailsId;
        title = _title;
        category = _category;
        campaignDuration = block.timestamp + _duration;
        targetAmount = _amount;
        factoryContractAddress = _factoryAddress;
        campaignOwner = payable(_owner);
        donationToken = CrowdFundingToken(_donationTokenAddress);
        factoryContract = CrowdFundingFactory(_factoryAddress);

        // Set default configurable parameters
        votingPeriodDays = 14; // 14 days default
    }

    /// @notice Allows users to donate funds to the campaign
    /// @dev Emits DonationReceived event on successful donation
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

        // Get donation scale from factory at time of donation
        uint256 currentScale = factoryContract.getDonationScale();

        // Update donor statistics
        if (donors[msg.sender] == 0) {
            numberOfDonors++;
            // Store the scale for first-time donors
            donorScale[msg.sender] = currentScale;
        } else {
            // For existing donors, use weighted average of scales
            // This ensures fair token calculation across multiple donations at different scales
            uint256 existingDonation = donors[msg.sender];
            uint256 existingScale = donorScale[msg.sender];
            uint256 totalDonation = existingDonation + donationAmount;

            // Weighted average: (old_amount * old_scale + new_amount * new_scale) / total_amount
            donorScale[msg.sender] =
                ((existingDonation * existingScale) +
                    (donationAmount * currentScale)) /
                totalDonation;
        }

        donors[msg.sender] += donationAmount;
        amountDonated += donationAmount;

        // Mint tokens using current scale
        uint256 tokensToMint = donationAmount * currentScale;
        donationToken.mint(msg.sender, tokensToMint);

        emit DonationReceived(
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
        newMilestone.votingPeriod =
            block.timestamp +
            (votingPeriodDays * 1 days);
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

        // If there's a pending milestone and donor has voted, remove their vote from tallies
        if (milestoneCounter > 0) {
            Milestone storage currentMilestone = milestones[milestoneCounter];
            if (
                currentMilestone.status == MilestoneStatus.Pending &&
                currentMilestone.hasVoted[msg.sender]
            ) {
                uint256 voteWeight = currentMilestone.voterSnapshot[msg.sender];

                // Subtract their vote weight from the appropriate tally based on vote direction
                if (currentMilestone.voteDirection[msg.sender]) {
                    // They voted in support
                    currentMilestone.supportVote -= voteWeight;
                } else {
                    // They voted against
                    currentMilestone.againstVote -= voteWeight;
                }

                //Clear their vote status
                currentMilestone.hasVoted[msg.sender] = false;
                currentMilestone.voterSnapshot[msg.sender] = 0;
                delete currentMilestone.voteDirection[msg.sender];
            }
        }

        //calculate withdrawal amount based on milestone progress
        uint256 donationDivider;
        if (currentApprovedMilestones == 0) {
            donationDivider = baseNumber; //100% return
        } else if (currentApprovedMilestones == 1) {
            //66.67% return
            donationDivider = (2 * baseNumber) / 3;
        } else if (currentApprovedMilestones == 2) {
            // 33.33% return
            donationDivider = baseNumber / 3;
        } else {
            revert("Invalid milestone state");
        }

        // Calculate amounts with tax
        uint256 withdrawalBase = (userDonation * donationDivider) / baseNumber;
        uint256 taxAmount = (withdrawalBase * withdrawalTaxRate) / 100;
        uint256 userAmount = withdrawalBase - taxAmount;

        //Verify contract has sufficient balance for both transfers

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
        amountRecalledByDonor += userDonation; // Track actual donation amount

        // Decrease total donations when donor withdraws
        // This prevents accounting issues and reflects actual available funds
        amountDonated -= userDonation;

        // Burn tokens using the donor's stored scale (same scale used when minting)
        uint256 userScale = donorScale[msg.sender];
        uint256 tokensToBurn = userDonation * userScale;
        donationToken.burnTokens(tokensToBurn, msg.sender);

        // Clear donor's scale mapping
        donorScale[msg.sender] = 0;

        //Transfer user amount first
        (bool successUser, ) = payable(msg.sender).call{value: userAmount}("");
        if (!successUser) {
            revert WithdrawalFailed(userAmount);
        }

        //Only attempt tax transfer if there's a tax amount
        if (taxAmount > 0) {
            (bool successTax, ) = payable(factoryContractAddress).call{
                value: taxAmount
            }("");
            if (!successTax) {
                revert WithdrawalFailed(taxAmount);
            }
        }

        emit DonationWithdrawn(
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

        uint256 weight = donors[msg.sender];
        if (weight == 0) {
            revert YouDidNotDonateToThisCampaign();
        }

        // Check for duplicate votes
        if (currentMilestone.hasVoted[msg.sender]) {
            revert YouHaveVotedForThisMilestoneAlready(msg.sender);
        }

        //Snapshot voter's balance at time of voting
        // This prevents vote weight from changing after voting
        currentMilestone.voterSnapshot[msg.sender] = weight;
        currentMilestone.voteDirection[msg.sender] = support; // Track vote direction

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
        uint256 currentWithdrawals = numberOfWithdrawal;
        uint256 currentBalance = address(this).balance;
        uint256 currentMilestoneCount = milestoneCounter;
        Milestone storage milestone = milestones[currentMilestoneCount];

        // Early validation checks
        if (currentWithdrawals >= 3) {
            revert MaximumNumberofWithdrawalExceeded();
        }

        // Allow withdrawal if campaign has ended (either by duration or owner ending early)
        if (!campaignEnded) {
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

            emit MilestoneStatusUpdated(
                address(this),
                milestone.status,
                milestone.milestoneCID,
                block.timestamp
            );

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
            // Fixed: Check if support votes >= 2/3 of total votes (proper precision)
            isApproved = (supportVotes * 3) >= (totalVotes * 2);
        }

        if (!isApproved) {
            milestone.status = MilestoneStatus.Declined;
            milestone.approved = false;
            emit MilestoneStatusUpdated(
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

        emit MilestoneStatusUpdated(
            address(this),
            milestone.status,
            milestone.milestoneCID,
            block.timestamp
        );

        // Calculate withdrawal amounts
        uint256 withdrawalAmount;
        uint256 taxAmount;

        if (currentWithdrawals == 1) {
            // Second withdrawal: 2/3 of remaining balance (optimized)
            withdrawalAmount = (currentBalance * 2) / 3;
        } else {
            // Final withdrawal: Calculate tax on net donations
            // amountDonated already reflects withdrawals, so don't subtract amountRecalledByDonor again
            // (amountRecalledByDonor is only tracked for analytics/events)
            uint256 netDonations = amountDonated;
            taxAmount = netDonations / 100; // 1% tax on net donations
            withdrawalAmount = currentBalance - taxAmount;
            campaignEnded = true;
            emit CampaignEnded(address(this), block.timestamp);

            if (taxAmount > 0) {
                processWithdrawal(taxAmount, true);
            }
        }

        if (withdrawalAmount > 0) {
            processWithdrawal(withdrawalAmount, false);
        }
    }

    function processWithdrawal(uint256 amount, bool isTaxPayment) internal {
        address recipient = isTaxPayment ? factoryContractAddress : msg.sender;
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) {
            revert WithdrawalFailed(amount);
        }
        if (recipient == msg.sender) {
            emit MilestoneWithdrawn(msg.sender, amount, block.timestamp);
        }
    }

    /// @notice Ends the campaign when duration expires or owner ends early
    /// @dev Can be called by anyone after duration ends, or by owner at any time
    function endCampaign() external {
        if (campaignEnded) {
            revert CampaignAlreadyEnded();
        }

        // Allow anyone to end after duration expires
        if (block.timestamp >= campaignDuration) {
            campaignEnded = true;
            emit CampaignEnded(address(this), block.timestamp);
            return;
        }

        // Allow owner to end early at any time
        require(
            msg.sender == campaignOwner,
            "Only owner can end campaign early"
        );

        campaignEnded = true;
        emit CampaignEnded(address(this), block.timestamp);
    }

    /// @notice Updates voting period (owner only, before campaign ends)
    /// @param newDays New voting period in days
    function setVotingPeriod(
        uint256 newDays
    ) external onlycampaignOwner(msg.sender) {
        require(
            newDays > 13 && newDays <= 90,
            "Voting period must be 14-90 days"
        );
        require(!campaignEnded, "Cannot change after campaign ends");
        votingPeriodDays = newDays;
    }

    function increaseCampaignPeriod(
        uint256 newPeriod
    ) public onlycampaignOwner(msg.sender) {
        if (newPeriod <= campaignDuration) {
            revert NewDurationSmallerThanPreviousDuration();
        }
        // Limit maximum extension to prevent indefinite locking
        uint256 maxAllowedDuration = block.timestamp + 365 days;
        require(
            newPeriod <= maxAllowedDuration,
            "Cannot extend beyond 1 year from now"
        );
        campaignDuration = newPeriod;
    }

    // View functions
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
        return milestone.hasVoted[_donorAddress];
    }

    function totalVotesOnMilestone() public view returns (uint256, uint256) {
        Milestone storage milestone = milestones[milestoneCounter];
        return (milestone.supportVote, milestone.againstVote);
    }

    function getCampaignStats()
        public
        view
        returns (
            uint256 _amountDonated,
            uint256 _targetAmount,
            uint256 _numberOfDonors,
            uint256 _approvedMilestones,
            bool _ended
        )
    {
        return (
            amountDonated,
            targetAmount,
            numberOfDonors,
            approvedMilestone,
            campaignEnded
        );
    }

    function getWithdrawalTaxRate() public pure returns (uint256) {
        return withdrawalTaxRate;
    }

    receive() external payable {}
}

//1::1 =>
