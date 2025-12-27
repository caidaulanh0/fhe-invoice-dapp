// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title InvoiceManager
 * @notice Manages encrypted invoices using Zama's fhEVM
 * @dev Uses FHE to encrypt invoice amounts, ensuring only authorized parties can view them
 */
contract InvoiceManager is ZamaEthereumConfig {

    enum InvoiceStatus { Pending, Paid, Cancelled }

    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        euint64 encryptedAmount;
        string description;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    uint256 private _invoiceIdCounter;
    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _sentInvoices;
    mapping(address => uint256[]) private _receivedInvoices;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed sender,
        address indexed recipient,
        string description,
        uint256 timestamp
    );

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 timestamp
    );

    event InvoiceCancelled(
        uint256 indexed invoiceId,
        address indexed canceller,
        uint256 timestamp
    );

    // Errors
    error InvoiceNotFound(uint256 invoiceId);
    error NotAuthorized(address caller, uint256 invoiceId);
    error InvalidRecipient(address recipient);
    error InvoiceNotPending(uint256 invoiceId);
    error OnlySenderCanCancel(uint256 invoiceId);
    error OnlyRecipientCanPay(uint256 invoiceId);

    constructor() ZamaEthereumConfig() {
        _invoiceIdCounter = 0;
    }

    /**
     * @notice Create a new encrypted invoice
     * @param _recipient The address that will receive the invoice
     * @param _encryptedAmount The encrypted amount (euint64)
     * @param _inputProof The proof for the encrypted input
     * @param _description A description for the invoice
     * @return invoiceId The ID of the created invoice
     */
    function createInvoice(
        address _recipient,
        externalEuint64 _encryptedAmount,
        bytes calldata _inputProof,
        string calldata _description
    ) external returns (uint256 invoiceId) {
        if (_recipient == address(0) || _recipient == msg.sender) {
            revert InvalidRecipient(_recipient);
        }

        invoiceId = _invoiceIdCounter++;

        // Convert external encrypted input to internal encrypted value
        euint64 amount = FHE.fromExternal(_encryptedAmount, _inputProof);

        // Grant access to sender, recipient, and contract
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, _recipient);

        _invoices[invoiceId] = Invoice({
            id: invoiceId,
            sender: msg.sender,
            recipient: _recipient,
            encryptedAmount: amount,
            description: _description,
            status: InvoiceStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _sentInvoices[msg.sender].push(invoiceId);
        _receivedInvoices[_recipient].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, _recipient, _description, block.timestamp);

        return invoiceId;
    }

    /**
     * @notice Pay an invoice (only recipient can pay)
     * @param _invoiceId The ID of the invoice to pay
     */
    function payInvoice(uint256 _invoiceId) external {
        Invoice storage invoice = _invoices[_invoiceId];

        if (invoice.sender == address(0)) {
            revert InvoiceNotFound(_invoiceId);
        }

        if (invoice.status != InvoiceStatus.Pending) {
            revert InvoiceNotPending(_invoiceId);
        }

        if (msg.sender != invoice.recipient) {
            revert OnlyRecipientCanPay(_invoiceId);
        }

        invoice.status = InvoiceStatus.Paid;
        invoice.updatedAt = block.timestamp;

        emit InvoicePaid(_invoiceId, msg.sender, block.timestamp);
    }

    /**
     * @notice Cancel an invoice (only sender can cancel)
     * @param _invoiceId The ID of the invoice to cancel
     */
    function cancelInvoice(uint256 _invoiceId) external {
        Invoice storage invoice = _invoices[_invoiceId];

        if (invoice.sender == address(0)) {
            revert InvoiceNotFound(_invoiceId);
        }

        if (invoice.status != InvoiceStatus.Pending) {
            revert InvoiceNotPending(_invoiceId);
        }

        if (msg.sender != invoice.sender) {
            revert OnlySenderCanCancel(_invoiceId);
        }

        invoice.status = InvoiceStatus.Cancelled;
        invoice.updatedAt = block.timestamp;

        emit InvoiceCancelled(_invoiceId, msg.sender, block.timestamp);
    }

    /**
     * @notice Get invoice details (public info only)
     * @param _invoiceId The invoice ID
     * @return id The invoice ID
     * @return sender The invoice sender
     * @return recipient The invoice recipient
     * @return description The invoice description
     * @return status The invoice status
     * @return createdAt Creation timestamp
     * @return updatedAt Last update timestamp
     */
    function getInvoice(uint256 _invoiceId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        string memory description,
        InvoiceStatus status,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Invoice storage invoice = _invoices[_invoiceId];

        if (invoice.sender == address(0)) {
            revert InvoiceNotFound(_invoiceId);
        }

        return (
            invoice.id,
            invoice.sender,
            invoice.recipient,
            invoice.description,
            invoice.status,
            invoice.createdAt,
            invoice.updatedAt
        );
    }

    /**
     * @notice Get the encrypted amount of an invoice (only sender or recipient)
     * @param _invoiceId The invoice ID
     * @return The encrypted amount
     */
    function getEncryptedAmount(uint256 _invoiceId) external view returns (euint64) {
        Invoice storage invoice = _invoices[_invoiceId];

        if (invoice.sender == address(0)) {
            revert InvoiceNotFound(_invoiceId);
        }

        if (msg.sender != invoice.sender && msg.sender != invoice.recipient) {
            revert NotAuthorized(msg.sender, _invoiceId);
        }

        return invoice.encryptedAmount;
    }

    /**
     * @notice Get all invoice IDs sent by an address
     * @param _sender The sender address
     * @return Array of invoice IDs
     */
    function getSentInvoices(address _sender) external view returns (uint256[] memory) {
        return _sentInvoices[_sender];
    }

    /**
     * @notice Get all invoice IDs received by an address
     * @param _recipient The recipient address
     * @return Array of invoice IDs
     */
    function getReceivedInvoices(address _recipient) external view returns (uint256[] memory) {
        return _receivedInvoices[_recipient];
    }

    /**
     * @notice Get the total number of invoices created
     * @return The invoice count
     */
    function getInvoiceCount() external view returns (uint256) {
        return _invoiceIdCounter;
    }
}
