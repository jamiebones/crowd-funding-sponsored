import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFundingFactory, CrowdFundingToken, CrowdFunding } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Donation Scale Feature", () => {
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

    async function deployWithScaleFixture() {
        const [owner, campaignOwner, donor1, donor2, donor3] = await ethers.getSigners();

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

        return {
            factory,
            token,
            implementation,
            owner,
            campaignOwner,
            donor1,
            donor2,
            donor3
        };
    }

    async function createCampaign(factory: CrowdFundingFactory, campaignOwner: any) {
        const targetAmount = ethers.parseEther("10");
        const duration = 30 * 24 * 60 * 60;
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
        const event = receipt?.logs.find((log: any) => {
            try {
                const parsed = factory.interface.parseLog(log as any);
                return parsed?.name === "NewCrowdFundingContractCreated";
            } catch {
                return false;
            }
        });

        const parsedEvent = factory.interface.parseLog(event as any);
        const campaignAddress = parsedEvent?.args[1];

        const CrowdFundingContract = await ethers.getContractFactory("CrowdFunding");
        return CrowdFundingContract.attach(campaignAddress) as CrowdFunding;
    }

    describe("Factory - Donation Scale Management", () => {
        it("Should initialize with default donation scale of 1", async () => {
            const { factory } = await loadFixture(deployWithScaleFixture);

            expect(await factory.getDonationScale()).to.equal(1);
        });

        it("Should allow owner to set donation scale", async () => {
            const { factory, owner } = await loadFixture(deployWithScaleFixture);

            await expect(factory.connect(owner).setDonationScale(5))
                .to.emit(factory, "DonationScaleUpdated")
                .withArgs(1, 5);

            expect(await factory.getDonationScale()).to.equal(5);
        });

        it("Should allow setting various scale values", async () => {
            const { factory, owner } = await loadFixture(deployWithScaleFixture);

            // Test different scales
            const scales = [1, 2, 5, 10, 50, 100, 500, 1000];

            for (const scale of scales) {
                await factory.connect(owner).setDonationScale(scale);
                expect(await factory.getDonationScale()).to.equal(scale);
            }
        });

        it("Should revert when non-owner tries to set scale", async () => {
            const { factory, donor1 } = await loadFixture(deployWithScaleFixture);

            await expect(
                factory.connect(donor1).setDonationScale(10)
            ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
        });

        it("Should revert when setting scale to 0", async () => {
            const { factory, owner } = await loadFixture(deployWithScaleFixture);

            await expect(
                factory.connect(owner).setDonationScale(0)
            ).to.be.revertedWithCustomError(factory, "InvalidDonationScale");
        });

        it("Should allow setting scale above 1000", async () => {
            const { factory, owner } = await loadFixture(deployWithScaleFixture);

            // No upper limit validation in the contract
            await factory.connect(owner).setDonationScale(1001);
            expect(await factory.getDonationScale()).to.equal(1001);

            await factory.connect(owner).setDonationScale(10000);
            expect(await factory.getDonationScale()).to.equal(10000);
        });

        it("Should emit correct event with old and new scale", async () => {
            const { factory, owner } = await loadFixture(deployWithScaleFixture);

            // Set to 5
            await factory.connect(owner).setDonationScale(5);

            // Change to 10
            await expect(factory.connect(owner).setDonationScale(10))
                .to.emit(factory, "DonationScaleUpdated")
                .withArgs(5, 10);
        });
    });

    describe("Campaign - Token Minting with Scale", () => {
        it("Should mint tokens at 1x scale (default)", async () => {
            const { factory, token, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // With 1x scale, tokens = donation amount
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);
        });

        it("Should mint tokens at 2x scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 2x
            await factory.connect(owner).setDonationScale(2);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // With 2x scale, tokens = 2 * donation amount
            const expectedTokens = donationAmount * 2n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);
        });

        it("Should mint tokens at 10x scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 10x
            await factory.connect(owner).setDonationScale(10);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("0.5");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // With 10x scale, tokens = 10 * donation amount
            const expectedTokens = donationAmount * 10n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);
        });

        it("Should mint tokens at 100x scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 100x
            await factory.connect(owner).setDonationScale(100);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("0.1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // With 100x scale, tokens = 100 * donation amount
            const expectedTokens = donationAmount * 100n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);
        });

        it("Should handle multiple donations with same scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 5x
            await factory.connect(owner).setDonationScale(5);

            const campaign = await createCampaign(factory, campaignOwner);
            const donation1 = ethers.parseEther("1");
            const donation2 = ethers.parseEther("0.5");

            await campaign.connect(donor1).giveDonationToCause({ value: donation1 });
            await campaign.connect(donor1).giveDonationToCause({ value: donation2 });

            // Total tokens = (1 + 0.5) * 5 = 7.5 ETH worth of tokens
            const expectedTokens = (donation1 + donation2) * 5n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);
        });

        it("Should mint correct tokens for multiple donors with scale", async () => {
            const { factory, token, owner, campaignOwner, donor1, donor2, donor3 } =
                await loadFixture(deployWithScaleFixture);

            // Set scale to 3x
            await factory.connect(owner).setDonationScale(3);

            const campaign = await createCampaign(factory, campaignOwner);

            const amount1 = ethers.parseEther("1");
            const amount2 = ethers.parseEther("2");
            const amount3 = ethers.parseEther("0.5");

            await campaign.connect(donor1).giveDonationToCause({ value: amount1 });
            await campaign.connect(donor2).giveDonationToCause({ value: amount2 });
            await campaign.connect(donor3).giveDonationToCause({ value: amount3 });

            expect(await token.balanceOf(donor1.address)).to.equal(amount1 * 3n);
            expect(await token.balanceOf(donor2.address)).to.equal(amount2 * 3n);
            expect(await token.balanceOf(donor3.address)).to.equal(amount3 * 3n);
        });

        it("Should use current scale at time of donation", async () => {
            const { factory, token, owner, campaignOwner, donor1, donor2 } =
                await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            // First donation at 1x scale
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);

            // Change scale to 5x
            await factory.connect(owner).setDonationScale(5);

            // Second donor donates at 5x scale
            await campaign.connect(donor2).giveDonationToCause({ value: donationAmount });
            expect(await token.balanceOf(donor2.address)).to.equal(donationAmount * 5n);

            // Verify first donor still has original amount
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);
        });
    });

    describe("Campaign - Token Burning with Scale", () => {
        it("Should burn scaled tokens on withdrawal at 1x scale", async () => {
            const { factory, token, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount);

            // Withdraw donation
            await campaign.connect(donor1).retrieveDonatedAmount();

            // Tokens should be burned
            expect(await token.balanceOf(donor1.address)).to.equal(0);
        });

        it("Should burn scaled tokens on withdrawal at 5x scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 5x
            await factory.connect(owner).setDonationScale(5);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // Verify minted tokens
            const expectedTokens = donationAmount * 5n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);

            // Withdraw donation
            await campaign.connect(donor1).retrieveDonatedAmount();

            // All tokens should be burned
            expect(await token.balanceOf(donor1.address)).to.equal(0);
        });

        it("Should burn correct amount when scale changed between donation and withdrawal", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 2x
            await factory.connect(owner).setDonationScale(2);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            // Donate at 2x scale
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount * 2n);
            expect(await campaign.donorScale(donor1.address)).to.equal(2);

            // Change factory scale to 10x
            await factory.connect(owner).setDonationScale(10);

            // Withdraw - should use stored scale (2x) for burning, not current factory scale (10x)
            // This should succeed because donor has 2 tokens and needs to burn 2 tokens (1 ETH * 2x)
            await campaign.connect(donor1).retrieveDonatedAmount();

            // Verify all tokens were burned
            expect(await token.balanceOf(donor1.address)).to.equal(0);
            // Verify donor scale was cleared
            expect(await campaign.donorScale(donor1.address)).to.equal(0);
        });

        it("Should handle partial withdrawals correctly with scaling", async () => {
            const { factory, token, owner, campaignOwner, donor1, donor2 } =
                await loadFixture(deployWithScaleFixture);

            // Set scale to 3x
            await factory.connect(owner).setDonationScale(3);

            const campaign = await createCampaign(factory, campaignOwner);
            const donation1 = ethers.parseEther("2");
            const donation2 = ethers.parseEther("1");

            // Two donors donate
            await campaign.connect(donor1).giveDonationToCause({ value: donation1 });
            await campaign.connect(donor2).giveDonationToCause({ value: donation2 });

            expect(await token.balanceOf(donor1.address)).to.equal(donation1 * 3n);
            expect(await token.balanceOf(donor2.address)).to.equal(donation2 * 3n);

            // Only donor1 withdraws
            await campaign.connect(donor1).retrieveDonatedAmount();

            expect(await token.balanceOf(donor1.address)).to.equal(0);
            expect(await token.balanceOf(donor2.address)).to.equal(donation2 * 3n);
        });
    });

    describe("Donor-Specific Scale Storage", () => {
        it("Should store donor's scale at time of first donation", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 3x
            await factory.connect(owner).setDonationScale(3);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // Verify donor's stored scale
            expect(await campaign.donorScale(donor1.address)).to.equal(3);
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount * 3n);
        });

        it("Should use weighted average when donor donates at different scales", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);

            // First donation at 2x scale
            await factory.connect(owner).setDonationScale(2);
            const donation1 = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donation1 });

            // Donor should have 2 tokens and scale of 2
            expect(await token.balanceOf(donor1.address)).to.equal(donation1 * 2n);
            expect(await campaign.donorScale(donor1.address)).to.equal(2);

            // Second donation at 10x scale
            await factory.connect(owner).setDonationScale(10);
            const donation2 = ethers.parseEther("1");
            await campaign.connect(donor1).giveDonationToCause({ value: donation2 });

            // Donor should now have 2 + 10 = 12 tokens
            expect(await token.balanceOf(donor1.address)).to.equal((donation1 * 2n) + (donation2 * 10n));

            // Weighted average scale: (1 * 2 + 1 * 10) / (1 + 1) = 12 / 2 = 6
            expect(await campaign.donorScale(donor1.address)).to.equal(6);
        });

        it("Should burn correct tokens using stored scale when factory scale changes", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set scale to 2x
            await factory.connect(owner).setDonationScale(2);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            // Donate at 2x scale
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount * 2n);
            expect(await campaign.donorScale(donor1.address)).to.equal(2);

            // Change factory scale to 10x
            await factory.connect(owner).setDonationScale(10);

            // Withdraw - should use stored scale (2x), not current factory scale (10x)
            await campaign.connect(donor1).retrieveDonatedAmount();

            // All tokens should be burned (2 tokens)
            expect(await token.balanceOf(donor1.address)).to.equal(0);
            // Donor scale should be cleared
            expect(await campaign.donorScale(donor1.address)).to.equal(0);
        });

        it("Should handle multiple donors with different stored scales correctly", async () => {
            const { factory, token, owner, campaignOwner, donor1, donor2, donor3 } =
                await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            // Donor1 donates at 1x (default)
            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });
            expect(await campaign.donorScale(donor1.address)).to.equal(1);

            // Change to 5x
            await factory.connect(owner).setDonationScale(5);

            // Donor2 donates at 5x
            await campaign.connect(donor2).giveDonationToCause({ value: donationAmount });
            expect(await campaign.donorScale(donor2.address)).to.equal(5);

            // Change to 10x
            await factory.connect(owner).setDonationScale(10);

            // Donor3 donates at 10x
            await campaign.connect(donor3).giveDonationToCause({ value: donationAmount });
            expect(await campaign.donorScale(donor3.address)).to.equal(10);

            // Verify token balances
            expect(await token.balanceOf(donor1.address)).to.equal(donationAmount * 1n);
            expect(await token.balanceOf(donor2.address)).to.equal(donationAmount * 5n);
            expect(await token.balanceOf(donor3.address)).to.equal(donationAmount * 10n);

            // Each donor withdraws - should use their stored scale
            await campaign.connect(donor1).retrieveDonatedAmount();
            expect(await token.balanceOf(donor1.address)).to.equal(0);

            await campaign.connect(donor2).retrieveDonatedAmount();
            expect(await token.balanceOf(donor2.address)).to.equal(0);

            await campaign.connect(donor3).retrieveDonatedAmount();
            expect(await token.balanceOf(donor3.address)).to.equal(0);
        });

        it("Should calculate weighted average correctly for multiple donations", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);

            // Donation 1: 2 ETH at 2x scale = 4 tokens
            await factory.connect(owner).setDonationScale(2);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("2") });
            expect(await campaign.donorScale(donor1.address)).to.equal(2);

            // Donation 2: 4 ETH at 8x scale = 32 tokens
            await factory.connect(owner).setDonationScale(8);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("4") });

            // Weighted average: (2*2 + 4*8) / (2+4) = (4 + 32) / 6 = 36 / 6 = 6
            expect(await campaign.donorScale(donor1.address)).to.equal(6);

            // Total tokens: 4 + 32 = 36
            expect(await token.balanceOf(donor1.address)).to.equal(ethers.parseEther("36"));

            // Withdrawal should burn exactly 36 tokens (6 ETH * 6x scale)
            await campaign.connect(donor1).retrieveDonatedAmount();
            expect(await token.balanceOf(donor1.address)).to.equal(0);
        });

        it("Should handle weighted average with three donations at different scales", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);

            // Donation 1: 1 ETH at 1x = 1 token
            await factory.connect(owner).setDonationScale(1);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });

            // Donation 2: 1 ETH at 5x = 5 tokens
            await factory.connect(owner).setDonationScale(5);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });

            // Donation 3: 1 ETH at 9x = 9 tokens
            await factory.connect(owner).setDonationScale(9);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });

            // Weighted average: (1*1 + 1*5 + 1*9) / 3 = 15 / 3 = 5
            expect(await campaign.donorScale(donor1.address)).to.equal(5);

            // Total tokens: 1 + 5 + 9 = 15
            expect(await token.balanceOf(donor1.address)).to.equal(ethers.parseEther("15"));

            // Withdrawal should burn 3 ETH * 5x = 15 tokens
            await campaign.connect(donor1).retrieveDonatedAmount();
            expect(await token.balanceOf(donor1.address)).to.equal(0);
        });

        it("Should clear donor scale after withdrawal", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            await factory.connect(owner).setDonationScale(7);
            const campaign = await createCampaign(factory, campaignOwner);

            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            expect(await campaign.donorScale(donor1.address)).to.equal(7);

            await campaign.connect(donor1).retrieveDonatedAmount();

            // Scale should be cleared
            expect(await campaign.donorScale(donor1.address)).to.equal(0);
            expect(await campaign.donors(donor1.address)).to.equal(0);
        });

        it("Should allow donor to donate again after withdrawal with new scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            const campaign = await createCampaign(factory, campaignOwner);

            // First cycle: donate at 3x, withdraw
            await factory.connect(owner).setDonationScale(3);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            expect(await campaign.donorScale(donor1.address)).to.equal(3);
            expect(await token.balanceOf(donor1.address)).to.equal(ethers.parseEther("3"));

            await campaign.connect(donor1).retrieveDonatedAmount();
            expect(await token.balanceOf(donor1.address)).to.equal(0);
            expect(await campaign.donorScale(donor1.address)).to.equal(0);

            // Second cycle: donate at 7x, verify new scale is used
            await factory.connect(owner).setDonationScale(7);
            await campaign.connect(donor1).giveDonationToCause({ value: ethers.parseEther("1") });
            expect(await campaign.donorScale(donor1.address)).to.equal(7);
            expect(await token.balanceOf(donor1.address)).to.equal(ethers.parseEther("7"));
        });
    });

    describe("Edge Cases and Integration", () => {
        it("Should handle maximum scale of 1000x", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Set to maximum scale
            await factory.connect(owner).setDonationScale(1000);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("0.001");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            const expectedTokens = donationAmount * 1000n;
            expect(await token.balanceOf(donor1.address)).to.equal(expectedTokens);
        });

        it("Should handle very small donations with high scale", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            await factory.connect(owner).setDonationScale(100);

            const campaign = await createCampaign(factory, campaignOwner);
            const smallDonation = ethers.parseEther("0.0001");

            await campaign.connect(donor1).giveDonationToCause({ value: smallDonation });

            expect(await token.balanceOf(donor1.address)).to.equal(smallDonation * 100n);
        });

        it("Should maintain campaign balance independently of token scale", async () => {
            const { factory, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            await factory.connect(owner).setDonationScale(10);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("1");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // Campaign balance should be actual ETH donated, not scaled
            expect(await campaign.contractBalance()).to.equal(donationAmount);
        });

        it("Should track donor contributions independently of scale", async () => {
            const { factory, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            await factory.connect(owner).setDonationScale(7);

            const campaign = await createCampaign(factory, campaignOwner);
            const donationAmount = ethers.parseEther("2");

            await campaign.connect(donor1).giveDonationToCause({ value: donationAmount });

            // Donor contribution should be actual ETH, not scaled
            expect(await campaign.donors(donor1.address)).to.equal(donationAmount);
        });

        it("Should work correctly across multiple campaigns with different scales", async () => {
            const { factory, token, owner, campaignOwner, donor1 } = await loadFixture(deployWithScaleFixture);

            // Create first campaign at 2x scale
            await factory.connect(owner).setDonationScale(2);
            const campaign1 = await createCampaign(factory, campaignOwner);

            // Create second campaign at 5x scale  
            await factory.connect(owner).setDonationScale(5);
            const campaign2 = await createCampaign(factory, campaignOwner);

            const donationAmount = ethers.parseEther("1");

            // Donate to first campaign (should use current scale: 5x, not 2x)
            await campaign1.connect(donor1).giveDonationToCause({ value: donationAmount });
            const balanceAfterFirst = await token.balanceOf(donor1.address);
            expect(balanceAfterFirst).to.equal(donationAmount * 5n);

            // Donate to second campaign
            await campaign2.connect(donor1).giveDonationToCause({ value: donationAmount });
            const balanceAfterSecond = await token.balanceOf(donor1.address);
            expect(balanceAfterSecond).to.equal(donationAmount * 10n); // 5 + 5
        });
    });
});
