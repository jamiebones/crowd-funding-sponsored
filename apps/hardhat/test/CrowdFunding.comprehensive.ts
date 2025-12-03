import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFundingFactory, CrowdFundingToken, CrowdFunding } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("CrowdFunding - Comprehensive Tests", () => {
    enum Category {
        TECHNOLOGY = 0,
        ARTS = 1,
        COMMUNITY = 2,
        EDUCATION = 3,
        ENVIRONMENT = 4,
        HEALTH = 5,
        SOCIAL = 6,
        CHARITY = 7,
        OTHER = 8
    }

    async function deployCampaignFixture() {
        const [owner, campaignOwner, donor1, donor2, donor3, donor4, donor5] = await ethers.getSigners();

        // Deploy token contract
        const TokenFactory = await ethers.getContractFactory("CrowdFundingToken");
        const token = await TokenFactory.deploy();
        await token.waitForDeployment();

        // Deploy implementation contract
        const CrowdFundingImplementation = await ethers.getContractFactory("CrowdFunding");
        const implementation = await CrowdFundingImplementation.deploy();
        await implementation.waitForDeployment();

        // Deploy factory contract
        const FactoryContract = await ethers.getContractFactory("CrowdFundingFactory");
        const factory = await FactoryContract.deploy(
            await implementation.getAddress(),
            await token.getAddress()
        );
        await factory.waitForDeployment();

        // Setup token with factory
        await token.setFactoryAndTransferOwnership(await factory.getAddress());

        // Create a campaign
        const targetAmount = ethers.parseEther("10");
        const duration = 30 * 24 * 60 * 60; // 30 days in seconds

        // Get the required funding fee
        const fundingFee = await factory.getFundingFee();

        const tx = await factory.connect(campaignOwner).createNewCrowdFundingContract(
            "QmTestCID123",
            Category.TECHNOLOGY,
            "Test Campaign",
            targetAmount,
            duration,
            { value: fundingFee }
        );

        const receipt = await tx.wait();

        // Extract campaign address from event
        const event = receipt?.logs.find((log: any) => {
            try {
                const parsed = factory.interface.parseLog(log as any);
                return parsed?.name === "NewCrowdFundingContractCreated";
            } catch {
                return false;
            }
        });

        const parsedEvent = factory.interface.parseLog(event as any);
        const campaignAddress = parsedEvent?.args[1]; // contractAddress is second arg

        const CrowdFundingContract = await ethers.getContractFactory("CrowdFunding");
        const campaign = CrowdFundingContract.attach(campaignAddress) as CrowdFunding;

        return {
            campaign,
            factory,
            token,
            owner,
            campaignOwner,
            donor1,
            donor2,
            donor3,
            donor4,
            donor5,
            targetAmount,
            duration
        };
    }

    describe("Part 1: Deployment and Initialization", () => {
        it("Should initialize with correct owner", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const [owner] = await campaign.getFundingDetails();
            expect(owner).to.equal(campaignOwner.address);
        });

        it("Should initialize with correct target amount", async () => {
            const { campaign, targetAmount } = await loadFixture(deployCampaignFixture);

            const [, , target] = await campaign.getFundingDetails();
            expect(target).to.equal(targetAmount);
        });

        it("Should initialize with correct duration", async () => {
            const { campaign, duration } = await loadFixture(deployCampaignFixture);

            const [, campaignDuration] = await campaign.getFundingDetails();
            const currentTime = await time.latest();

            // Campaign stores block.timestamp + duration
            expect(Number(campaignDuration)).to.be.closeTo(currentTime + duration, 10);
        });

        it("Should initialize with zero donations", async () => {
            const { campaign } = await loadFixture(deployCampaignFixture);

            const [amountDonated, , numberOfDonors] = await campaign.getCampaignStats();
            expect(amountDonated).to.equal(0);
            expect(numberOfDonors).to.equal(0);
        });

        it("Should initialize campaign as not ended", async () => {
            const { campaign } = await loadFixture(deployCampaignFixture);

            const [, , , , ended] = await campaign.getCampaignStats();
            expect(ended).to.equal(false);
            expect(await campaign.campaignEnded()).to.equal(false);
        });

        it("Should initialize with default withdrawal tax rate", async () => {
            const { campaign } = await loadFixture(deployCampaignFixture);

            expect(await campaign.getWithdrawalTaxRate()).to.equal(10); // 10% fixed
        });

        it("Should initialize with default voting period", async () => {
            const { campaign } = await loadFixture(deployCampaignFixture);

            expect(await campaign.votingPeriodDays()).to.equal(14); // 14 days default
        });

        it("Should initialize with zero contract balance", async () => {
            const { campaign } = await loadFixture(deployCampaignFixture);

            expect(await campaign.contractBalance()).to.equal(0);
        });
    });

    describe("Part 2: Donations - Basic Functionality", () => {
        it("Should accept donation and update balance", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");

            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: donationAmount })
            ).to.emit(campaign, "DonationReceived")
                .withArgs(donor1.address, donationAmount, await campaign.getAddress(), await time.latest() + 1);

            expect(await campaign.contractBalance()).to.equal(donationAmount);
        });

        it("Should track donor amount correctly", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            expect(await campaign.donors(donor1.address)).to.equal(donationAmount);
        });

        it("Should mint tokens equal to donation amount (with default 1x scale)", async () => {
            const { campaign, token, donor1, factory } = await loadFixture(deployCampaignFixture);

            // Verify default scale is 1
            expect(await factory.getDonationScale()).to.equal(1);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // With 1x scale, tokens = donation amount
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);
        });

        it("Should update campaign statistics", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [amountDonated, , numberOfDonors] = await campaign.getCampaignStats();
            expect(amountDonated).to.equal(donationAmount);
            expect(numberOfDonors).to.equal(1);
        });

        it("Should handle multiple donations from same donor", async () => {
            const { campaign, token, donor1 } = await loadFixture(deployCampaignFixture);

            const donation1 = ethers.parseEther("1");
            const donation2 = ethers.parseEther("0.5");

            await campaign.connect(donor1).giveDonationToCause({ value: donation1 });
            await campaign.connect(donor1).giveDonationToCause({ value: donation2 });

            expect(await campaign.donors(donor1.address)).to.equal(donation1 + donation2);
            expect(await token.balanceOf(donor1.address)).to.equal(donation1 + donation2);

            const [amountDonated, , numberOfDonors] = await campaign.getCampaignStats();
            expect(amountDonated).to.equal(donation1 + donation2);
            expect(numberOfDonors).to.equal(1); // Still one unique donor
        });

        it("Should handle donations from multiple donors", async () => {
            const { campaign, donor1, donor2, donor3 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("1");
            const amount2 = ethers.parseEther("2");
            const amount3 = ethers.parseEther("3");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });
            await campaign.connect(donor3).giveDonationToCause({ value: amount3 });

            const [amountDonated, , numberOfDonors] = await campaign.getCampaignStats();
            expect(amountDonated).to.equal(amount1 + amount2 + amount3);
            expect(numberOfDonors).to.equal(3);
        });

        it("Should revert on zero donation", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: 0 })
            ).to.be.revertedWithCustomError(campaign, "InsufficientFunds");
        });

        it("Should revert donation after campaign ended manually", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Donate to meet goal
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            // Owner ends campaign early
            await campaign.connect(campaignOwner).endCampaign();

            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(campaign, "CamPaignEndedErrorNoLongerAcceptingDonations");
        });

        it("Should revert donation after duration expires", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(campaign, "CamPaignEndedErrorNoLongerAcceptingDonations");
        });

        it("Should revert donation after 3 withdrawals", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            // Make donations to meet target
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("10") });

            // Fast forward past duration
            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);

            // Create and withdraw 3 milestones
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.endCampaign();
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor2).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone3");
            await campaign.connect(donor2).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Try to donate after 3 withdrawals
            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(campaign, "CamPaignEndedErrorNoLongerAcceptingDonations");
        });

        it("Should accept large donations", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const largeDonation = ethers.parseEther("1000");
            await campaign.connect(donor1).giveDonationToCause({ value: largeDonation });

            expect(await campaign.contractBalance()).to.equal(largeDonation);
        });

        it("Should accept very small donations", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const smallDonation = 1n; // 1 wei
            await campaign.connect(donor1).giveDonationToCause({ value: smallDonation });

            expect(await campaign.contractBalance()).to.equal(smallDonation);
        });
    });

    describe("Part 3: Milestone Creation", () => {
        it("Should allow owner to create milestone", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const milestoneCID = "QmMilestoneCID";

            await expect(
                campaign.connect(campaignOwner).createNewMilestone(milestoneCID)
            ).to.emit(campaign, "MilestoneCreated");
        });

        it("Should set milestone to pending status", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            const [supportVote, againstVote] = await campaign.totalVotesOnMilestone();
            expect(supportVote).to.equal(0);
            expect(againstVote).to.equal(0);
        });

        it("Should set correct voting period", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const currentTime = await time.latest();
            const votingPeriodDays = await campaign.votingPeriodDays();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            // Voting period should be set (we can verify by trying to vote after period)
            await time.increase(Number(votingPeriodDays) * 24 * 60 * 60 + 1);

            await expect(
                campaign.connect(campaignOwner).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "MileStoneVotingHasElapsed");
        });

        it("Should revert when non-owner creates milestone", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(donor1).createNewMilestone("milestone1")
            ).to.be.revertedWithCustomError(campaign, "YouAreNotTheOwnerOfTheCampaign");
        });

        it("Should revert when creating milestone with empty CID", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(campaignOwner).createNewMilestone("")
            ).to.be.revertedWith("Empty milestone CID");
        });

        it("Should revert when creating milestone while one is pending", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(campaignOwner).createNewMilestone("milestone2")
            ).to.be.revertedWithCustomError(campaign, "YouHaveAPendingMileStone");
        });

        it("Should revert when creating 4th milestone", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Make donation to meet target
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            // Fast forward past duration
            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // Create and approve 3 milestones
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone3");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Try to create 4th milestone
            await expect(
                campaign.connect(campaignOwner).createNewMilestone("milestone4")
            ).to.be.revertedWithCustomError(campaign, "TheMaximumMilestoneHaveBeenCreated");
        });
    });

    describe("Part 4: Milestone Voting", () => {
        it("Should allow donor to vote in support", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.emit(campaign, "VotedOnMilestone")
                .withArgs(
                    donor1.address,
                    await campaign.getAddress(),
                    true,
                    donationAmount,
                    await time.latest() + 1,
                    "milestone1"
                );

            const [supportVote, againstVote] = await campaign.totalVotesOnMilestone();
            expect(supportVote).to.equal(donationAmount);
            expect(againstVote).to.equal(0);
        });

        it("Should allow donor to vote against", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await campaign.connect(donor1).voteOnMilestone(false);

            const [supportVote, againstVote] = await campaign.totalVotesOnMilestone();
            expect(supportVote).to.equal(0);
            expect(againstVote).to.equal(donationAmount);
        });

        it("Should weight votes by donation amount", async () => {
            const { campaign, campaignOwner, donor1, donor2, donor3 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("1");
            const amount2 = ethers.parseEther("2");
            const amount3 = ethers.parseEther("3");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });
            await campaign.connect(donor3).giveDonationToCause({ value: amount3 });

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(true);
            await campaign.connect(donor3).voteOnMilestone(false);

            const [supportVote, againstVote] = await campaign.totalVotesOnMilestone();
            expect(supportVote).to.equal(amount1 + amount2);
            expect(againstVote).to.equal(amount3);
        });

        it("Should mark voter as having voted", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            expect(await campaign.hasVotedOnMilestone(donor1.address)).to.equal(false);

            await campaign.connect(donor1).voteOnMilestone(true);

            expect(await campaign.hasVotedOnMilestone(donor1.address)).to.equal(true);
        });

        it("Should revert when non-donor tries to vote", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "YouDidNotDonateToThisCampaign");
        });

        it("Should revert when voting twice", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await campaign.connect(donor1).voteOnMilestone(true);

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "YouHaveVotedForThisMilestoneAlready");
        });

        it("Should revert when voting on non-existent milestone", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.be.revertedWith("No milestone exists");
        });

        it("Should revert when voting after period elapsed", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            const votingPeriodDays = await campaign.votingPeriodDays();
            await time.increase(Number(votingPeriodDays) * 24 * 60 * 60 + 1);

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "MileStoneVotingHasElapsed");
        });

        it("Should revert when voting on already approved milestone", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("1") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone(); // Auto-approves first milestone

            await expect(
                campaign.connect(donor2).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "CanNotVoteOnMileStone");
        });

        it("Should allow voting after campaign ends if milestone voting period is active", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // Create and withdraw first milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Create second milestone and vote on it even though campaign has ended
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");

            // Voting should work for milestone 2 even though campaign has ended
            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.not.be.reverted;
        });
    });

    describe("Part 5: Milestone Withdrawals - First Milestone", () => {
        it("Should auto-approve first milestone without votes", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.emit(campaign, "MilestoneStatusUpdated");

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(1);
        });

        it("Should withdraw 1/3 of balance on first milestone", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            const ownerBalanceBefore = await ethers.provider.getBalance(campaignOwner.address);
            const tx = await campaign.connect(campaignOwner).withdrawMilestone();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(campaignOwner.address);

            const expectedWithdrawal = donationAmount / 3n;
            expect(ownerBalanceAfter + gasUsed - ownerBalanceBefore).to.equal(expectedWithdrawal);
            expect(await campaign.contractBalance()).to.equal(donationAmount - expectedWithdrawal);
        });

        it("Should allow withdrawal even if funding goal not met", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Donate less than target (target is 10 ETH)
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("5") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            // Should succeed - funding goal is not required for withdrawals
            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.not.be.reverted;
        });

        it("Should revert if campaign still running", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.be.revertedWithCustomError(campaign, "CampaignStillRunning");
        });

        it("Should revert if non-owner tries to withdraw", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(donor1).withdrawMilestone()
            ).to.be.revertedWithCustomError(campaign, "YouAreNotTheOwnerOfTheCampaign");
        });
    });

    describe("Part 6: Milestone Withdrawals - Subsequent Milestones", () => {
        it("Should approve milestone with 2/3+ support votes", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("7") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("3") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // First milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Second milestone - 70% support
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(false);

            await time.increase(15 * 24 * 60 * 60);

            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.emit(campaign, "MilestoneStatusUpdated");

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(2);
        });

        it("Should decline milestone with less than 2/3 support", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("4") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("6") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(false);

            await time.increase(15 * 24 * 60 * 60);

            await campaign.connect(campaignOwner).withdrawMilestone();

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(1); // Only first milestone approved
        });

        it("Should auto-approve with no votes", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await time.increase(15 * 24 * 60 * 60);

            await campaign.connect(campaignOwner).withdrawMilestone();

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(2);
        });

        it("Should withdraw 2/3 of remaining balance on second milestone", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            const balanceAfterFirst = await campaign.contractBalance();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);

            const ownerBalanceBefore = await ethers.provider.getBalance(campaignOwner.address);
            const tx = await campaign.connect(campaignOwner).withdrawMilestone();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(campaignOwner.address);

            const expectedWithdrawal = (balanceAfterFirst * 2n) / 3n;
            expect(ownerBalanceAfter + gasUsed - ownerBalanceBefore).to.equal(expectedWithdrawal);
        });

        it("Should withdraw remaining balance minus tax on third milestone", async () => {
            const { campaign, campaignOwner, donor1, factory } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // First milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Second milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Third milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone3");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);

            await campaign.connect(campaignOwner).withdrawMilestone();

            // Contract should be nearly empty (only rounding dust)
            expect(await campaign.contractBalance()).to.be.lessThan(ethers.parseEther("0.01"));
            expect(await campaign.campaignEnded()).to.equal(true);
        });

        it("Should revert if voting period not elapsed", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");

            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.be.revertedWithCustomError(campaign, "MileStoneVotingPeriodHasNotElapsed");
        });

        it("Should revert after 3 withdrawals", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // 3 milestones
            for (let i = 1; i <= 3; i++) {
                await campaign.connect(campaignOwner).createNewMilestone(`milestone${i}`);
                if (i > 1) {
                    await campaign.connect(donor1).voteOnMilestone(true);
                    await time.increase(15 * 24 * 60 * 60);
                }
                await campaign.connect(campaignOwner).withdrawMilestone();
            }

            // Try 4th withdrawal
            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.be.revertedWithCustomError(campaign, "MaximumNumberofWithdrawalExceeded");
        });
    });

    describe("Part 7: Donor Withdrawals", () => {
        it("Should allow donor to withdraw with 0 approved milestones", async () => {
            const { campaign, donor1, factory } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const taxRate = await campaign.getWithdrawalTaxRate();
            const expectedTax = (donationAmount * BigInt(taxRate)) / 100n;
            const expectedReturn = donationAmount - expectedTax;

            const donorBalanceBefore = await ethers.provider.getBalance(donor1.address);
            const tx = await campaign.connect(donor1).retrieveDonatedAmount();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const donorBalanceAfter = await ethers.provider.getBalance(donor1.address);

            expect(donorBalanceAfter + gasUsed - donorBalanceBefore).to.equal(expectedReturn);
        });

        it("Should allow donor to withdraw 2/3 with 1 approved milestone", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            const taxRate = await campaign.getWithdrawalTaxRate();
            const baseWithdrawal = (donationAmount * 2n) / 3n;
            const expectedTax = (baseWithdrawal * taxRate) / 100n;
            const expectedReturn = baseWithdrawal - expectedTax;

            const donorBalanceBefore = await ethers.provider.getBalance(donor1.address);
            const tx = await campaign.connect(donor1).retrieveDonatedAmount();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const donorBalanceAfter = await ethers.provider.getBalance(donor1.address);

            // Allow small rounding difference (within 10 wei)
            expect(Number(donorBalanceAfter + gasUsed - donorBalanceBefore)).to.be.closeTo(Number(expectedReturn), 10);
        });

        it("Should revert donor withdrawal after 2 approved milestones (insufficient balance)", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // First milestone: owner withdraws 1/3
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Second milestone: owner withdraws 2/3 of remaining
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // After owner withdrew ~7.77 ETH, contract has ~2.23 ETH left
            // But donor entitled to 1/3 of original (3.33 ETH) - insufficient balance
            await expect(campaign.connect(donor1).retrieveDonatedAmount())
                .to.be.revertedWith("Insufficient contract balance");
        });

        it("Should burn tokens on withdrawal", async () => {
            const { campaign, token, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);

            await campaign.connect(donor1).retrieveDonatedAmount();

            expect(await token.balanceOf(donor1.address)).to.equal(0);
        });

        it("Should send tax to factory", async () => {
            const { campaign, factory, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const factoryBalanceBefore = await ethers.provider.getBalance(await factory.getAddress());
            await campaign.connect(donor1).retrieveDonatedAmount();
            const factoryBalanceAfter = await ethers.provider.getBalance(await factory.getAddress());

            const taxRate = await campaign.getWithdrawalTaxRate();
            const expectedTax = (donationAmount * BigInt(taxRate)) / 100n;

            expect(factoryBalanceAfter - factoryBalanceBefore).to.equal(expectedTax);
        });

        it("Should update donor count", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });

            let [, , numberOfDonors] = await campaign.getCampaignStats();
            expect(numberOfDonors).to.equal(1);

            await campaign.connect(donor1).retrieveDonatedAmount();

            [, , numberOfDonors] = await campaign.getCampaignStats();
            expect(numberOfDonors).to.equal(0);
        });

        it("Should revert if non-donor tries to withdraw", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(donor1).retrieveDonatedAmount()
            ).to.be.revertedWithCustomError(campaign, "YouDidNotDonateToThisCampaign");
        });

        it("Should revert after 3 approved milestones", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // Approve 3 milestones
            for (let i = 1; i <= 3; i++) {
                await campaign.connect(campaignOwner).createNewMilestone(`milestone${i}`);
                if (i > 1) {
                    await campaign.connect(donor1).voteOnMilestone(true);
                    await time.increase(15 * 24 * 60 * 60);
                }
                await campaign.connect(campaignOwner).withdrawMilestone();
            }

            await expect(
                campaign.connect(donor1).retrieveDonatedAmount()
            ).to.be.revertedWithCustomError(campaign, "CantWithdrawFundsCampaignEnded");
        });
    });

    describe("Part 9: Configuration Management", () => {
        it("Should allow owner to update voting period", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).setVotingPeriod(21);

            expect(await campaign.votingPeriodDays()).to.equal(21);
        });

        it("Should allow setting voting period to 14 days (minimum)", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).setVotingPeriod(14);

            expect(await campaign.votingPeriodDays()).to.equal(14);
        });

        it("Should allow setting voting period to 90 days", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).setVotingPeriod(90);

            expect(await campaign.votingPeriodDays()).to.equal(90);
        });

        it("Should revert when setting voting period to 0", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(campaignOwner).setVotingPeriod(0)
            ).to.be.revertedWith("Voting period must be 14-90 days");
        });

        it("Should revert when setting voting period above 90", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(campaignOwner).setVotingPeriod(91)
            ).to.be.revertedWith("Voting period must be 14-90 days");
        });

        it("Should revert when non-owner sets voting period", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            await expect(
                campaign.connect(donor1).setVotingPeriod(21)
            ).to.be.revertedWithCustomError(campaign, "YouAreNotTheOwnerOfTheCampaign");
        });

        it("Should revert when changing voting period after campaign ends", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await expect(
                campaign.connect(campaignOwner).setVotingPeriod(21)
            ).to.be.revertedWith("Cannot change after campaign ends");
        });
    });

    describe("Part 10: Campaign Management", () => {
        it("Should allow anyone to end campaign after duration", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);

            await expect(
                campaign.connect(donor1).endCampaign()
            ).to.emit(campaign, "CampaignEnded");

            expect(await campaign.campaignEnded()).to.equal(true);
        });

        it("Should allow owner to end campaign early at any time", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Should fail when non-owner tries to end early
            await expect(
                campaign.connect(donor1).endCampaign()
            ).to.be.revertedWith("Only owner can end campaign early");

            // Should succeed when owner ends early even without meeting goal
            await expect(
                campaign.connect(campaignOwner).endCampaign()
            ).to.emit(campaign, "CampaignEnded");
        });

        it("Should revert when ending already ended campaign", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await expect(
                campaign.connect(campaignOwner).endCampaign()
            ).to.be.revertedWithCustomError(campaign, "CampaignAlreadyEnded");
        });

        it("Should allow owner to increase campaign duration", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const [, currentDuration] = await campaign.getFundingDetails();
            const newDuration = Number(currentDuration) + (7 * 24 * 60 * 60);

            await campaign.connect(campaignOwner).increaseCampaignPeriod(newDuration);

            const [, updatedDuration] = await campaign.getFundingDetails();
            expect(updatedDuration).to.equal(newDuration);
        });

        it("Should revert when decreasing duration", async () => {
            const { campaign, campaignOwner } = await loadFixture(deployCampaignFixture);

            const [, currentDuration] = await campaign.getFundingDetails();
            const newDuration = Number(currentDuration) - 1;

            await expect(
                campaign.connect(campaignOwner).increaseCampaignPeriod(newDuration)
            ).to.be.revertedWithCustomError(campaign, "NewDurationSmallerThanPreviousDuration");
        });

        it("Should revert when non-owner increases duration", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const [, currentDuration] = await campaign.getFundingDetails();
            const newDuration = Number(currentDuration) + 1000;

            await expect(
                campaign.connect(donor1).increaseCampaignPeriod(newDuration)
            ).to.be.revertedWithCustomError(campaign, "YouAreNotTheOwnerOfTheCampaign");
        });
    });

    describe("Part 11: View Functions", () => {
        it("Should return correct contract balance", async () => {
            const { campaign, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("1");
            const amount2 = ethers.parseEther("2");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });

            expect(await campaign.contractBalance()).to.equal(amount1 + amount2);
        });

        it("Should return correct funding details", async () => {
            const { campaign, campaignOwner, targetAmount, duration } = await loadFixture(deployCampaignFixture);

            const [owner, campaignDuration, target] = await campaign.getFundingDetails();
            const currentTime = await time.latest();

            expect(owner).to.equal(campaignOwner.address);
            expect(target).to.equal(targetAmount);
            expect(Number(campaignDuration)).to.be.closeTo(currentTime + duration, 10);
        });

        it("Should return correct campaign stats", async () => {
            const { campaign, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("1");
            const amount2 = ethers.parseEther("2");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });

            const [amountDonated, targetAmount, numberOfDonors, approvedMilestones, ended] =
                await campaign.getCampaignStats();

            expect(amountDonated).to.equal(amount1 + amount2);
            expect(targetAmount).to.equal(ethers.parseEther("10"));
            expect(numberOfDonors).to.equal(2);
            expect(approvedMilestones).to.equal(0);
            expect(ended).to.equal(false);
        });

        it("Should return correct total votes", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("3");
            const amount2 = ethers.parseEther("2");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(false);

            const [supportVotes, againstVotes] = await campaign.totalVotesOnMilestone();

            expect(supportVotes).to.equal(amount1);
            expect(againstVotes).to.equal(amount2);
        });

        it("Should return correct voted status", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("1") });

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            expect(await campaign.hasVotedOnMilestone(donor1.address)).to.equal(false);
            expect(await campaign.hasVotedOnMilestone(donor2.address)).to.equal(false);

            await campaign.connect(donor1).voteOnMilestone(true);

            expect(await campaign.hasVotedOnMilestone(donor1.address)).to.equal(true);
            expect(await campaign.hasVotedOnMilestone(donor2.address)).to.equal(false);
        });

        it("Should return correct donor amounts", async () => {
            const { campaign, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            const amount1 = ethers.parseEther("1.5");
            const amount2 = ethers.parseEther("2.7");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });

            expect(await campaign.donors(donor1.address)).to.equal(amount1);
            expect(await campaign.donors(donor2.address)).to.equal(amount2);
        });
    });

    describe("Part 12: Edge Cases and Integration", () => {
        it("Should handle exact 2/3 voting threshold", async () => {
            const { campaign, campaignOwner, donor1, donor2, donor3 } = await loadFixture(deployCampaignFixture);

            // Setup: 6 ETH total, need exactly 4 ETH for 2/3
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor3).giveDonationToCause({ value: ethers.parseEther("6") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");

            // Exactly 4 ETH support (2 + 2), 6 ETH against - should fail
            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(true);
            await campaign.connect(donor3).voteOnMilestone(false);

            await time.increase(15 * 24 * 60 * 60);

            await campaign.connect(campaignOwner).withdrawMilestone();

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(1); // Second milestone declined
        });

        it("Should handle complete campaign lifecycle", async () => {
            const { campaign, campaignOwner, donor1, donor2, donor3 } = await loadFixture(deployCampaignFixture);

            // Donation phase
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("4") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("3") });
            await campaign.connect(donor3).giveDonationToCause({ value: ethers.parseEther("3") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // First milestone
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Second milestone - approved
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Third milestone - approved
            await campaign.connect(campaignOwner).createNewMilestone("milestone3");
            await campaign.connect(donor1).voteOnMilestone(true);
            await time.increase(15 * 24 * 60 * 60);
            await campaign.connect(campaignOwner).withdrawMilestone();

            // Verify campaign ended
            expect(await campaign.campaignEnded()).to.equal(true);

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(3);
        });

        it("Should handle donor withdrawal affecting voting power", async () => {
            const { campaign, campaignOwner, donor1, donor2 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("5") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("5") });

            // Donor1 withdraws
            await campaign.connect(donor1).retrieveDonatedAmount();

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // Create milestone - donor1 can't vote anymore
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.be.revertedWithCustomError(campaign, "YouDidNotDonateToThisCampaign");
        });

        it("Should handle multiple donors with varying amounts", async () => {
            const { campaign, donor1, donor2, donor3, donor4, donor5 } = await loadFixture(deployCampaignFixture);

            const amounts = [
                ethers.parseEther("0.1"),
                ethers.parseEther("1"),
                ethers.parseEther("5"),
                ethers.parseEther("10"),
                ethers.parseEther("50")
            ];

            await campaign.connect(donor1).giveDonationToCause({ value: amounts[0] });
            await campaign.connect(donor2).giveDonationToCause({ value: amounts[1] });
            await campaign.connect(donor3).giveDonationToCause({ value: amounts[2] });
            await campaign.connect(donor4).giveDonationToCause({ value: amounts[3] });
            await campaign.connect(donor5).giveDonationToCause({ value: amounts[4] });

            const [amountDonated, , numberOfDonors] = await campaign.getCampaignStats();

            const expectedTotal = amounts.reduce((a, b) => a + b, 0n);
            expect(amountDonated).to.equal(expectedTotal);
            expect(numberOfDonors).to.equal(5);
        });

        it("Should apply fixed 10% tax on donor withdrawal", async () => {
            const { campaign, donor1 } = await loadFixture(deployCampaignFixture);

            const donationAmount = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const taxRate = await campaign.getWithdrawalTaxRate();
            expect(taxRate).to.equal(10); // Fixed 10% tax

            const expectedTax = (donationAmount * 10n) / 100n;
            const expectedReturn = donationAmount - expectedTax;

            const donorBalanceBefore = await ethers.provider.getBalance(donor1.address);
            const tx = await campaign.connect(donor1).retrieveDonatedAmount();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const donorBalanceAfter = await ethers.provider.getBalance(donor1.address);

            expect(donorBalanceAfter + gasUsed - donorBalanceBefore).to.equal(expectedReturn);
        });

        it("Should handle custom voting period", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            await campaign.connect(campaignOwner).setVotingPeriod(21); // 21 days

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            await campaign.connect(campaignOwner).withdrawMilestone();

            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await campaign.connect(donor1).voteOnMilestone(true);

            // Should allow withdrawal after 21 days
            await time.increase(21 * 24 * 60 * 60 + 1);

            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.not.be.reverted;
        });

        it("Should handle precision in withdrawal calculations", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Use amount that doesn't divide evenly by 3
            const donationAmount = ethers.parseEther("10");
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            // First withdrawal (1/3)
            await campaign.connect(campaignOwner).createNewMilestone("milestone1");
            const balanceBefore = await campaign.contractBalance();
            await campaign.connect(campaignOwner).withdrawMilestone();
            const balanceAfter = await campaign.contractBalance();

            const withdrawn = balanceBefore - balanceAfter;
            const expected = balanceBefore / 3n;

            expect(withdrawn).to.equal(expected);
        });

        it("Should emit all events correctly in full lifecycle", async () => {
            const { campaign, campaignOwner, donor1 } = await loadFixture(deployCampaignFixture);

            // Donation event
            await expect(
                campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("10") })
            ).to.emit(campaign, "DonationReceived");

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);

            // Campaign ended event
            await expect(
                campaign.endCampaign()
            ).to.emit(campaign, "CampaignEnded");

            // Milestone created event
            await expect(
                campaign.connect(campaignOwner).createNewMilestone("milestone1")
            ).to.emit(campaign, "MilestoneCreated");

            // Milestone withdrawn event
            await expect(
                campaign.connect(campaignOwner).withdrawMilestone()
            ).to.emit(campaign, "MilestoneWithdrawn");

            // Voting event
            await campaign.connect(campaignOwner).createNewMilestone("milestone2");
            await expect(
                campaign.connect(donor1).voteOnMilestone(true)
            ).to.emit(campaign, "VotedOnMilestone");
        });

        it("Should handle maximum gas scenarios", async () => {
            const { campaign, campaignOwner, donor1, donor2, donor3, donor4, donor5 } = await loadFixture(deployCampaignFixture);

            // Multiple donors
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor2).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor3).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor4).giveDonationToCause({ value: ethers.parseEther("2") });
            await campaign.connect(donor5).giveDonationToCause({ value: ethers.parseEther("2") });

            const [, duration] = await campaign.getFundingDetails();
            await time.increaseTo(Number(duration) + 1);
            await campaign.endCampaign();

            await campaign.connect(campaignOwner).createNewMilestone("milestone1");

            // All vote
            await campaign.connect(donor1).voteOnMilestone(true);
            await campaign.connect(donor2).voteOnMilestone(true);
            await campaign.connect(donor3).voteOnMilestone(false);
            await campaign.connect(donor4).voteOnMilestone(true);
            await campaign.connect(donor5).voteOnMilestone(false);

            // Should still process successfully
            await campaign.connect(campaignOwner).withdrawMilestone();

            const [, , , approvedMilestones] = await campaign.getCampaignStats();
            expect(approvedMilestones).to.equal(1);
        });
    });
});
