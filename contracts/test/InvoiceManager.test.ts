import { expect } from "chai";
import { ethers } from "hardhat";
import { InvoiceManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("InvoiceManager", function () {
  let invoiceManager: InvoiceManager;
  let owner: SignerWithAddress;
  let sender: SignerWithAddress;
  let recipient: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, sender, recipient, other] = await ethers.getSigners();

    const InvoiceManagerFactory = await ethers.getContractFactory("InvoiceManager");
    invoiceManager = await InvoiceManagerFactory.deploy();
    await invoiceManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await invoiceManager.getAddress()).to.be.properAddress;
    });

    it("Should start with zero invoices", async function () {
      expect(await invoiceManager.getInvoiceCount()).to.equal(0);
    });
  });

  describe("Invoice Queries", function () {
    it("Should return empty arrays for new addresses", async function () {
      expect(await invoiceManager.getSentInvoices(sender.address)).to.deep.equal([]);
      expect(await invoiceManager.getReceivedInvoices(recipient.address)).to.deep.equal([]);
    });

    it("Should revert when getting non-existent invoice", async function () {
      await expect(invoiceManager.getInvoice(999))
        .to.be.revertedWithCustomError(invoiceManager, "InvoiceNotFound")
        .withArgs(999);
    });
  });

  // Note: Full FHE tests require running on fhEVM network
  // These are basic structural tests that can run on local Hardhat
});
