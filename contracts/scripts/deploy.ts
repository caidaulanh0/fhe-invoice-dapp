import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const ConfidentialInvoice = await ethers.getContractFactory("ConfidentialInvoice");
  console.log("Deploying ConfidentialInvoice...");

  const confidentialInvoice = await ConfidentialInvoice.deploy();
  await confidentialInvoice.waitForDeployment();

  const address = await confidentialInvoice.getAddress();
  console.log("ConfidentialInvoice deployed to:", address);

  return address;
}

main()
  .then((address) => {
    console.log("\n=================================");
    console.log("CONTRACT ADDRESS:", address);
    console.log("=================================\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
