import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("CrowdFundingToken", () => {
    const setupFixture = async () => {
        const accounts = await ethers.getSigners();
        const [deployer, ...otherAccounts] = accounts;

        // Deploy token contract
        const TokenFactory = await ethers.getContractFactory("CrowdFundingToken");
        const tokenContract = await TokenFactory.deploy();
        await tokenContract.waitForDeployment();

        // Deploy implementation for factory setup
        const CrowdFundingImplementation = await ethers.getContractFactory("CrowdFunding");
        const crowdFundingImplementation = await CrowdFundingImplementation.deploy();
        await crowdFundingImplementation.waitForDeployment();

        // Deploy factory contract
        const FactoryFactory = await ethers.getContractFactory("CrowdFundingFactory");
        const factoryContract = await FactoryFactory.deploy(
            await crowdFundingImplementation.getAddress(),
            await tokenContract.getAddress()
        );
        await factoryContract.waitForDeployment();

        return {
            tokenContract,
            factoryContract,
            tokenAddress: await tokenContract.getAddress(),
            factoryAddress: await factoryContract.getAddress(),
            deployer: deployer.address,
            accounts
        };
    };

    describe("Deployment", () => {
        it("Should deploy with correct name and symbol", async () => {
            const { tokenContract } = await loadFixture(setupFixture);

            expect(await tokenContract.name()).to.equal("MWG Donation Token");
            expect(await tokenContract.symbol()).to.equal("MWG-DT");
        });

        it("Should set correct initial owner", async () => {
            const { tokenContract, deployer } = await loadFixture(setupFixture)

            expect(await tokenContract.owner()).to.equal(deployer)
        })

        it("Should have correct token cap (1 billion)", async () => {
            const { tokenContract } = await loadFixture(setupFixture)
            const expectedCap = ethers.parseEther("1000000000") // 1 billion

            expect(await tokenContract.cap()).to.equal(expectedCap)
        })
    })

    describe("Factory Setup", () => {
        it("Should set factory address and transfer ownership", async () => {
            const { tokenContract, factoryAddress, deployer } = await loadFixture(setupFixture)

            await expect(
                tokenContract.connect(await ethers.getSigner(deployer)).setFactoryAndTransferOwnership(factoryAddress)
            ).to.emit(tokenContract, "CrowdfundingContractAdded")
                .withArgs(factoryAddress)

            expect(await tokenContract.owner()).to.equal(factoryAddress)
            expect(await tokenContract.crowdfundingContracts(factoryAddress)).to.be.true
        })

        it("Should revert if setting zero address as factory", async () => {
            const { tokenContract } = await loadFixture(setupFixture)

            await expect(
                tokenContract.setFactoryAndTransferOwnership(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid factory address")
        })

        it("Should revert if non-owner tries to set factory", async () => {
            const { tokenContract, factoryAddress, accounts } = await loadFixture(setupFixture)

            await expect(
                tokenContract.connect(accounts[1]).setFactoryAndTransferOwnership(factoryAddress)
            ).to.be.revertedWithCustomError(tokenContract, "OwnableUnauthorizedAccount")
        })
    })

    describe("Crowdfunding Contract Management", () => {
        it("Should allow owner to add crowdfunding contract", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const newContractAddress = await accounts[1].getAddress()

            await expect(
                tokenContract.addCrowdfundingContract(newContractAddress)
            ).to.emit(tokenContract, "CrowdfundingContractAdded")
                .withArgs(newContractAddress)

            expect(await tokenContract.crowdfundingContracts(newContractAddress)).to.be.true
        })

        it("Should revert if adding zero address", async () => {
            const { tokenContract } = await loadFixture(setupFixture)

            await expect(
                tokenContract.addCrowdfundingContract(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid contract address")
        })

        it("Should allow owner to remove crowdfunding contract", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const contractAddress = await accounts[1].getAddress()

            // Add first
            await tokenContract.addCrowdfundingContract(contractAddress)
            expect(await tokenContract.crowdfundingContracts(contractAddress)).to.be.true

            // Remove
            await expect(
                tokenContract.removeCrowdfundingContract(contractAddress)
            ).to.emit(tokenContract, "CrowdfundingContractRemoved")
                .withArgs(contractAddress)

            expect(await tokenContract.crowdfundingContracts(contractAddress)).to.be.false
        })

        it("Should revert if non-owner tries to add crowdfunding contract", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const newContractAddress = await accounts[1].getAddress()

            await expect(
                tokenContract.connect(accounts[1]).addCrowdfundingContract(newContractAddress)
            ).to.be.revertedWithCustomError(tokenContract, "OwnableUnauthorizedAccount")
        })

        it("Should revert if non-owner tries to remove crowdfunding contract", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const contractAddress = await accounts[1].getAddress()

            await expect(
                tokenContract.connect(accounts[2]).removeCrowdfundingContract(contractAddress)
            ).to.be.revertedWithCustomError(tokenContract, "OwnableUnauthorizedAccount")
        })
    })

    describe("Token Operations", () => {
        it("Should allow approved contract to mint tokens", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const approvedContract = accounts[1]
            const recipient = accounts[2]
            const amount = ethers.parseEther("100")

            // Add approved contract
            await tokenContract.addCrowdfundingContract(await approvedContract.getAddress())

            // Mint tokens
            await tokenContract.connect(approvedContract).mint(
                await recipient.getAddress(),
                amount
            )

            expect(await tokenContract.balanceOf(await recipient.getAddress())).to.equal(amount)
        })

        it("Should revert if non-approved contract tries to mint", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const amount = ethers.parseEther("100")

            await expect(
                tokenContract.connect(accounts[1]).mint(await accounts[2].getAddress(), amount)
            ).to.be.revertedWith("Only crowdfunding contracts can mint")
        })

        it("Should allow approved contract to burn tokens", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const approvedContract = accounts[1]
            const amount = ethers.parseEther("100")

            // Add approved contract
            await tokenContract.addCrowdfundingContract(await approvedContract.getAddress())

            // Mint tokens first
            await tokenContract.connect(approvedContract).mint(
                await approvedContract.getAddress(),
                amount
            )

            // Burn tokens
            await tokenContract.connect(approvedContract).burnTokens(amount, accounts[1].address)

            expect(await tokenContract.balanceOf(await approvedContract.getAddress())).to.equal(0)
        })

        it("Should revert if non-approved contract tries to burn", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const amount = ethers.parseEther("100")

            await expect(
                tokenContract.connect(accounts[2]).burnTokens(amount, accounts[1].address)
            ).to.be.revertedWith("Only crowdfunding contracts can burn")
        })

        it("Should enforce token cap when minting", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const approvedContract = accounts[1]
            const recipient = accounts[2]
            const cap = await tokenContract.cap()

            // Add approved contract
            await tokenContract.addCrowdfundingContract(await approvedContract.getAddress())

            // Try to mint more than cap
            await expect(
                tokenContract.connect(approvedContract).mint(
                    await recipient.getAddress(),
                    cap + BigInt(1)
                )
            ).to.be.revertedWithCustomError(tokenContract, "ERC20ExceededCap")
        })

        it("Should allow minting up to the cap", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const approvedContract = accounts[1]
            const recipient = accounts[2]
            const cap = await tokenContract.cap()

            // Add approved contract
            await tokenContract.addCrowdfundingContract(await approvedContract.getAddress())

            // Mint exactly the cap
            await tokenContract.connect(approvedContract).mint(
                await recipient.getAddress(),
                cap
            )

            expect(await tokenContract.balanceOf(await recipient.getAddress())).to.equal(cap)
            expect(await tokenContract.totalSupply()).to.equal(cap)
        })
    })

    describe("Edge Cases", () => {
        it("Should handle multiple contract additions and removals", async () => {
            const { tokenContract, accounts } = await loadFixture(setupFixture)
            const contract1 = await accounts[1].getAddress()
            const contract2 = await accounts[2].getAddress()
            const contract3 = await accounts[3].getAddress()

            // Add multiple contracts
            await tokenContract.addCrowdfundingContract(contract1)
            await tokenContract.addCrowdfundingContract(contract2)
            await tokenContract.addCrowdfundingContract(contract3)

            expect(await tokenContract.crowdfundingContracts(contract1)).to.be.true
            expect(await tokenContract.crowdfundingContracts(contract2)).to.be.true
            expect(await tokenContract.crowdfundingContracts(contract3)).to.be.true

            // Remove one
            await tokenContract.removeCrowdfundingContract(contract2)
            expect(await tokenContract.crowdfundingContracts(contract2)).to.be.false
            expect(await tokenContract.crowdfundingContracts(contract1)).to.be.true
            expect(await tokenContract.crowdfundingContracts(contract3)).to.be.true
        })
    })
})