import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"

describe("CrowdFundingFactory", () => {
    const setupFixture = deployments.createFixture(async () => {
        await deployments.fixture()
        const signers = await getNamedAccounts()
        const accounts = await ethers.getSigners()

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

        // Setup token with factory
        await tokenContract.setFactoryAndTransferOwnership(await factoryContract.getAddress())

        return {
            tokenContract,
            factoryContract,
            crowdFundingImplementation,
            accounts,
            deployer: signers.deployer
        }
    })

    describe("Deployment", () => {
        it("Should deploy with correct initial state", async () => {
            const { factoryContract, deployer } = await setupFixture()

            expect(await factoryContract.owner()).to.equal(deployer)
            expect(await factoryContract.getFundingFee()).to.equal(ethers.parseEther("0.000000001"))
            expect(await factoryContract.getDeployedCrowdFundingContracts()).to.deep.equal([])
        })

        it("Should fail deployment with zero implementation address", async () => {
            const { tokenContract, deployer } = await setupFixture()

            await expect(
                ethers.deployContract(
                    "CrowdFundingFactory",
                    [ethers.ZeroAddress, await tokenContract.getAddress()],
                    await ethers.getSigner(deployer)
                )
            ).to.be.revertedWith("Invalid implementation address")
        })
    })

    describe("Campaign Creation", () => {
        it("Should create new campaign with correct parameters", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const fundingFee = await factoryContract.getFundingFee()

            const duration = 30 * 24 * 60 * 60 // 30 days
            const goal = ethers.parseEther("10")

            await expect(
                factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                    "testCID",
                    "Test Category",
                    "Test Campaign",
                    goal,
                    duration,
                    { value: fundingFee }
                )
            ).to.emit(factoryContract, "NewCrowdFundingContractCreated")


            const deployedContracts = await factoryContract.getDeployedCrowdFundingContracts()
            expect(deployedContracts.length).to.equal(1)
        })

        it("Should fail creation with insufficient fee", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const insufficientFee = ethers.parseEther("0.0000000001")

            await expect(
                factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                    "testCID",
                    "Test Category",
                    "Test Campaign",
                    ethers.parseEther("10"),
                    30 * 24 * 60 * 60,
                    { value: insufficientFee }
                )
            ).to.be.revertedWithCustomError(factoryContract, "FundingForNewContractTooSmall")
        })

        it("Should fail creation with invalid parameters", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const fundingFee = await factoryContract.getFundingFee()

            // Empty CID
            await expect(
                factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                    "",
                    "Test Category",
                    "Test Campaign",
                    ethers.parseEther("10"),
                    30 * 24 * 60 * 60,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Empty contract details ID")

            // Zero goal
            await expect(
                factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                    "testCID",
                    "Test Category",
                    "Test Campaign",
                    0,
                    30 * 24 * 60 * 60,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Goal must be greater than 0")
        })
    })

    describe("Fee Management", () => {
        it("Should allow owner to update fee", async () => {
            const { factoryContract } = await setupFixture()
            const newFee = ethers.parseEther("0.000000002")
            const oldFee = await factoryContract.getFundingFee()

            await expect(factoryContract.setFundingFee(newFee))
                .to.emit(factoryContract, "FundingFeeUpdated")
                .withArgs(oldFee, newFee)

            expect(await factoryContract.getFundingFee()).to.equal(newFee)
        })

        it("Should prevent non-owner from updating fee", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const newFee = ethers.parseEther("0.000000002")

            await expect(
                factoryContract.connect(accounts[1]).setFundingFee(newFee)
            ).to.be.revertedWithCustomError(factoryContract, "OwnableUnauthorizedAccount")
        })

        it("Should prevent setting fee higher than 1 ether", async () => {
            const { factoryContract } = await setupFixture()
            const invalidFee = ethers.parseEther("2")

            await expect(
                factoryContract.setFundingFee(invalidFee)
            ).to.be.revertedWithCustomError(factoryContract, "InvalidFee")
        })
    })

    describe("Fund Management", () => {
        it("Should allow owner to withdraw accumulated fees", async () => {
            const { factoryContract, accounts } = await setupFixture()
            await factoryContract.setFundingFee(ethers.parseEther("1"))
            const fundingFee = await factoryContract.getFundingFee()

            // Create a campaign to generate fees
            await factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                "testCID",
                "Test Category",
                "Test Campaign",
                ethers.parseEther("10"),
                30 * 24 * 60 * 60,
                { value: fundingFee }
            )

            const initialBalance = await ethers.provider.getBalance(await factoryContract.owner())

            console.log("owner", await factoryContract.owner())
            console.log("accounts[0]", accounts[0].address)

            console.log("initialBalance", +initialBalance.toString()/1e18)

            await expect(factoryContract.connect(accounts[0]).withdrawFunds())
                .to.emit(factoryContract, "FundsWithdrawn")

            const finalBalance = await ethers.provider.getBalance(await factoryContract.owner())
            console.log("finalBalance", +finalBalance.toString()/1e18)
            expect(finalBalance).to.be.greaterThan(initialBalance)
        })

        it("Should prevent withdrawal with no funds", async () => {
            const { factoryContract } = await setupFixture()

            await expect(
                factoryContract.withdrawFunds()
            ).to.be.revertedWithCustomError(factoryContract, "NoFundsToWithdraw")
        })

        it("Should prevent non-owner from withdrawing", async () => {
            const { factoryContract, accounts } = await setupFixture()

            await expect(
                factoryContract.connect(accounts[1]).withdrawFunds()
            ).to.be.revertedWithCustomError(factoryContract, "OwnableUnauthorizedAccount")
        })
    })

    describe("View Functions", () => {
        it("Should track deployed contracts correctly", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const fundingFee = await factoryContract.getFundingFee()

            // Create multiple campaigns
            for (let i = 0; i < 3; i++) {
                await factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                    `testCID${i}`,
                    "Test Category",
                    "Test Campaign",
                    ethers.parseEther("10"),
                    30 * 24 * 60 * 60,
                    { value: fundingFee }
                )
            }

            const deployedContracts = await factoryContract.getDeployedCrowdFundingContracts()
            expect(deployedContracts.length).to.equal(3)
        })

        it("Should return correct contract balance", async () => {
            const { factoryContract, accounts } = await setupFixture()
            const fundingFee = await factoryContract.getFundingFee()

            await factoryContract.connect(accounts[1]).createNewCrowdFundingContract(
                "testCID",
                "Test Category",
                "Test Campaign",
                ethers.parseEther("10"),
                30 * 24 * 60 * 60,
                { value: fundingFee }
            )

            expect(await factoryContract.getBalance()).to.equal(fundingFee)
        })
    })
})
