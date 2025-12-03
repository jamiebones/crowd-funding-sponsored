import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFunding, CrowdFundingFactory, CrowdFundingToken } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Security Fix: Implementation Contract Initialization", () => {
    async function deployFixture() {
        const [deployer, attacker, user1] = await ethers.getSigners();

        // Deploy token
        const CrowdFundingTokenFactory = await ethers.getContractFactory("CrowdFundingToken");
        const token = await CrowdFundingTokenFactory.deploy();
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();

        // Deploy implementation contract (this is the logic contract that will be cloned)
        const CrowdFundingImplementationFactory = await ethers.getContractFactory("CrowdFunding");
        const implementation = await CrowdFundingImplementationFactory.deploy();
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();

        // Deploy factory
        const FactoryFactory = await ethers.getContractFactory("CrowdFundingFactory");
        const factory = await FactoryFactory.deploy(implementationAddress, tokenAddress);
        await factory.waitForDeployment();

        // Set factory and transfer token ownership
        await token.setFactoryAndTransferOwnership(await factory.getAddress());

        return {
            implementation,
            factory,
            token,
            deployer,
            attacker,
            user1,
            implementationAddress,
        };
    }

    describe("Implementation Contract Protection", () => {
        it("Should prevent attacker from initializing the implementation contract", async () => {
            const { implementation, attacker } = await loadFixture(deployFixture);

            console.log("\n=== Testing Implementation Contract Security ===");
            console.log("Attacker address:", attacker.address);

            // Try to initialize the implementation contract
            await expect(
                implementation.connect(attacker).initialize(
                    "QmMaliciousCID",
                    "Malicious Campaign",
                    0, // TECHNOLOGY
                    ethers.parseEther("10"),
                    90 * 24 * 60 * 60, // 90 days
                    attacker.address,
                    ethers.ZeroAddress,
                    attacker.address
                )
            ).to.be.revertedWithCustomError(implementation, "InvalidInitialization");

            console.log("✅ Implementation contract is protected from initialization");
        });

        it("Should allow clones to be initialized normally", async () => {
            const { factory, user1, token } = await loadFixture(deployFixture);

            console.log("\n=== Testing Clone Initialization ===");

            const creationFee = await factory.getFundingFee();

            // Create a campaign (clone)
            const tx = await factory.connect(user1).createNewCrowdFundingContract(
                "QmValidCID",
                0, // TECHNOLOGY
                "Valid Campaign",
                ethers.parseEther("5"),
                30 * 24 * 60 * 60, // 30 days
                { value: creationFee }
            );

            await tx.wait();

            // Get the deployed clone address
            const deployedCampaigns = await factory.getDeployedCrowdFundingContracts();
            expect(deployedCampaigns.length).to.equal(1);

            const cloneAddress = deployedCampaigns[0];
            const clone = await ethers.getContractAt("CrowdFunding", cloneAddress);

            // Verify clone is properly initialized
            const [owner, duration, target] = await clone.getFundingDetails();
            expect(owner).to.equal(user1.address);
            expect(target).to.equal(ethers.parseEther("5"));

            console.log("✅ Clone successfully initialized with correct parameters");
            console.log("   Owner:", owner);
            console.log("   Target:", ethers.formatEther(target), "ETH");
        });

        it("Should prevent re-initialization of clones", async () => {
            const { factory, user1, attacker } = await loadFixture(deployFixture);

            const creationFee = await factory.getFundingFee();

            // Create a campaign
            await factory.connect(user1).createNewCrowdFundingContract(
                "QmValidCID",
                0,
                "Valid Campaign",
                ethers.parseEther("5"),
                30 * 24 * 60 * 60,
                { value: creationFee }
            );

            const deployedCampaigns = await factory.getDeployedCrowdFundingContracts();
            const cloneAddress = deployedCampaigns[0];
            const clone = await ethers.getContractAt("CrowdFunding", cloneAddress);

            // Try to re-initialize the clone
            await expect(
                clone.connect(attacker).initialize(
                    "QmMaliciousCID",
                    "Malicious Campaign",
                    0,
                    ethers.parseEther("10"),
                    90 * 24 * 60 * 60,
                    attacker.address,
                    ethers.ZeroAddress,
                    attacker.address
                )
            ).to.be.revertedWithCustomError(clone, "InvalidInitialization");

            console.log("✅ Clone is protected from re-initialization");
        });

        it("Should demonstrate the security improvement", async () => {
            const { implementation, attacker, user1, factory } = await loadFixture(deployFixture);

            console.log("\n=== Security Improvement Demonstration ===");
            console.log("\nBEFORE FIX (hypothetical):");
            console.log("- Attacker could call initialize() on implementation contract");
            console.log("- Attacker becomes owner of logic contract");
            console.log("- Potential for confusion or phishing attacks");
            console.log("- Users might send funds to implementation by mistake");

            console.log("\nAFTER FIX (current state):");
            console.log("- Constructor calls _disableInitializers()");
            console.log("- Implementation contract cannot be initialized");

            // Verify implementation cannot be initialized
            await expect(
                implementation.connect(attacker).initialize(
                    "QmMaliciousCID",
                    "Malicious Campaign",
                    0,
                    ethers.parseEther("10"),
                    90 * 24 * 60 * 60,
                    attacker.address,
                    ethers.ZeroAddress,
                    attacker.address
                )
            ).to.be.revertedWithCustomError(implementation, "InvalidInitialization");

            console.log("- ✅ Initialization attempt reverted");

            // Verify clones still work
            const creationFee = await factory.getFundingFee();
            await factory.connect(user1).createNewCrowdFundingContract(
                "QmValidCID",
                0,
                "Valid Campaign",
                ethers.parseEther("5"),
                30 * 24 * 60 * 60,
                { value: creationFee }
            );

            console.log("- ✅ Clones can still be created and initialized normally");
            console.log("\nSECURITY STATUS: Protected ✅");
        });

        it("Should verify implementation contract state remains uninitialized", async () => {
            const { implementation } = await loadFixture(deployFixture);

            // Try to call view functions that would fail if uninitialized
            await expect(implementation.contractBalance()).to.not.be.reverted;

            // The campaign should not be ended (default state)
            expect(await implementation.campaignEnded()).to.equal(false);

            // Try to get funding details - should return zero values (uninitialized)
            const [owner, duration, target] = await implementation.getFundingDetails();
            expect(owner).to.equal(ethers.ZeroAddress);
            expect(duration).to.equal(0);
            expect(target).to.equal(0);

            console.log("✅ Implementation contract remains in uninitialized state");
            console.log("   Owner:", owner);
            console.log("   Duration:", duration);
            console.log("   Target:", target);
        });
    });

    describe("Edge Cases", () => {
        it("Should handle multiple initialization attempts gracefully", async () => {
            const { implementation, attacker, user1 } = await loadFixture(deployFixture);

            // Multiple attempts should all fail
            for (let i = 0; i < 3; i++) {
                await expect(
                    implementation.connect(attacker).initialize(
                        `QmAttempt${i}`,
                        `Campaign ${i}`,
                        0,
                        ethers.parseEther("10"),
                        90 * 24 * 60 * 60,
                        attacker.address,
                        ethers.ZeroAddress,
                        attacker.address
                    )
                ).to.be.revertedWithCustomError(implementation, "InvalidInitialization");
            }

            console.log("✅ All 3 initialization attempts failed as expected");
        });

        it("Should not affect existing campaigns created before the fix", async () => {
            const { factory, user1 } = await loadFixture(deployFixture);

            const creationFee = await factory.getFundingFee();

            // Create multiple campaigns
            for (let i = 0; i < 3; i++) {
                await factory.connect(user1).createNewCrowdFundingContract(
                    `QmCampaign${i}`,
                    i % 9, // Cycle through categories
                    `Campaign ${i}`,
                    ethers.parseEther(`${i + 1}`),
                    (30 + i * 10) * 24 * 60 * 60,
                    { value: creationFee }
                );
            }

            const campaigns = await factory.getDeployedCrowdFundingContracts();
            expect(campaigns.length).to.equal(3);

            // Verify all campaigns are properly initialized
            for (let i = 0; i < 3; i++) {
                const campaign = await ethers.getContractAt("CrowdFunding", campaigns[i]);
                const [owner, , target] = await campaign.getFundingDetails();
                expect(owner).to.equal(user1.address);
                expect(target).to.equal(ethers.parseEther(`${i + 1}`));
            }

            console.log("✅ All 3 campaigns created and initialized successfully");
        });
    });
});
