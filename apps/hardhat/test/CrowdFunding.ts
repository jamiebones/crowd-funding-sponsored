import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("CrowdFunding", () => {
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

        // Create a new campaign through factory
        const duration = 30 * 24 * 60 * 60 * 1000 // 30 days
        const targetAmount = ethers.parseEther("10")
        const amountToDeposit = ethers.parseEther("0.000000001")
        const tx = await factoryContract.connect(await ethers.getSigner(signers.deployer)).createNewCrowdFundingContract(
            "testCID",
            BigInt(2),
            "Test Campaign",
            targetAmount,
            duration,
            { value: amountToDeposit }
        )
        const receipt = await tx.wait()

        console.log("duration", duration)

        // Get campaign address from event

        const campaignAddress = receipt?.logs[1].args[1]

        console.log("campaignAddress", campaignAddress)

        // Get campaign contract instance
        const campaignContract = await ethers.getContractAt("CrowdFunding", campaignAddress)

        return {
            tokenContract,
            factoryContract,
            campaignContract,
            accounts,
            deployer: signers.deployer,
            duration,
            targetAmount
        }
    })

    describe("Initialization", () => {
        it("Should initialize with correct parameters", async () => {
            const { campaignContract, deployer, duration, targetAmount } = await setupFixture()

            const [owner, campaignDuration, target] = await campaignContract.getFundingDetails()
            expect(owner).to.equal(deployer)
            expect(campaignDuration).to.equal(duration)
            expect(target).to.equal(targetAmount)
        })
    })

    describe("Donations", () => {
        it("Should accept donations and mint tokens", async () => {
            const { campaignContract, tokenContract, accounts } = await setupFixture()
            const donationAmount = ethers.parseEther("1")

            await campaignContract.connect(accounts[1]).giveDonationToCause({ value: donationAmount })

            expect(await campaignContract.contractBalance()).to.equal(donationAmount)
            expect(await tokenContract.balanceOf(accounts[1].address)).to.equal(donationAmount)
        })

        it("Should revert donation when campaign ended", async () => {
            const { campaignContract, accounts, duration } = await setupFixture()

            await time.increase(duration + 1)

            await expect(
                campaignContract.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(campaignContract, "CamPaignEndedErrorNoLongerAcceptingDonations")
        })
    })

    describe("Milestone Management", () => {
        it("Should create milestone successfully", async () => {
            const { campaignContract, deployer } = await setupFixture()

            const durationToMilestone = await time.latest();

            // await expect(campaignContract.createNewMilestone("testMilestoneCID"))
            //     .to.emit(campaignContract, "MilestoneCreated")
            //     .withArgs(deployer, durationToMilestone, durationToMilestone + 14 * 24 * 60 * 60, "testMilestoneCID")
        })

        it("Should revert if non-owner tries to create milestone", async () => {
            const { campaignContract, accounts } = await setupFixture()

            await expect(
                campaignContract.connect(accounts[1]).createNewMilestone("testMilestoneCID")
            ).to.be.revertedWithCustomError(campaignContract, "YouAreNotTheOwnerOfTheCampaign")
        })

        it("Should allow donors to vote on milestone", async () => {
            const { campaignContract, accounts } = await setupFixture()
            const donationAmount = ethers.parseEther("1")

            // Make donation first
            await campaignContract.connect(accounts[1]).giveDonationToCause({ value: donationAmount })

            // Create milestone
            await campaignContract.createNewMilestone("testMilestoneCID")

            // Vote on milestone
            await expect(campaignContract.connect(accounts[1]).voteOnMilestone(true))
                .to.emit(campaignContract, "VotedOnMilestone")

        })
    })

    describe("Withdrawals", () => {
        it("Should allow milestone withdrawal after successful vote", async () => {
            const { campaignContract, accounts, duration } = await setupFixture()
            const donationAmount = ethers.parseEther("3")

            // Make donation
            await campaignContract.connect(accounts[1]).giveDonationToCause({ value: donationAmount })

            // Create milestone
            await campaignContract.createNewMilestone("testMilestoneCID")

            // Vote positively
            await campaignContract.connect(accounts[1]).voteOnMilestone(true)

            // Advance time past campaign duration
            await time.increase(duration + 1)

            // Withdraw milestone
            await expect(campaignContract.withdrawMilestone())
                .to.emit(campaignContract, "MilestoneWithdrawal")
            const contractBalance = await campaignContract.contractBalance()
            // Should withdraw 1/3 of funds for first milestone
            expect(+contractBalance.toString()).to.equal(+donationAmount.toString() * 2 / 3)
        })

        it("Should allow donors to retrieve donations with penalty", async () => {
            const { campaignContract, tokenContract, accounts } = await setupFixture()
            const donationAmount = ethers.parseEther("1")

            // Make donation
            await campaignContract.connect(accounts[1]).giveDonationToCause({ value: donationAmount })

            // Retrieve donation
            await expect(campaignContract.connect(accounts[1]).retrieveDonatedAmount())
                .to.emit(campaignContract, "DonationRetrievedByDonor")

            // Check tokens were burned
            expect(await tokenContract.balanceOf(accounts[1].address)).to.equal(0)
        })

        it("Should handle multiple milestone withdrawals correctly", async () => {
            const { campaignContract, accounts, duration } = await setupFixture()
            const donationAmount = ethers.parseEther("9")

            // Make donation
            await campaignContract.connect(accounts[1]).giveDonationToCause({ value: donationAmount })

            // Create and vote on first milestone
            await campaignContract.createNewMilestone("milestone1CID")
            // Advance time past campaign duration
            await time.increase(duration + 1)
            const contractBalanceBeforeMilestoneOneWithdrawal = await campaignContract.contractBalance();
            // Withdraw first milestone
            await expect(campaignContract.withdrawMilestone())
                .to.emit(campaignContract, "MilestoneWithdrawal")
            const contractBalanceAfterMilestoneOneWithdrawal = await campaignContract.contractBalance();
            expect(+contractBalanceBeforeMilestoneOneWithdrawal.toString() - +contractBalanceAfterMilestoneOneWithdrawal.toString())
                .to.equal(+donationAmount.toString() * 1 / 3)

            // Create and vote on second milestone
            await campaignContract.createNewMilestone("milestone2CID")
            await campaignContract.connect(accounts[1]).voteOnMilestone(true)

            // // Wait for voting period
            await time.increase(14 * 24 * 60 * 60 + 1) // 14 days + 1 second
            const contractBalanceBeforeMilestoneTwoWithdrawal = await campaignContract.contractBalance();
            // // Withdraw second milestone
            await expect(campaignContract.withdrawMilestone())
                .to.emit(campaignContract, "MilestoneWithdrawal")

            const contractBalanceAfterMilestoneTwoWithdrawal = await campaignContract.contractBalance();


            expect(+contractBalanceBeforeMilestoneTwoWithdrawal.toString() - +contractBalanceAfterMilestoneTwoWithdrawal.toString())
                .to.equal(+contractBalanceBeforeMilestoneTwoWithdrawal.toString() * 2 / 3)

            // // Create and vote on third milestone
            await campaignContract.createNewMilestone("milestone3CID")
            await campaignContract.connect(accounts[1]).voteOnMilestone(true)

            // // Wait for voting period
            await time.increase(14 * 24 * 60 * 60 + 1) // 14 days + 1 second

            // Withdraw final milestone
            await expect(campaignContract.withdrawMilestone())
                .to.emit(campaignContract, "MilestoneWithdrawal")
            expect(+(await campaignContract.contractBalance()).toString()).to.equal(0)
        })
    })

    describe("Campaign Management", () => {
        it("Should allow owner to increase campaign duration", async () => {
            const { campaignContract, duration } = await setupFixture()
            const newDuration = duration + 7 * 24 * 60 * 60 // Add 7 days

            await campaignContract.increaseCampaignPeriod(newDuration)

            const [, campaignDuration] = await campaignContract.getFundingDetails()
            expect(campaignDuration).to.equal(newDuration)
        })

        it("Should revert if new duration is smaller", async () => {
            const { campaignContract, duration } = await setupFixture()

            await expect(
                campaignContract.increaseCampaignPeriod(duration - 1)
            ).to.be.revertedWithCustomError(campaignContract, "NewDurationSmallerThanPreviousDuration")
        })
    })
})
