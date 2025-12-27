# FHE Invoice - Encrypted Invoice Management dApp

A decentralized invoice management application built on **Zama's fhEVM** (Fully Homomorphic Encryption Virtual Machine) on the Sepolia testnet.

## Live Demo & Deployment

| Resource | Link |
|----------|------|
| **Live Demo** | https://frontend-indol-delta-10.vercel.app |
| **Contract Address** | `0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E` |
| **Etherscan (Verified)** | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E#code) |
| **Network** | Sepolia Testnet (Chain ID: 11155111) |

## Features

- **On-Chain Invoice Management**: Create, pay, cancel, and dispute invoices
- **Zama fhEVM Integration**: Built on Zama's confidential blockchain infrastructure
- **Privacy-Preserving Architecture**: Contract inherits from `ZamaEthereumConfig`
- **Full Invoice Lifecycle**: Pending → Paid / Cancelled / Disputed

## Tech Stack

### Smart Contracts
- Solidity 0.8.24
- Hardhat 2.26+
- **@fhevm/solidity ^0.9.1** (Zama FHE library)
- **@fhevm/hardhat-plugin 0.3.0-3** (Hardhat integration)
- **ZamaEthereumConfig** for network configuration

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- **@zama-fhe/relayer-sdk ^0.3.0-8**
- ethers.js v6

## Project Structure

```
fhe-invoice-dapp/
├── contracts/
│   ├── contracts/
│   │   └── SimpleInvoice.sol         # Main contract (deployed)
│   ├── scripts/
│   │   └── deploy.ts
│   ├── hardhat.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/               # React UI components
│   │   ├── hooks/                    # Custom React hooks
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Smart Contract

The `SimpleInvoice` contract inherits from `ZamaEthereumConfig`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";

contract SimpleInvoice is ZamaEthereumConfig {
    enum InvoiceStatus { Pending, Paid, Cancelled, Disputed }

    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;
        string description;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 dueDate;
    }

    function createInvoice(
        address recipient,
        uint256 amount,
        string calldata description,
        uint256 dueDate
    ) external returns (uint256);

    function payInvoice(uint256 invoiceId) external;
    function cancelInvoice(uint256 invoiceId) external;
    function disputeInvoice(uint256 invoiceId) external;
}
```

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7
- MetaMask with Sepolia ETH

### 1. Clone and Install

```bash
git clone https://github.com/caidaulanh0/fhe-invoice-dapp.git
cd fhe-invoice-dapp

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Contracts (.env)
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend (.env)
VITE_CONTRACT_ADDRESS=0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E
```

### 3. Compile & Deploy

```bash
cd contracts
npm run compile
npx hardhat run scripts/deploy.ts --network sepolia
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

## Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://ethereum-sepolia-rpc.publicnode.com
- **Explorer**: https://sepolia.etherscan.io

Get Sepolia ETH from faucets:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @fhevm/solidity | ^0.9.1 | FHE Solidity library |
| @fhevm/hardhat-plugin | 0.3.0-3 | Hardhat integration |
| @zama-fhe/relayer-sdk | ^0.3.0-8 | Frontend FHE SDK |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Sepolia    │────▶│  SimpleInvoice  │
│  (React)    │     │   Network    │     │   Contract      │
└─────────────┘     └──────────────┘     └─────────────────┘
      │                                          │
      │         ┌──────────────────┐             │
      └────────▶│  Zama fhEVM      │◀────────────┘
                │  (FHE Support)   │
                └──────────────────┘
```

## Resources

- [Zama fhEVM Documentation](https://docs.zama.org/fhevm)
- [Zama Developer Program](https://docs.zama.org/programs/developer-program)
- [fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)

## License

MIT
