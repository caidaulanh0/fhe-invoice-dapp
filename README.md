# FHE Invoice - Encrypted Invoice Management dApp

A decentralized invoice management application using **Fully Homomorphic Encryption (FHE)** powered by [Zama's fhEVM](https://docs.zama.org/fhevm). Invoice amounts are encrypted on-chain, ensuring only authorized parties (sender and recipient) can view the actual values.

## Features

- **End-to-End Encrypted Amounts**: Invoice amounts are encrypted using FHE before being stored on-chain
- **Privacy-Preserving Access Control**: Only invoice sender and recipient can decrypt amounts
- **On-Chain Invoice Tracking**: Full invoice lifecycle management (create, pay, cancel)
- **Zama fhEVM Integration**: Built on Zama's confidential blockchain infrastructure

## Tech Stack

### Smart Contracts
- Solidity 0.8.27
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
│   │   └── InvoiceManager.sol      # Main FHE-enabled contract
│   ├── deploy/
│   │   └── 001_deploy_invoice_manager.ts
│   ├── test/
│   │   └── InvoiceManager.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI components
│   │   ├── hooks/                  # Custom React hooks (wallet, fhevm, contract)
│   │   ├── types/                  # TypeScript definitions
│   │   └── utils/                  # Helper utilities
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7
- MetaMask or compatible Web3 wallet

### 1. Clone and Install

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Contracts
cd contracts
cp .env.example .env
# Edit .env with your MNEMONIC

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with VITE_CONTRACT_ADDRESS after deployment
```

### 3. Compile Contracts

```bash
cd contracts
npm run compile
```

### 4. Deploy to Zama Network

```bash
npm run deploy:zama
```

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

## Network Configuration

### Zama Ethereum Network
- **Chain ID**: 8009
- **RPC URL**: https://ethnode1.zama.fhe.io
- **Explorer**: https://explorer.zama.ai

Add to MetaMask:
1. Open MetaMask
2. Add Network manually
3. Enter the configuration above

## Smart Contract

The `InvoiceManager` contract inherits from `ZamaEthereumConfig` which automatically configures FHE coprocessor addresses:

```solidity
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract InvoiceManager is ZamaEthereumConfig {
    // Encrypted invoice amounts stored as euint64
    mapping(uint256 => euint64) encryptedAmounts;

    function createInvoice(
        address recipient,
        externalEuint64 _encryptedAmount,
        bytes calldata _inputProof,
        string calldata description
    ) external returns (uint256);
}
```

## Key Dependencies (Correct Versions)

| Package | Version | Purpose |
|---------|---------|---------|
| @fhevm/solidity | ^0.9.1 | FHE Solidity library |
| @fhevm/hardhat-plugin | 0.3.0-3 | Hardhat integration |
| @zama-fhe/relayer-sdk | ^0.3.0-8 | Frontend encryption/decryption |

## Development

### Run Tests
```bash
cd contracts
npm test
```

### Generate Coverage
```bash
npm run coverage
```

### Lint Contracts
```bash
npm run lint
```

## Architecture

1. **Invoice Creation**:
   - User enters amount in frontend
   - Amount encrypted client-side using relayer-sdk
   - Encrypted amount + proof sent to contract
   - Contract stores encrypted value, grants access to sender & recipient

2. **Invoice Viewing**:
   - Users query contract for invoice metadata (public)
   - To see amount, user requests decryption through relayer
   - Only authorized parties receive decrypted value

3. **Invoice Actions**:
   - **Pay**: Recipient marks invoice as paid
   - **Cancel**: Sender cancels pending invoice

## Resources

- [Zama fhEVM Documentation](https://docs.zama.org/fhevm)
- [Zama Developer Program](https://docs.zama.org/programs/developer-program)
- [fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Zama Discord Community](https://discord.gg/zama)

## License

MIT
