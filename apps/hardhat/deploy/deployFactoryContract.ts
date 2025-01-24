import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("CrowdFundingFactory", {
		from: deployer,
		args: ["0x7f8A17c30bc4Fd9AEd732b3264ababee9a4e100E", "0x4da61e7341C0a0A532a1C4F49BE10Fb21a165927"],
		log: true,
	})
    //implementation contract address and token contract address
}

export default func

func.tags = ["factory"]

//0x0Ac6Bb3095c62706D8EDd0B9185bCCFB16cDE117 => factory contract address