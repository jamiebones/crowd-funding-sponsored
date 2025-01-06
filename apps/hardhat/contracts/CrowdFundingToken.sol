// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdFundingToken is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public crowdfundingContracts;
    
    constructor() ERC20("Donation Token", "DNTN") Ownable(msg.sender) {
        // Initially owned by deployer
    }
    
    function setFactoryAndTransferOwnership(address _factoryAddress) external onlyOwner {
        require(_factoryAddress != address(0), "Invalid factory address");
        crowdfundingContracts[_factoryAddress] = true;
        _transferOwnership(_factoryAddress);
    }
    
    function addCrowdfundingContract(address _contract) external onlyOwner {
        crowdfundingContracts[_contract] = true;
    }
    
    function mint(address to, uint256 amount) external {
        require(crowdfundingContracts[msg.sender], "Only crowdfunding contracts can mint");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        require(crowdfundingContracts[msg.sender], "Only crowdfunding contracts can burn");
        _burn(msg.sender, amount);
    }
} 
