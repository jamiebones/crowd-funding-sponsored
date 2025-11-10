// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrowdFundingToken.sol";
/**
 * @title CrowdFundingFactory
 * @dev Factory contract for creating new crowdfunding campaigns
 */
contract CrowdFundingFactory is Ownable {
    event NewCrowdFundingContractCreated(
        address indexed owner,
        address indexed contractAddress, 
        string contractDetailsId,
        string indexed title,
        uint8 category,
        uint256 duration,
        uint256 goal
    );
    event FundingFeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // Errors
    error FundingForNewContractTooSmall();
    error CreateFundingContractFailed();
    error WithdrawalFailed();
    error InvalidFee();   
    error NoFundsToWithdraw();
    error InvalidCategory();

    // State variables
    address private immutable CROWDFUNDING_IMPLEMENTATION;
    address[] private deployedCrowdFundingContracts;
    address private crowdFundingToken;
    uint256 private fundingFee = 0.000000001 ether;
    CrowdFundingToken public donationToken;
    
    // Track campaigns by owner
    mapping(address => address[]) public ownerToCampaigns;

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


    constructor(address _implementation, address _donationTokenAddress) Ownable(msg.sender) {
        require(_implementation != address(0), "Invalid implementation address");
        CROWDFUNDING_IMPLEMENTATION = _implementation;
        donationToken = CrowdFundingToken(_donationTokenAddress);
    }

    function createNewCrowdFundingContract(
        string memory _contractDetailsId,
        Category _category,
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external payable returns (address) {
        // Add input validation
        require(bytes(_contractDetailsId).length > 0, "Empty contract details ID");
        require(bytes(_title).length > 0, "Empty title");
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        // Validate category
        if (uint8(_category) > uint8(Category.OTHER)) {
            revert InvalidCategory();
        }

        if (msg.value < fundingFee) {
            revert FundingForNewContractTooSmall();
        }

        address clone = Clones.clone(CROWDFUNDING_IMPLEMENTATION);
        
        // Move initialization parameters to a separate variable for better readability
        bytes memory initData = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256,address,address,address)",
            _contractDetailsId,
            _title,
            uint8(_category),
            _goal,
            _duration,
            address(this),
            address(donationToken),
            msg.sender
        );

        (bool success, ) = clone.call(initData);
        if (!success) {
            revert CreateFundingContractFailed();
        }

        deployedCrowdFundingContracts.push(clone);
        ownerToCampaigns[msg.sender].push(clone);

        donationToken.addCrowdfundingContract(clone);
        
        emit NewCrowdFundingContractCreated(
            msg.sender,
            clone,
            _contractDetailsId,
            _title,
            uint8(_category),
            _duration,
            _goal
        );
        
        return clone;
    }

    function setFundingFee(uint256 _newFee) external onlyOwner {
        // Add validation for new fee
        if (_newFee > 1 ether) revert InvalidFee();
        uint256 oldFee = fundingFee;
        fundingFee = _newFee;
        emit FundingFeeUpdated(oldFee, _newFee);
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        (bool success, ) = owner().call{value: balance}("");
        if (!success) {
            revert WithdrawalFailed();
        }
        
        emit FundsWithdrawn(owner(), balance);
    }

    // View functions
    function getDeployedCrowdFundingContracts() external view returns (address[] memory) {
        return deployedCrowdFundingContracts;
    }

    function getCampaignsByOwner(address owner) external view returns (address[] memory) {
        return ownerToCampaigns[owner];
    }

    function getFundingFee() external view returns (uint256) {
        return fundingFee;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
} 