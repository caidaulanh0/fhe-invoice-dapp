import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const InvoiceManager = await ethers.getContractFactory("InvoiceManager");
  console.log("Deploying InvoiceManager...");

  const invoiceManager = await InvoiceManager.deploy();
  await invoiceManager.waitForDeployment();

  const address = await invoiceManager.getAddress();
  console.log("InvoiceManager deployed to:", address);

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
