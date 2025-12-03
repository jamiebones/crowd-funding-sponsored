// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdFundingToken is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public crowdfundingContracts;
    bool private factorySet;

    event CrowdfundingContractAdded(address indexed contractAddress);
    event CrowdfundingContractRemoved(address indexed contractAddress);

    constructor() ERC20("MWG Donation Token", "MWG-DT") Ownable(msg.sender) {}

    // Initially owned by deployer

    function setFactoryAndTransferOwnership(
        address _factoryAddress
    ) external onlyOwner {
        require(!factorySet, "Factory already set");
        require(_factoryAddress != address(0), "Invalid factory address");
        factorySet = true;
        crowdfundingContracts[_factoryAddress] = true;
        emit CrowdfundingContractAdded(_factoryAddress);
        _transferOwnership(_factoryAddress);
    }

    function addCrowdfundingContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Invalid contract address");
        crowdfundingContracts[_contract] = true;
        emit CrowdfundingContractAdded(_contract);
    }

    function removeCrowdfundingContract(address _contract) external onlyOwner {
        crowdfundingContracts[_contract] = false;
        emit CrowdfundingContractRemoved(_contract);
    }

    function mint(address to, uint256 amount) external {
        require(
            crowdfundingContracts[msg.sender],
            "Only crowdfunding contracts can mint"
        );
        require(amount > 0, "Amount must be greater than zero");
        _mint(to, amount);
    }

    function burnTokens(uint256 amount, address from) external {
        require(
            crowdfundingContracts[msg.sender],
            "Only crowdfunding contracts can burn"
        );
        require(amount > 0, "Amount must be greater than zero");
        _burn(from, amount);
    }
}
