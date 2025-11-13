# Shield: Decentralized Trustless File and Message Sharing System

Shield is a decentralized application for sharing confidential files and messages with unparalleled security and privacy. It leverages blockchain technology and decentralized storage to ensure that your private data is only ever seen by the intended recipient.

Unlike traditional platforms that rely on a central server, Shield is **trustless**. Access rules are enforced by an on-chain smart contract, meaning not even the Shield platform itself can access or censor your data. Links can be configured to expire or self-destruct after a certain number of failed verification attempts, giving you complete control.

## Key Features

- **Trustless On-Chain Security:** Access rules are immutably enforced by a Base Mainnet smart contract.
- **End-to-End Encryption:** Files are AES-encrypted on the sender's device before ever being uploaded.
- **Decentralized Storage (IPFS via Pinata):** Encrypted files are stored on IPFS, ensuring data permanence and censorship resistance.
- **Ephemeral & Revocable Access:** Set an expiration time and a maximum number of verification attempts for each secure link.

---

## How It Works

Shield's security model is designed to remove the need for a trusted intermediary for core access control. Here's a step-by-step look at the lifecycle of a secure link:

**1. Creating a Secure Link (Sender)**
   a. **Upload Content:** The sender selects a file or writes a message on the Shield frontend.
   b. **Encrypt & Pin Data:** A new, random AES-256 secret key is generated in the browser. This key is used to encrypt the files/texts. The encrypted data is then sent to a backend API (`/api/prepareContent`) which securely uploads it to IPFS via Pinata, returning a unique content identifier (CID) and the secret key.
   c. **Create On-Chain Policy (Client-Side Signed):** The frontend prompts the user to sign a transaction with their wallet. This transaction calls the `createPolicy` function on the Shield smart contract, creating an `AccessPolicy` on the blockchain. This policy contains the access rules (e.g., expiry time, max attempts) but **not** the secret key or CID. This policy is linked to a unique, randomly generated `policyId`.
   d. **Store Metadata:** After the on-chain transaction is confirmed, the frontend calls another backend API (`/api/storeMetadata`) to securely store the secret key and IPFS CID in a PostgreSQL database, linked to the on-chain `policyId`.
   e. **Share Link:** The sender receives a unique Shield link containing the `policyId` (e.g., `https://shield.app/r/<policyId>`) to share with the recipient.

**2. Accessing a Secure Link (Recipient)**
   a. **Open Link:** The recipient opens the Shield link in their browser.
   b. **Wallet Verification (SIWE):** The frontend prompts the recipient to connect their wallet and sign a message (Sign-In with Ethereum - SIWE). This signature is sent to the backend (`/api/verify-siwe`).
   c. **Verify Identity & Policy:** The backend verifies the SIWE signature and then checks the on-chain `isPolicyValid` function to ensure the policy has not expired and has not exceeded its maximum access attempts. It also verifies that the connected wallet matches the policy's recipient address.
   d. **Log Attempt & Retrieve Secret Key:** If all checks pass, the backend logs a verification attempt with the smart contract (signed by the server's wallet) and then releases the secret decryption key to the recipient's frontend.
   e. **Decrypt and View:** The frontend downloads the encrypted content from IPFS (via Cloudflare's gateway) and uses the secret key to decrypt it locally in the browser. The content is displayed to the recipient. The content is displayed to the recipient.

---

## Core Concepts

- **Smart Contract (The Unbiased Judge):** The Solidity smart contract on Base Mainnet acts as the ultimate arbiter of access. It's a simple, transparent, and immutable set of rules that cannot be tampered with. It only cares about *if* someone should have access, not *what* they are accessing.

- **Decentralized Storage (IPFS via Pinata):** We use IPFS for content-addressed storage, with Pinata as our pinning service. This ensures your encrypted data is decentralized, censorship-resistant, and remains available.

- **Client-Side Signing (User Control):** All critical on-chain actions (like creating a policy) are signed directly by the user's wallet, ensuring true decentralization and user ownership of transactions.

## Tech Stack

- **Smart Contract:** Solidity, Hardhat
- **Frontend (with integrated API routes):** Next.js, React, TypeScript, Tailwind CSS
- **Blockchain Interaction:** `wagmi` (for frontend wallet connection), `viem` (for frontend contract calls and backend API contract interactions).
- **Decentralized Storage:** IPFS (Pinata for pinning, Cloudflare for gateway access)
- **Database:** PostgreSQL (Neon for hosted database)

---

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js:** [Download here](https://nodejs.org/)
2.  **Git:** [Download here](https://git-scm.com/downloads)
3.  **MetaMask:** A browser extension wallet for interacting with the blockchain. [Download here](https://metamask.io/)
4.  **Pinata Account:** For IPFS pinning. [Sign up here](https://www.pinata.cloud/)
5.  **Neon Account:** For your PostgreSQL database. [Sign up here](https://neon.tech/)
## Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone <https://github.com/Babs0022/SHIELD.git>
cd SHIELD
```

### 2. Install Dependencies

Install dependencies for the root, contracts, and frontend.

```bash
npm install
cd contracts
npm install
cd ../frontend
npm install
cd .. # Return to root
```

### 3. Configure Environment Variables

You need to create `.env` files for the contracts and the frontend.

- **Smart Contract (`/contracts/.env`):**
  Create this file and add the following, filling in your details. This wallet will be used to deploy the contract.
  ```
  BASE_MAINNET_RPC_URL=https://your-base-mainnet-rpc-url
  PRIVATE_KEY=your-wallet-private-key-for-deployment
  ETHERSCAN_API_KEY=your-optional-basescan-api-key
  ```

- **Frontend (`/frontend/.env.local`):**
  Create this file and add the following. This contains variables for both the frontend and its integrated API routes.
  ```
  POSTGRES_URL="your_neon_postgres_connection_string"
  BASE_MAINNET_RPC_URL="https://your-base-mainnet-rpc-url"
  SERVER_WALLET_PRIVATE_KEY="a_separate_private_key_for_server_logging_attempts"
  NEXT_PUBLIC_CONTRACT_ADDRESS="the-address-of-your-deployed-contract"
  PINATA_JWT="your_pinata_jwt"
  FRONTEND_URL="http://localhost:3000"
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
  ```
  **Note:** The `SERVER_WALLET_PRIVATE_KEY` is used by the backend API routes (e.g., `/api/verify-siwe`) to sign the `logAttempt` transaction on behalf of the recipient. This wallet needs to be funded with a small amount of ETH for gas fees.

### 4. Database Setup (Neon)

Create the `policies` table in your Neon PostgreSQL database. You can do this via the Neon Console's SQL Editor.

```sql
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(66) UNIQUE NOT NULL,
    creator_id VARCHAR(42) NOT NULL,
    resource_cid VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(42) NOT NULL,
    secret_key TEXT NOT NULL,
    mime_type VARCHAR(255),
    is_text BOOLEAN NOT NULL,
    expiry BIGINT NOT NULL,
    max_attempts INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Deploy the Smart Contract

If you need to deploy a new version of the contract (or if you haven't deployed it yet):

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network baseMainnet
```

After deployment, copy the new contract address into the `NEXT_PUBLIC_CONTRACT_ADDRESS` variable in your `/frontend/.env.local` file.

---

## Running the Application

### 1. Run the Application

Open a terminal in the `frontend` directory.

```bash
cd frontend
npm run dev
```

The application will start on `http://localhost:3000`.

### 2. Use the Application

Open your browser to `http://localhost:3000` to begin sharing files and messages securely.

## Project Structure

The project is a monorepo containing:

- **/contracts:** Contains the Solidity smart contract and Hardhat deployment scripts.
- **/frontend:** The Next.js application, including the user interface and integrated API routes (which handle IPFS interaction, database storage, and some blockchain communication).
