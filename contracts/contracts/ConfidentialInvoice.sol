// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title ConfidentialInvoice
 * @notice Invoice system with fully encrypted amounts using Zama FHE on Sepolia
 * @dev All invoice amounts are encrypted - only sender/recipient can decrypt
 */
contract ConfidentialInvoice is ZamaEthereumConfig {

    // Invoice structure with encrypted amount
    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        euint64 encryptedAmount;  // FHE encrypted amount
        string description;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 dueDate;
    }

    enum InvoiceStatus {
        Pending,    // Waiting for payment
        Paid,       // Fully paid
        Cancelled,  // Cancelled by sender
        Disputed    // Under dispute
    }

    // Encrypted balances for each user (like confidential ERC20)
    mapping(address => euint64) private _encryptedBalances;

    // Invoice storage
    uint256 private _invoiceCounter;
    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _sentInvoices;
    mapping(address => uint256[]) private _receivedInvoices;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed sender,
        address indexed recipient,
        string description,
        uint256 dueDate
    );

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer
    );

    event InvoiceCancelled(uint256 indexed invoiceId);
    event InvoiceDisputed(uint256 indexed invoiceId);
    event BalanceDeposited(address indexed user);
    event BalanceWithdrawn(address indexed user);

    // Errors
    error InvalidRecipient();
    error InvoiceNotFound();
    error NotAuthorized();
    error InvalidStatus();
    error InsufficientBalance();

    constructor() {
        _invoiceCounter = 0;
    }

    /**
     * @notice Deposit encrypted balance (simulated - in real app would be token transfer)
     * @param encryptedAmount The encrypted amount to deposit
     * @param inputProof Proof for the encrypted input
     */
    function depositBalance(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        if (!FHE.isInitialized(_encryptedBalances[msg.sender])) {
            _encryptedBalances[msg.sender] = amount;
        } else {
            _encryptedBalances[msg.sender] = FHE.add(_encryptedBalances[msg.sender], amount);
        }

        // Allow user to see their own balance
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);

        emit BalanceDeposited(msg.sender);
    }

    /**
     * @notice Create a new invoice with encrypted amount
     * @param recipient Invoice recipient
     * @param encryptedAmount Encrypted invoice amount
     * @param inputProof Proof for encrypted input
     * @param description Invoice description
     * @param dueDate Payment due date
     */
    function createInvoice(
        address recipient,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        string calldata description,
        uint256 dueDate
    ) external returns (uint256) {
        if (recipient == address(0) || recipient == msg.sender) {
            revert InvalidRecipient();
        }

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        uint256 invoiceId = _invoiceCounter++;

        _invoices[invoiceId] = Invoice({
            id: invoiceId,
            sender: msg.sender,
            recipient: recipient,
            encryptedAmount: amount,
            description: description,
            status: InvoiceStatus.Pending,
            createdAt: block.timestamp,
            dueDate: dueDate
        });

        // Grant access to encrypted amount
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, recipient);

        _sentInvoices[msg.sender].push(invoiceId);
        _receivedInvoices[recipient].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, recipient, description, dueDate);

        return invoiceId;
    }

    /**
     * @notice Pay an invoice using encrypted balance
     * @param invoiceId The invoice to pay
     */
    function payInvoice(uint256 invoiceId) external {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.sender == address(0)) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvalidStatus();
        if (msg.sender != invoice.recipient) revert NotAuthorized();

        // Check if payer has sufficient encrypted balance
        euint64 payerBalance = _encryptedBalances[msg.sender];
        if (!FHE.isInitialized(payerBalance)) revert InsufficientBalance();

        // Encrypted comparison: balance >= invoiceAmount
        ebool hasEnough = FHE.ge(payerBalance, invoice.encryptedAmount);

        // Conditional transfer (FHE select)
        euint64 amountToTransfer = FHE.select(
            hasEnough,
            invoice.encryptedAmount,
            FHE.asEuint64(0)
        );

        // Deduct from payer
        _encryptedBalances[msg.sender] = FHE.sub(payerBalance, amountToTransfer);

        // Add to invoice sender
        if (!FHE.isInitialized(_encryptedBalances[invoice.sender])) {
            _encryptedBalances[invoice.sender] = amountToTransfer;
        } else {
            _encryptedBalances[invoice.sender] = FHE.add(
                _encryptedBalances[invoice.sender],
                amountToTransfer
            );
        }

        // Update permissions
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        FHE.allowThis(_encryptedBalances[invoice.sender]);
        FHE.allow(_encryptedBalances[invoice.sender], invoice.sender);

        invoice.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender);
    }

    /**
     * @notice Cancel an invoice (only sender)
     */
    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.sender == address(0)) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvalidStatus();
        if (msg.sender != invoice.sender) revert NotAuthorized();

        invoice.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId);
    }

    /**
     * @notice Dispute an invoice (only recipient)
     */
    function disputeInvoice(uint256 invoiceId) external {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.sender == address(0)) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvalidStatus();
        if (msg.sender != invoice.recipient) revert NotAuthorized();

        invoice.status = InvoiceStatus.Disputed;
        emit InvoiceDisputed(invoiceId);
    }

    /**
     * @notice Get invoice public details
     */
    function getInvoice(uint256 invoiceId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        string memory description,
        InvoiceStatus status,
        uint256 createdAt,
        uint256 dueDate
    ) {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.sender == address(0)) revert InvoiceNotFound();

        return (
            invoice.id,
            invoice.sender,
            invoice.recipient,
            invoice.description,
            invoice.status,
            invoice.createdAt,
            invoice.dueDate
        );
    }

    /**
     * @notice Get encrypted balance (only owner can decrypt)
     */
    function getEncryptedBalance(address user) external view returns (euint64) {
        if (msg.sender != user) revert NotAuthorized();
        return _encryptedBalances[user];
    }

    /**
     * @notice Get encrypted invoice amount (only sender/recipient)
     */
    function getEncryptedAmount(uint256 invoiceId) external view returns (euint64) {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.sender == address(0)) revert InvoiceNotFound();
        if (msg.sender != invoice.sender && msg.sender != invoice.recipient) {
            revert NotAuthorized();
        }
        return invoice.encryptedAmount;
    }

    function getSentInvoices(address user) external view returns (uint256[] memory) {
        return _sentInvoices[user];
    }

    function getReceivedInvoices(address user) external view returns (uint256[] memory) {
        return _receivedInvoices[user];
    }

    function getInvoiceCount() external view returns (uint256) {
        return _invoiceCounter;
    }
}
