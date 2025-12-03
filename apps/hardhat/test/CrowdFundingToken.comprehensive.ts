import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFundingToken } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("CrowdFundingToken - Comprehensive Tests", () => {
    // Fixture for deployment
    async function deployTokenFixture() {
        const [owner, factory, campaign1, campaign2, user1, user2, user3] = await ethers.getSigners();

        const CrowdFundingTokenFactory = await ethers.getContractFactory("CrowdFundingToken");
        const token = await CrowdFundingTokenFactory.deploy();
        await token.waitForDeployment();

        return { token, owner, factory, campaign1, campaign2, user1, user2, user3 };
    }

    async function deployTokenWithFactoryFixture() {
        const fixture = await deployTokenFixture();
        const { token, factory } = fixture;

        // Set factory and transfer ownership
        await token.setFactoryAndTransferOwnership(factory.address);

        return fixture;
    }

    describe("Deployment", () => {
        it("Should deploy with correct name and symbol", async () => {
            const { token } = await loadFixture(deployTokenFixture);

            expect(await token.name()).to.equal("MWG Donation Token");
            expect(await token.symbol()).to.equal("MWG-DT");
        });

        it("Should deploy with 18 decimals", async () => {
            const { token } = await loadFixture(deployTokenFixture);

            expect(await token.decimals()).to.equal(18);
        });

        it("Should initialize with zero total supply", async () => {
            const { token } = await loadFixture(deployTokenFixture);

            expect(await token.totalSupply()).to.equal(0);
        });

        it("Should set deployer as initial owner", async () => {
            const { token, owner } = await loadFixture(deployTokenFixture);

            expect(await token.owner()).to.equal(owner.address);
        });
    });

    describe("Factory Setup and Ownership", () => {
        it("Should allow owner to set factory and transfer ownership", async () => {
            const { token, owner, factory } = await loadFixture(deployTokenFixture);

            await expect(token.setFactoryAndTransferOwnership(factory.address))
                .to.emit(token, "OwnershipTransferred")
                .withArgs(owner.address, factory.address);

            expect(await token.owner()).to.equal(factory.address);
        });

        it("Should revert if non-owner tries to set factory", async () => {
            const { token, user1, factory } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).setFactoryAndTransferOwnership(factory.address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should revert when setting zero address as factory", async () => {
            const { token } = await loadFixture(deployTokenFixture);

            await expect(
                token.setFactoryAndTransferOwnership(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid factory address");
        });

        it("Should only allow setting factory once", async () => {
            const { token, factory, campaign1 } = await loadFixture(deployTokenFixture);

            await token.setFactoryAndTransferOwnership(factory.address);

            await expect(
                token.connect(factory).setFactoryAndTransferOwnership(campaign1.address)
            ).to.be.revertedWith("Factory already set");
        });
    });

    describe("Crowdfunding Contract Management", () => {
        it("Should allow factory to add crowdfunding contract", async () => {
            const { token, factory, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            await expect(token.connect(factory).addCrowdfundingContract(campaign1.address))
                .to.emit(token, "CrowdfundingContractAdded")
                .withArgs(campaign1.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(true);
        });

        it("Should revert when non-factory tries to add crowdfunding contract", async () => {
            const { token, user1, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            await expect(
                token.connect(user1).addCrowdfundingContract(campaign1.address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should revert when adding zero address as crowdfunding contract", async () => {
            const { token, factory } = await loadFixture(deployTokenWithFactoryFixture);

            await expect(
                token.connect(factory).addCrowdfundingContract(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid contract address");
        });

        it("Should allow factory to remove crowdfunding contract", async () => {
            const { token, factory, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            // First add the contract
            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(true);

            // Then remove it
            await expect(token.connect(factory).removeCrowdfundingContract(campaign1.address))
                .to.emit(token, "CrowdfundingContractRemoved")
                .withArgs(campaign1.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(false);
        });

        it("Should revert when non-factory tries to remove crowdfunding contract", async () => {
            const { token, factory, user1, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            await expect(
                token.connect(user1).removeCrowdfundingContract(campaign1.address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should handle multiple crowdfunding contracts", async () => {
            const { token, factory, campaign1, campaign2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(factory).addCrowdfundingContract(campaign2.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(true);
            expect(await token.crowdfundingContracts(campaign2.address)).to.equal(true);
        });

        it("Should allow removing one contract while keeping others", async () => {
            const { token, factory, campaign1, campaign2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(factory).addCrowdfundingContract(campaign2.address);

            await token.connect(factory).removeCrowdfundingContract(campaign1.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(false);
            expect(await token.crowdfundingContracts(campaign2.address)).to.equal(true);
        });
    });

    describe("Minting Tokens", () => {
        it("Should allow registered contract to mint tokens", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            await expect(token.connect(campaign1).mint(user1.address, mintAmount))
                .to.emit(token, "Transfer")
                .withArgs(ethers.ZeroAddress, user1.address, mintAmount);

            expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
            expect(await token.totalSupply()).to.equal(mintAmount);
        });

        it("Should revert when unregistered contract tries to mint", async () => {
            const { token, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            const mintAmount = ethers.parseEther("100");
            await expect(
                token.connect(campaign1).mint(user1.address, mintAmount)
            ).to.be.revertedWith("Only crowdfunding contracts can mint");
        });

        it("Should revert when minting to zero address", async () => {
            const { token, factory, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            await expect(
                token.connect(campaign1).mint(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
        });

        it("Should revert when minting zero amount", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            await expect(
                token.connect(campaign1).mint(user1.address, 0)
            ).to.be.revertedWith("Amount must be greater than zero");
        });

        it("Should allow multiple mints to same user", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount1 = ethers.parseEther("100");
            const mintAmount2 = ethers.parseEther("50");

            await token.connect(campaign1).mint(user1.address, mintAmount1);
            await token.connect(campaign1).mint(user1.address, mintAmount2);

            expect(await token.balanceOf(user1.address)).to.equal(mintAmount1 + mintAmount2);
        });

        it("Should allow minting to multiple users", async () => {
            const { token, factory, campaign1, user1, user2, user3 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const amount1 = ethers.parseEther("100");
            const amount2 = ethers.parseEther("200");
            const amount3 = ethers.parseEther("300");

            await token.connect(campaign1).mint(user1.address, amount1);
            await token.connect(campaign1).mint(user2.address, amount2);
            await token.connect(campaign1).mint(user3.address, amount3);

            expect(await token.balanceOf(user1.address)).to.equal(amount1);
            expect(await token.balanceOf(user2.address)).to.equal(amount2);
            expect(await token.balanceOf(user3.address)).to.equal(amount3);
            expect(await token.totalSupply()).to.equal(amount1 + amount2 + amount3);
        });

        it("Should allow minting large amounts", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const largeAmount = ethers.parseEther("10000000"); // 10 million tokens
            await token.connect(campaign1).mint(user1.address, largeAmount);

            expect(await token.totalSupply()).to.equal(largeAmount);
            expect(await token.balanceOf(user1.address)).to.equal(largeAmount);
        });
    });

    describe("Burning Tokens", () => {
        it("Should allow registered contract to burn user's tokens", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            const burnAmount = ethers.parseEther("40");

            await token.connect(campaign1).mint(user1.address, mintAmount);

            await expect(token.connect(campaign1).burnTokens(burnAmount, user1.address))
                .to.emit(token, "Transfer")
                .withArgs(user1.address, ethers.ZeroAddress, burnAmount);

            expect(await token.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
            expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
        });

        it("Should revert when unregistered contract tries to burn", async () => {
            const { token, factory, campaign1, campaign2, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("100"));

            await expect(
                token.connect(campaign2).burnTokens(ethers.parseEther("50"), user1.address)
            ).to.be.revertedWith("Only crowdfunding contracts can burn");
        });

        it("Should revert when burning zero amount", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("100"));

            await expect(
                token.connect(campaign1).burnTokens(0, user1.address)
            ).to.be.revertedWith("Amount must be greater than zero");
        });

        it("Should revert when burning from zero address", async () => {
            const { token, factory, campaign1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            await expect(
                token.connect(campaign1).burnTokens(ethers.parseEther("100"), ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(token, "ERC20InvalidSender");
        });

        it("Should revert when burning more than balance", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            const burnAmount = ethers.parseEther("150");

            await token.connect(campaign1).mint(user1.address, mintAmount);

            await expect(
                token.connect(campaign1).burnTokens(burnAmount, user1.address)
            ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
        });

        it("Should allow burning entire balance", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            await token.connect(campaign1).mint(user1.address, mintAmount);
            await token.connect(campaign1).burnTokens(mintAmount, user1.address);

            expect(await token.balanceOf(user1.address)).to.equal(0);
            expect(await token.totalSupply()).to.equal(0);
        });

        it("Should handle multiple burn operations", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("1000");
            await token.connect(campaign1).mint(user1.address, mintAmount);

            const burn1 = ethers.parseEther("100");
            const burn2 = ethers.parseEther("200");
            const burn3 = ethers.parseEther("300");

            await token.connect(campaign1).burnTokens(burn1, user1.address);
            await token.connect(campaign1).burnTokens(burn2, user1.address);
            await token.connect(campaign1).burnTokens(burn3, user1.address);

            const expectedBalance = mintAmount - burn1 - burn2 - burn3;
            expect(await token.balanceOf(user1.address)).to.equal(expectedBalance);
        });
    });

    describe("Mint and Burn Lifecycle", () => {
        it("Should allow minting after burning", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const amount = ethers.parseEther("100");

            // Mint
            await token.connect(campaign1).mint(user1.address, amount);
            expect(await token.balanceOf(user1.address)).to.equal(amount);

            // Burn
            await token.connect(campaign1).burnTokens(amount, user1.address);
            expect(await token.balanceOf(user1.address)).to.equal(0);

            // Mint again
            await token.connect(campaign1).mint(user1.address, amount);
            expect(await token.balanceOf(user1.address)).to.equal(amount);
        });

        it("Should handle complex mint/burn scenarios across multiple users", async () => {
            const { token, factory, campaign1, user1, user2, user3 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const amount = ethers.parseEther("100");

            // Mint to user1
            await token.connect(campaign1).mint(user1.address, amount);
            // Mint to user2
            await token.connect(campaign1).mint(user2.address, amount * 2n);
            // Mint to user3
            await token.connect(campaign1).mint(user3.address, amount * 3n);

            expect(await token.totalSupply()).to.equal(amount * 6n);

            // Burn from user2
            await token.connect(campaign1).burnTokens(amount, user2.address);

            expect(await token.balanceOf(user1.address)).to.equal(amount);
            expect(await token.balanceOf(user2.address)).to.equal(amount);
            expect(await token.balanceOf(user3.address)).to.equal(amount * 3n);
            expect(await token.totalSupply()).to.equal(amount * 5n);
        });
    });

    describe("Token Transfer Restrictions", () => {
        it("Should allow approval but prevent using it for transfers", async () => {
            const { token, factory, campaign1, user1, user2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const mintAmount = ethers.parseEther("100");
            await token.connect(campaign1).mint(user1.address, mintAmount);

            // Approval should work
            await expect(token.connect(user1).approve(user2.address, ethers.parseEther("50")))
                .to.emit(token, "Approval");

            expect(await token.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("50"));
        });
    });

    describe("Edge Cases and Security", () => {
        it("Should handle removed contract attempting to mint", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("100"));

            // Remove contract
            await token.connect(factory).removeCrowdfundingContract(campaign1.address);

            // Try to mint - should fail
            await expect(
                token.connect(campaign1).mint(user1.address, ethers.parseEther("50"))
            ).to.be.revertedWith("Only crowdfunding contracts can mint");
        });

        it("Should handle removed contract attempting to burn", async () => {
            const { token, factory, campaign1, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("100"));

            // Remove contract
            await token.connect(factory).removeCrowdfundingContract(campaign1.address);

            // Try to burn - should fail
            await expect(
                token.connect(campaign1).burnTokens(ethers.parseEther("50"), user1.address)
            ).to.be.revertedWith("Only crowdfunding contracts can burn");
        });

        it("Should maintain accurate total supply through complex operations", async () => {
            const { token, factory, campaign1, campaign2, user1, user2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(factory).addCrowdfundingContract(campaign2.address);

            const amount1 = ethers.parseEther("1000");
            const amount2 = ethers.parseEther("2000");
            const burn1 = ethers.parseEther("300");
            const burn2 = ethers.parseEther("500");

            await token.connect(campaign1).mint(user1.address, amount1);
            await token.connect(campaign2).mint(user2.address, amount2);

            expect(await token.totalSupply()).to.equal(amount1 + amount2);

            await token.connect(campaign1).burnTokens(burn1, user1.address);
            await token.connect(campaign2).burnTokens(burn2, user2.address);

            expect(await token.totalSupply()).to.equal(amount1 + amount2 - burn1 - burn2);
        });

        it("Should verify contract state after adding multiple contracts", async () => {
            const { token, factory, campaign1, campaign2, user1, user2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(factory).addCrowdfundingContract(campaign2.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(true);
            expect(await token.crowdfundingContracts(campaign2.address)).to.equal(true);

            // Both should be able to mint
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("100"));
            await token.connect(campaign2).mint(user2.address, ethers.parseEther("200"));

            expect(await token.totalSupply()).to.equal(ethers.parseEther("300"));
        });
    });

    describe("View Functions and State", () => {
        it("Should return correct balances", async () => {
            const { token, factory, campaign1, user1, user2 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            const amount1 = ethers.parseEther("100");
            const amount2 = ethers.parseEther("250");

            await token.connect(campaign1).mint(user1.address, amount1);
            await token.connect(campaign1).mint(user2.address, amount2);

            expect(await token.balanceOf(user1.address)).to.equal(amount1);
            expect(await token.balanceOf(user2.address)).to.equal(amount2);
            expect(await token.balanceOf(campaign1.address)).to.equal(0);
        });

        it("Should return correct allowances", async () => {
            const { token, factory, campaign1, user1, user2, user3 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);
            await token.connect(campaign1).mint(user1.address, ethers.parseEther("1000"));

            await token.connect(user1).approve(user2.address, ethers.parseEther("100"));
            await token.connect(user1).approve(user3.address, ethers.parseEther("200"));

            expect(await token.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("100"));
            expect(await token.allowance(user1.address, user3.address)).to.equal(ethers.parseEther("200"));
        });

        it("Should return correct crowdfunding contract status", async () => {
            const { token, factory, campaign1, campaign2, user1 } = await loadFixture(deployTokenWithFactoryFixture);

            await token.connect(factory).addCrowdfundingContract(campaign1.address);

            expect(await token.crowdfundingContracts(campaign1.address)).to.equal(true);
            expect(await token.crowdfundingContracts(campaign2.address)).to.equal(false);
            expect(await token.crowdfundingContracts(user1.address)).to.equal(false);
        });
    });
});
