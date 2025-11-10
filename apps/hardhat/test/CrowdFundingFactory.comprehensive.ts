import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFundingFactory, CrowdFundingToken, CrowdFunding } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("CrowdFundingFactory - Comprehensive Tests", () => {
    // Enums matching contract
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

    async function deployFactoryFixture() {
        const [owner, user1, user2, user3, user4] = await ethers.getSigners();

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

        return { factory, token, implementation, owner, user1, user2, user3, user4 };
    }

    describe("Deployment", () => {
        it("Should deploy with correct token address", async () => {
            const { factory, token } = await loadFixture(deployFactoryFixture);

            expect(await factory.donationToken()).to.equal(await token.getAddress());
        });

        it("Should set deployer as owner", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            expect(await factory.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero campaigns", async () => {
            const { factory } = await loadFixture(deployFactoryFixture);

            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(allCampaigns.length).to.equal(0);
        });

        it("Should initialize with default fee", async () => {
            const { factory } = await loadFixture(deployFactoryFixture);

            const fee = await factory.getFundingFee();
            expect(fee).to.equal(ethers.parseEther("0.000000001")); // Default fee from contract
        });

        it("Should initialize with zero balance", async () => {
            const { factory } = await loadFixture(deployFactoryFixture);

            expect(await ethers.provider.getBalance(await factory.getAddress())).to.equal(0);
        });
    });

    describe("Campaign Creation", () => {
        const validParams = {
            cid: "QmTestCID123",
            category: Category.TECHNOLOGY,
            title: "Test Campaign",
            targetAmount: ethers.parseEther("10"),
            duration: 30 * 24 * 60 * 60 // 30 days in seconds
        };

        it("Should create campaign successfully with valid parameters", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            const tx = await factory.connect(user1).createNewCrowdFundingContract(
                validParams.cid,
                validParams.category,
                validParams.title,
                validParams.targetAmount,
                validParams.duration,
                { value: fundingFee }
            );

            const receipt = await tx.wait();

            // Check event emission
            expect(receipt?.logs.length).to.be.greaterThan(0);

            // Verify campaign was created
            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(allCampaigns.length).to.equal(1);
        });

        it("Should emit CampaignCreated event with correct parameters", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            const tx = await factory.connect(user1).createNewCrowdFundingContract(
                validParams.cid,
                validParams.category,
                validParams.title,
                validParams.targetAmount,
                validParams.duration,
                { value: fundingFee }
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: any) => {
                try {
                    return factory.interface.parseLog(log as any)?.name === "NewCrowdFundingContractCreated";
                } catch { return false; }
            });

            expect(event).to.not.be.undefined;
        });

        it("Should register campaign with token contract", async () => {
            const { factory, token, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            const tx = await factory.connect(user1).createNewCrowdFundingContract(
                validParams.cid,
                validParams.category,
                validParams.title,
                validParams.targetAmount,
                validParams.duration,
                { value: fundingFee }
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: any) => {
                try {
                    return factory.interface.parseLog(log as any)?.name === "NewCrowdFundingContractCreated";
                } catch { return false; }
            });
            const parsedEvent = factory.interface.parseLog(event as any);
            const campaignAddress = parsedEvent?.args[1];

            // Verify campaign is registered with token
            expect(await token.crowdfundingContracts(campaignAddress)).to.equal(true);
        });

        it("Should track campaign by owner", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await factory.connect(user1).createNewCrowdFundingContract(
                validParams.cid,
                validParams.category,
                validParams.title,
                validParams.targetAmount,
                validParams.duration,
                { value: fundingFee }
            );

            const ownerCampaigns = await factory.getCampaignsByOwner(user1.address);
            expect(ownerCampaigns.length).to.equal(1);
        });

        it("Should allow user to create multiple campaigns", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1",
                Category.TECHNOLOGY,
                "Campaign 1",
                ethers.parseEther("10"),
                30 * 24 * 60 * 60,
                { value: fundingFee }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID2",
                Category.ARTS,
                "Campaign 2",
                ethers.parseEther("20"),
                60 * 24 * 60 * 60,
                { value: fundingFee }
            );

            const ownerCampaigns = await factory.getCampaignsByOwner(user1.address);
            expect(ownerCampaigns.length).to.equal(2);

            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(allCampaigns.length).to.equal(2);
        });

        it("Should create campaigns for different users independently", async () => {
            const { factory, user1, user2, user3 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: fundingFee }
            );

            await factory.connect(user2).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60, { value: fundingFee }
            );

            await factory.connect(user3).createNewCrowdFundingContract(
                "CID3", Category.HEALTH, "Campaign 3",
                ethers.parseEther("30"), 90 * 24 * 60 * 60, { value: fundingFee }
            );

            expect((await factory.getCampaignsByOwner(user1.address)).length).to.equal(1);
            expect((await factory.getCampaignsByOwner(user2.address)).length).to.equal(1);
            expect((await factory.getCampaignsByOwner(user3.address)).length).to.equal(1);
            expect((await factory.getDeployedCrowdFundingContracts()).length).to.equal(3);
        });

        it("Should revert with empty CID", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    "",
                    validParams.category,
                    validParams.title,
                    validParams.targetAmount,
                    validParams.duration,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Empty contract details ID");
        });
        it("Should revert with empty title", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    "",
                    validParams.targetAmount,
                    validParams.duration,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Empty title");
        });

        it("Should revert with zero target amount", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    validParams.title,
                    0,
                    validParams.duration,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Goal must be greater than 0");
        });

        it("Should revert with zero duration", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    validParams.title,
                    validParams.targetAmount,
                    0,
                    { value: fundingFee }
                )
            ).to.be.revertedWith("Duration must be greater than 0");
        });

        it("Should revert with invalid category", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            // Passing 99 as category causes Solidity enum overflow - reverts without reason
            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    99, // Invalid category - causes enum overflow
                    validParams.title,
                    validParams.targetAmount,
                    validParams.duration,
                    { value: fundingFee }
                )
            ).to.be.reverted; // Just check it reverts (enum overflow has no custom error)
        });

        it("Should revert when insufficient fee sent", async () => {
            const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

            // Set funding fee
            const newFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(newFee);

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    validParams.title,
                    validParams.targetAmount,
                    validParams.duration,
                    { value: ethers.parseEther("0.05") } // Insufficient
                )
            ).to.be.revertedWithCustomError(factory, "FundingForNewContractTooSmall");
        });

        it("Should accept exact funding fee", async () => {
            const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

            const newFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(newFee);

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    validParams.title,
                    validParams.targetAmount,
                    validParams.duration,
                    { value: newFee }
                )
            ).to.not.be.reverted;
        });

        it("Should accept excess funding fee", async () => {
            const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

            const newFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(newFee);

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    validParams.cid,
                    validParams.category,
                    validParams.title,
                    validParams.targetAmount,
                    validParams.duration,
                    { value: ethers.parseEther("0.2") } // Excess
                )
            ).to.not.be.reverted;
        });

        it("Should accept all valid category types", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const fundingFee = await factory.getFundingFee();
            const categories = [
                Category.TECHNOLOGY,
                Category.ARTS,
                Category.COMMUNITY,
                Category.EDUCATION,
                Category.ENVIRONMENT,
                Category.HEALTH,
                Category.SOCIAL,
                Category.CHARITY,
                Category.OTHER
            ];

            for (let i = 0; i < categories.length; i++) {
                await factory.connect(user1).createNewCrowdFundingContract(
                    `CID${i}`,
                    categories[i],
                    `Campaign ${i}`,
                    ethers.parseEther("10"),
                    30 * 24 * 60 * 60,
                    { value: fundingFee }
                );
            }

            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(allCampaigns.length).to.equal(categories.length);
        });
    });

    describe("Fee Management", () => {
        it("Should allow owner to set creation fee", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            const oldFee = await factory.getFundingFee();
            const newFee = ethers.parseEther("0.5");

            await expect(factory.connect(owner).setFundingFee(newFee))
                .to.emit(factory, "FundingFeeUpdated")
                .withArgs(oldFee, newFee);

            expect(await factory.getFundingFee()).to.equal(newFee);
        });

        it("Should revert when non-owner tries to set fee", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(user1).setFundingFee(ethers.parseEther("0.5"))
            ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
        });

        it("Should revert when setting fee above 1 ETH", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(owner).setFundingFee(ethers.parseEther("1.1"))
            ).to.be.revertedWithCustomError(factory, "InvalidFee");
        });

        it("Should allow setting fee to exactly 1 ETH", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(owner).setFundingFee(ethers.parseEther("1"))
            ).to.not.be.reverted;

            expect(await factory.getFundingFee()).to.equal(ethers.parseEther("1"));
        });

        it("Should allow setting fee to zero", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            // First set to non-zero
            const oldFee = ethers.parseEther("0.5");
            await factory.connect(owner).setFundingFee(oldFee);

            // Then set back to zero
            await expect(factory.connect(owner).setFundingFee(0))
                .to.emit(factory, "FundingFeeUpdated")
                .withArgs(oldFee, 0);

            expect(await factory.getFundingFee()).to.equal(0);
        });

        it("Should accumulate fees from multiple campaign creations", async () => {
            const { factory, owner, user1, user2, user3 } = await loadFixture(deployFactoryFixture);

            const creationFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(creationFee);

            const factoryAddress = await factory.getAddress();
            const initialBalance = await ethers.provider.getBalance(factoryAddress);

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60,
                { value: creationFee }
            );

            await factory.connect(user2).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60,
                { value: creationFee }
            );

            await factory.connect(user3).createNewCrowdFundingContract(
                "CID3", Category.HEALTH, "Campaign 3",
                ethers.parseEther("30"), 90 * 24 * 60 * 60,
                { value: creationFee }
            );

            const finalBalance = await ethers.provider.getBalance(factoryAddress);
            expect(finalBalance - initialBalance).to.equal(creationFee * 3n);
        });
    });

    describe("Funds Withdrawal", () => {
        it("Should allow owner to withdraw accumulated fees", async () => {
            const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

            const creationFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(creationFee);

            // Create campaign to accumulate fees
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60,
                { value: creationFee }
            );

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            const tx = await factory.connect(owner).withdrawFunds();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(ownerBalanceAfter + gasUsed - ownerBalanceBefore).to.equal(creationFee);
        });

        it("Should revert when non-owner tries to withdraw", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(user1).withdrawFunds()
            ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
        });

        it("Should revert when withdrawing with zero balance", async () => {
            const { factory, owner } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(owner).withdrawFunds()
            ).to.be.revertedWithCustomError(factory, "NoFundsToWithdraw");
        });

        it("Should emit FundsWithdrawn event", async () => {
            const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

            const creationFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(creationFee);

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60,
                { value: creationFee }
            );

            await expect(factory.connect(owner).withdrawFunds())
                .to.emit(factory, "FundsWithdrawn")
                .withArgs(owner.address, creationFee);
        });

        it("Should withdraw all accumulated funds", async () => {
            const { factory, owner, user1, user2 } = await loadFixture(deployFactoryFixture);

            const creationFee = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(creationFee);

            // Create multiple campaigns
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60,
                { value: creationFee }
            );

            await factory.connect(user2).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60,
                { value: creationFee }
            );

            const factoryAddress = await factory.getAddress();
            const balanceBefore = await ethers.provider.getBalance(factoryAddress);

            await factory.connect(owner).withdrawFunds();

            const balanceAfter = await ethers.provider.getBalance(factoryAddress);
            expect(balanceAfter).to.equal(0);
            expect(balanceBefore).to.equal(creationFee * 2n);
        });
    });

    describe("View Functions", () => {
        it("Should return all campaigns", async () => {
            const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user2).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(allCampaigns.length).to.equal(2);
        });

        it("Should return campaigns by specific owner", async () => {
            const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

            // User1 creates 2 campaigns
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            // User2 creates 1 campaign
            await factory.connect(user2).createNewCrowdFundingContract(
                "CID3", Category.HEALTH, "Campaign 3",
                ethers.parseEther("30"), 90 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            const user1Campaigns = await factory.getCampaignsByOwner(user1.address);
            const user2Campaigns = await factory.getCampaignsByOwner(user2.address);

            expect(user1Campaigns.length).to.equal(2);
            expect(user2Campaigns.length).to.equal(1);
        });

        it("Should return empty array for owner with no campaigns", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const campaigns = await factory.getCampaignsByOwner(user1.address);
            expect(campaigns.length).to.equal(0);
        });

        it("Should return correct campaign addresses", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const campaignAddress = await factory.connect(user1).createNewCrowdFundingContract.staticCall(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            const allCampaigns = await factory.getDeployedCrowdFundingContracts();
            const ownerCampaigns = await factory.getCampaignsByOwner(user1.address);

            expect(allCampaigns[0]).to.equal(campaignAddress);
            expect(ownerCampaigns[0]).to.equal(campaignAddress);
        });
    });

    describe("Campaign Contract Initialization", () => {
        it("Should initialize campaign with correct owner", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const campaignAddress = await factory.connect(user1).createNewCrowdFundingContract.staticCall(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
            const campaign = CrowdFunding.attach(campaignAddress) as any;

            const [owner] = await campaign.getFundingDetails();
            expect(owner).to.equal(user1.address);
        });

        it("Should initialize campaign with correct target amount", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const targetAmount = ethers.parseEther("25");

            const campaignAddress = await factory.connect(user1).createNewCrowdFundingContract.staticCall(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                targetAmount, 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                targetAmount, 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
            const campaign = CrowdFunding.attach(campaignAddress) as any;

            const [, , target] = await campaign.getFundingDetails();
            expect(target).to.equal(targetAmount);
        });

        it("Should initialize campaign with correct duration", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const duration = 60 * 24 * 60 * 60; // 60 days

            const campaignAddress = await factory.connect(user1).createNewCrowdFundingContract.staticCall(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), duration, { value: ethers.parseEther("0.000000001") }
            );

            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), duration, { value: ethers.parseEther("0.000000001") }
            );

            const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
            const campaign = CrowdFunding.attach(campaignAddress) as any;

            const [, campaignDuration] = await campaign.getFundingDetails();
            const currentTime = await time.latest();

            // Campaign stores block.timestamp + duration
            expect(Number(campaignDuration)).to.be.closeTo(currentTime + duration, 10);
        });
    });

    describe("Integration Tests", () => {
        it("Should handle multiple users creating multiple campaigns", async () => {
            const { factory, user1, user2, user3 } = await loadFixture(deployFactoryFixture);

            // User1 creates 3 campaigns
            for (let i = 0; i < 3; i++) {
                await factory.connect(user1).createNewCrowdFundingContract(
                    `CID_U1_${i}`, Category.TECHNOLOGY, `User1 Campaign ${i}`,
                    ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
                );
            }

            // User2 creates 2 campaigns
            for (let i = 0; i < 2; i++) {
                await factory.connect(user2).createNewCrowdFundingContract(
                    `CID_U2_${i}`, Category.ARTS, `User2 Campaign ${i}`,
                    ethers.parseEther("20"), 60 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
                );
            }

            // User3 creates 1 campaign
            await factory.connect(user3).createNewCrowdFundingContract(
                "CID_U3_0", Category.HEALTH, "User3 Campaign 0",
                ethers.parseEther("30"), 90 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            expect((await factory.getCampaignsByOwner(user1.address)).length).to.equal(3);
            expect((await factory.getCampaignsByOwner(user2.address)).length).to.equal(2);
            expect((await factory.getCampaignsByOwner(user3.address)).length).to.equal(1);
            expect((await factory.getDeployedCrowdFundingContracts()).length).to.equal(6);
        });

        it("Should handle fee changes during campaign creation lifecycle", async () => {
            const { factory, owner, user1, user2 } = await loadFixture(deployFactoryFixture);

            // Create campaign with no fee
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID1", Category.TECHNOLOGY, "Campaign 1",
                ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
            );

            // Set fee
            const fee1 = ethers.parseEther("0.1");
            await factory.connect(owner).setFundingFee(fee1);

            // Create campaign with fee1
            await factory.connect(user2).createNewCrowdFundingContract(
                "CID2", Category.ARTS, "Campaign 2",
                ethers.parseEther("20"), 60 * 24 * 60 * 60, { value: fee1 }
            );

            // Change fee
            const fee2 = ethers.parseEther("0.2");
            await factory.connect(owner).setFundingFee(fee2);

            // Create campaign with fee2
            await factory.connect(user1).createNewCrowdFundingContract(
                "CID3", Category.HEALTH, "Campaign 3",
                ethers.parseEther("30"), 90 * 24 * 60 * 60, { value: fee2 }
            );

            const factoryBalance = await ethers.provider.getBalance(await factory.getAddress());
            expect(factoryBalance).to.equal(ethers.parseEther("0.000000001") + fee1 + fee2);
        });
    });

    describe("Edge Cases", () => {
        it("Should handle very large target amounts", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const largeAmount = ethers.parseEther("1000000"); // 1 million ETH

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    "CID1", Category.TECHNOLOGY, "Campaign 1",
                    largeAmount, 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
                )
            ).to.not.be.reverted;
        });

        it("Should handle very long durations", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const longDuration = 365 * 24 * 60 * 60; // 1 year

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    "CID1", Category.TECHNOLOGY, "Campaign 1",
                    ethers.parseEther("10"), longDuration, { value: ethers.parseEther("0.000000001") }
                )
            ).to.not.be.reverted;
        });

        it("Should handle very long CIDs", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const longCID = "Q" + "m".repeat(500); // Very long CID

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    longCID, Category.TECHNOLOGY, "Campaign 1",
                    ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
                )
            ).to.not.be.reverted;
        });

        it("Should handle very long titles", async () => {
            const { factory, user1 } = await loadFixture(deployFactoryFixture);

            const longTitle = "A".repeat(1000); // Very long title

            await expect(
                factory.connect(user1).createNewCrowdFundingContract(
                    "CID1", Category.TECHNOLOGY, longTitle,
                    ethers.parseEther("10"), 30 * 24 * 60 * 60, { value: ethers.parseEther("0.000000001") }
                )
            ).to.not.be.reverted;
        });
    });
});
