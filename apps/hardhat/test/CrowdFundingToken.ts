import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"


describe("CrowdFundingToken", () => {
    const setupFixture = deployments.createFixture(async () => {
        await deployments.fixture()
        const signers = await getNamedAccounts()
        
        // Deploy token contract
        const tokenContract = await ethers.deployContract(
            "CrowdFundingToken",
            [],
            await ethers.getSigner(signers.deployer)
        )

        // Deploy implementation for factory setup
        const crowdFundingImplementation = await ethers.deployContract(
            "CrowdFunding",
            [],
            await ethers.getSigner(signers.deployer)
        )

        // Deploy factory contract
        const factoryContract = await ethers.deployContract(
            "CrowdFundingFactory",
            [await crowdFundingImplementation.getAddress(), await tokenContract.getAddress()],
            await ethers.getSigner(signers.deployer)
        )

        const accounts = await ethers.getSigners()

        return {
            tokenContract,
            factoryContract,
            tokenAddress: await tokenContract.getAddress(),
            factoryAddress: await factoryContract.getAddress(),
            deployer: signers.deployer,
            accounts
        }
    })

    describe("Deployment", () => {
        it("Should deploy with correct name and symbol", async () => {
            const { tokenContract } = await setupFixture()
            
            expect(await tokenContract.name()).to.equal("Donation Token")
            expect(await tokenContract.symbol()).to.equal("DNTN")
        })

        it("Should set correct initial owner", async () => {
            const { tokenContract, deployer } = await setupFixture()
            
            expect(await tokenContract.owner()).to.equal(deployer)
        })
    })

    describe("Factory Setup", () => {
        it("Should set factory address and transfer ownership", async () => {
            const { tokenContract, factoryAddress , deployer} = await setupFixture()

            await tokenContract.connect(await ethers.getSigner(deployer)).setFactoryAndTransferOwnership(factoryAddress)
            
            expect(await tokenContract.owner()).to.equal(factoryAddress)
            expect(await tokenContract.crowdfundingContracts(factoryAddress)).to.be.true
        })

        it("Should revert if setting zero address as factory", async () => {
            const { tokenContract } = await setupFixture()

            await expect(
                tokenContract.setFactoryAndTransferOwnership(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid factory address")
        })

        it("Should revert if non-owner tries to set factory", async () => {
            const { tokenContract, factoryAddress, accounts } = await setupFixture()

            await expect(
                tokenContract.connect(accounts[1]).setFactoryAndTransferOwnership(factoryAddress)
            ).to.be.revertedWithCustomError(tokenContract, "OwnableUnauthorizedAccount")
        })
    })

    describe("Crowdfunding Contract Management", () => {
        it("Should allow owner to add crowdfunding contract", async () => {
            const { tokenContract, accounts } = await setupFixture()
            const newContractAddress = await accounts[1].getAddress()

            await tokenContract.addCrowdfundingContract(newContractAddress)
            
            expect(await tokenContract.crowdfundingContracts(newContractAddress)).to.be.true
        })

        it("Should revert if non-owner tries to add crowdfunding contract", async () => {
            const { tokenContract, accounts } = await setupFixture()
            const newContractAddress = await accounts[1].getAddress()

            await expect(
                tokenContract.connect(accounts[1]).addCrowdfundingContract(newContractAddress)
            ).to.be.revertedWithCustomError(tokenContract, "OwnableUnauthorizedAccount")
        })
    })

    describe("Token Operations", () => {
        it("Should allow approved contract to mint tokens", async () => {
            const { tokenContract, accounts } = await setupFixture()
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
            const { tokenContract, accounts } = await setupFixture()
            const amount = ethers.parseEther("100")

            await expect(
                tokenContract.connect(accounts[1]).mint(await accounts[2].getAddress(), amount)
            ).to.be.revertedWith("Only crowdfunding contracts can mint")
        })

        it("Should allow approved contract to burn tokens", async () => {
            const { tokenContract, accounts } = await setupFixture()
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
            const { tokenContract, accounts } = await setupFixture()
            const amount = ethers.parseEther("100")

            await expect(
                tokenContract.connect(accounts[2]).burnTokens(amount, accounts[1].address)
            ).to.be.revertedWith("Only crowdfunding contracts can burn")
        })
    })
})