# 🔐 FHE Invoice

<div align="center">

![Zama](https://img.shields.io/badge/Powered%20by-Zama%20fhEVM-7C3AED?style=for-the-badge&logo=ethereum)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**Privacy-Preserving Invoice Management on Blockchain**

[Live Demo](https://zama-invoice.vercel.app) • [Smart Contract](https://sepolia.etherscan.io/address/0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E#code) • [Documentation](#quick-start)

[![Demo Video](https://img.youtube.com/vi/2_SNkv1jUYk/maxresdefault.jpg)](https://youtu.be/2_SNkv1jUYk)

▶️ **[Watch Demo Video](https://youtu.be/2_SNkv1jUYk)**

</div>

---

## 🌐 Live Deployment

| Resource | Link |
|:---------|:-----|
| 🚀 **Live Demo** | [zama-invoice.vercel.app](https://zama-invoice.vercel.app) |
| 📄 **Smart Contract** | [`0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E`](https://sepolia.etherscan.io/address/0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E#code) |
| 🔗 **Network** | Sepolia Testnet |
| ✅ **Verified** | [View on Etherscan](https://sepolia.etherscan.io/address/0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E#code) |

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📝 Invoice Management
- Create invoices with custom amounts
- Set recipients and due dates
- Add detailed descriptions

</td>
<td width="50%">

### 🔄 Lifecycle Actions
- **Pay** - Mark invoices as paid
- **Cancel** - Sender can cancel pending
- **Dispute** - Recipient can raise disputes

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Zama fhEVM
- Built on FHE infrastructure
- Inherits `ZamaEthereumConfig`
- Future-ready for encrypted amounts

</td>
<td width="50%">

### 🎨 Modern UI
- Clean, responsive design
- MetaMask integration
- Real-time status updates

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
├─────────────────────────────────────────────────────────┤
│  React 18  •  TypeScript  •  Vite  •  Tailwind CSS     │
│  ethers.js v6  •  @zama-fhe/relayer-sdk                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   SMART CONTRACTS                       │
├─────────────────────────────────────────────────────────┤
│  Solidity 0.8.24  •  Hardhat  •  @fhevm/solidity       │
│  ZamaEthereumConfig  •  Sepolia Testnet                │
└─────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract

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

    // Core Functions
    function createInvoice(address recipient, uint256 amount, string calldata description, uint256 dueDate) external returns (uint256);
    function payInvoice(uint256 invoiceId) external;
    function cancelInvoice(uint256 invoiceId) external;
    function disputeInvoice(uint256 invoiceId) external;
}
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- MetaMask wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/caidaulanh0/fhe-invoice-dapp.git
cd fhe-invoice-dapp

# Install dependencies
cd contracts && npm install
cd ../frontend && npm install
```

### Configuration

```bash
# contracts/.env
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key

# frontend/.env
VITE_CONTRACT_ADDRESS=0x6Cc3529D0Cc87c9b313f3b0B9250d9dbc0e8316E
```

### Run Locally

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Deploy new contract (optional)
cd contracts
npm run compile
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 📦 Dependencies

| Package | Version | Description |
|:--------|:--------|:------------|
| `@fhevm/solidity` | ^0.9.1 | Zama FHE Solidity library |
| `@fhevm/hardhat-plugin` | 0.3.0-3 | Hardhat FHE integration |
| `@zama-fhe/relayer-sdk` | ^0.3.0-8 | Frontend FHE toolkit |
| `ethers` | ^6.0 | Ethereum library |
| `react` | ^18.0 | UI framework |

---

## 🔧 Project Structure

```
fhe-invoice-dapp/
├── 📁 contracts/
│   ├── 📁 contracts/
│   │   └── 📄 SimpleInvoice.sol    # Main contract
│   ├── 📁 scripts/
│   │   └── 📄 deploy.ts            # Deployment script
│   ├── 📄 hardhat.config.ts
│   └── 📄 package.json
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/          # UI components
│   │   ├── 📁 hooks/               # React hooks
│   │   └── 📄 App.tsx
│   ├── 📄 vite.config.ts
│   └── 📄 package.json
│
└── 📄 README.md
```

---

## 🌍 Network Info

| Property | Value |
|:---------|:------|
| Network | Sepolia Testnet |
| Chain ID | `11155111` |
| RPC URL | `https://ethereum-sepolia-rpc.publicnode.com` |
| Explorer | [sepolia.etherscan.io](https://sepolia.etherscan.io) |

---

## 📚 Resources

- [Zama fhEVM Documentation](https://docs.zama.org/fhevm)
- [Zama Developer Program](https://docs.zama.org/programs/developer-program)
- [fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Zama Discord](https://discord.gg/zama)

---

<div align="center">

**Built with 💜 using [Zama fhEVM](https://www.zama.ai/)**

</div>
