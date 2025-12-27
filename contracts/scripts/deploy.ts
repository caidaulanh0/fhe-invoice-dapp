import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const SimpleInvoice = await ethers.getContractFactory("SimpleInvoice");
  console.log("Deploying SimpleInvoice...");

  const simpleInvoice = await SimpleInvoice.deploy();
  await simpleInvoice.waitForDeployment();

  const address = await simpleInvoice.getAddress();
  console.log("SimpleInvoice deployed to:", address);

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
