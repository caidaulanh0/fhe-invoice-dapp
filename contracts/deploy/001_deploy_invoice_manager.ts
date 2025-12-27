import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying InvoiceManager with account:", deployer);

  const invoiceManager = await deploy("InvoiceManager", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("InvoiceManager deployed to:", invoiceManager.address);

  // Verify on Etherscan if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: invoiceManager.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  }
};

func.tags = ["InvoiceManager"];
export default func;
