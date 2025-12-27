// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title SimpleInvoice
 * @notice Simple invoice system - amounts stored as plain uint for demo
 * @dev FHE is used for encrypted status/flags, not amounts (for simplicity)
 */
contract SimpleInvoice is ZamaEthereumConfig {

    enum InvoiceStatus { Pending, Paid, Cancelled, Disputed }

    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;  // Plain amount (for demo simplicity)
        string description;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 dueDate;
    }

    // Storage
    uint256 private _invoiceCounter;
    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _sentInvoices;
    mapping(address => uint256[]) private _receivedInvoices;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string description,
        uint256 dueDate
    );
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer);
    event InvoiceCancelled(uint256 indexed invoiceId);
    event InvoiceDisputed(uint256 indexed invoiceId);

    // Errors
    error InvalidRecipient();
    error InvoiceNotFound();
    error NotAuthorized();
    error InvalidStatus();
    error InvalidAmount();

    constructor() {
        _invoiceCounter = 0;
    }

    /**
     * @notice Create a new invoice
     */
    function createInvoice(
        address recipient,
        uint256 amount,
        string calldata description,
        uint256 dueDate
    ) external returns (uint256) {
        if (recipient == address(0) || recipient == msg.sender) {
            revert InvalidRecipient();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        uint256 invoiceId = _invoiceCounter++;

        _invoices[invoiceId] = Invoice({
            id: invoiceId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            description: description,
            status: InvoiceStatus.Pending,
            createdAt: block.timestamp,
            dueDate: dueDate == 0 ? block.timestamp + 30 days : dueDate
        });

        _sentInvoices[msg.sender].push(invoiceId);
        _receivedInvoices[recipient].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, recipient, amount, description, dueDate);

        return invoiceId;
    }

    /**
     * @notice Pay an invoice (mark as paid)
     */
    function payInvoice(uint256 invoiceId) external {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.sender == address(0)) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvalidStatus();
        if (msg.sender != invoice.recipient) revert NotAuthorized();

        invoice.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender);
    }

    /**
     * @notice Cancel an invoice (sender only)
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
     * @notice Dispute an invoice (recipient only)
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
     * @notice Get invoice details
     */
    function getInvoice(uint256 invoiceId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        uint256 amount,
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
            invoice.amount,
            invoice.description,
            invoice.status,
            invoice.createdAt,
            invoice.dueDate
        );
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
