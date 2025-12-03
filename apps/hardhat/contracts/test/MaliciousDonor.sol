// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICrowdFunding {
    function giveDonationToCause() external payable;

    function retrieveDonatedAmount() external;
}

/**
 * @title MaliciousDonor
 * @notice Test contract that reverts on receive to simulate malicious donor attack
 */
contract MaliciousDonor {
    receive() external payable {
        revert("Malicious: refusing payment");
    }

    function donate(address campaign) external payable {
        ICrowdFunding(campaign).giveDonationToCause{value: msg.value}();
    }

    function withdraw(address campaign) external {
        ICrowdFunding(campaign).retrieveDonatedAmount();
    }
}
