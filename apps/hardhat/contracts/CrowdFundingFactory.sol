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
        string title,
        string category,
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

    // State variables
    address private immutable CROWDFUNDING_IMPLEMENTATION;
    address[] private deployedCrowdFundingContracts;
    address private crowdFundingToken;
    address private governanceContract;
    uint256 private fundingFee = 0.000000001 ether;
    IERC20 public donationToken;


    constructor(address _implementation, address _governanceContract, address _donationTokenAddress) Ownable(_governanceContract) {
        require(_implementation != address(0), "Invalid implementation address");
        CROWDFUNDING_IMPLEMENTATION = _implementation;
        governanceContract = _governanceContract;
        donationToken = CrowdFundingToken(_donationTokenAddress);
    }

    function createNewCrowdFundingContract(
        string memory _contractDetailsId,
        string memory _category,
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external payable returns (address) {
        // Add input validation
        require(bytes(_contractDetailsId).length > 0, "Empty contract details ID");
        require(bytes(_category).length > 0, "Empty category");
        require(bytes(_title).length > 0, "Empty title");
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        if (msg.value < fundingFee) {
            revert FundingForNewContractTooSmall();
        }

        address clone = Clones.clone(CROWDFUNDING_IMPLEMENTATION);
        
        // Move initialization parameters to a separate variable for better readability
        bytes memory initData = abi.encodeWithSignature(
            "initialize(string,string,string,uint256,uint256,address,address)",
            _contractDetailsId,
            _title,
            _category,
            _duration,
            _goal,
            address(this),
            address(donationToken)
        );

        (bool success, ) = clone.call(initData);
        if (!success) {
            revert CreateFundingContractFailed();
        }

        deployedCrowdFundingContracts.push(clone);

        donationToken.addCrowdfundingContract(clone);
        
        emit NewCrowdFundingContractCreated(
            msg.sender,
            clone,
            _contractDetailsId,
            _title,
            _category,
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

    function getFundingFee() external view returns (uint256) {
        return fundingFee;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 