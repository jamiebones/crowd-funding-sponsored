// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
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
    // State variables
    bool public campaignEnded;
	address payable private campaignOwner;
	address private factoryContractAddress;
	string private category;
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

    modifier campaignOwner(address _address) {
		if (_address != _campaignOwner) {
			revert YouAreNotTheOwnerOfTheCampaign();
		}
		_;
	}

    //function to initilize the contract:
	function initialize(
		string calldata _contractDetailsId,
        string calldata _title,
        string calldata _category,
		uint256 _duration,
        uint256 _amount,
		address _factoryAddress,
        address _donationTokenAddress
	) external initializer {
        contractDetailsId = _contractDetailsId;
        title = _title;
        category = _category;
        campaignDuration = _duration;
        targetAmount = _amount;
        factoryContractAddress = _factoryAddress;
		campaignOwner = payable(tx.origin);
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
	) external campaignOwner(msg.sender) nonReentrant {
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
            donationDivider = baseNumber;            // 100% return
        } else if (currentApprovedMilestones == 1) {
            donationDivider = (2 * baseNumber) / 3;  // 66.67% return
        } else if (currentApprovedMilestones == 2) {
            donationDivider = baseNumber / 3;        // 33.33% return
        } else {
            revert("Invalid milestone state");
        }

        // Calculate amounts with tax
        uint256 withdrawalBase = (userDonation * donationDivider) / baseNumber;
        uint256 taxAmount = (withdrawalBase * taxOnWithdrawingDonation) / 100;
        uint256 userAmount = withdrawalBase - taxAmount;

        // Update state (before external calls)
        donors[msg.sender] = 0;
        numberOfDonors--;
        amountRecalledByDonor += withdrawalBase;
        
        // Burn tokens before transfer
        donationToken.burn(msg.sender, userDonation);

        // Transfer funds (external calls last)
        (bool successUser, ) = payable(msg.sender).call{value: userAmount}("");
        if (!successUser) {
            revert WithdrawalFailed(userAmount);
        }

        (bool successTax, ) = payable(factoryContractAddress).call{value: taxAmount}("");
        if (!successTax) {
            revert WithdrawalFailed(taxAmount);
        }

        emit DonationRetrievedByDonor(
            address(this),
            msg.sender,
            userAmount,
            userDonation,
            block.timestamp
        );
    }



    
   




    


  

   

} 

//1::1 => 