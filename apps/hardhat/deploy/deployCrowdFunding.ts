import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("CrowdFunding", {
		from: deployer,
		log: true,
	})
}

export default func

func.tags = ["funding"]

//0x7f8A17c30bc4Fd9AEd732b3264ababee9a4e100E => crowd funding contract address