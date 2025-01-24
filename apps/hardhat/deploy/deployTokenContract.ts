import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("CrowdFundingToken", {
		from: deployer,
		args: [],
		log: true,
	})
}

export default func

func.tags = ["token"]

//after deploying token contract, set factory address and transfer ownership to factory contract
// 0x4da61e7341C0a0A532a1C4F49BE10Fb21a165927 => token contract address

//https://testnet.bscscan.com/address/0x4da61e7341C0a0A532a1C4F49BE10Fb21a165927#code