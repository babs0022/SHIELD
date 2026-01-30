# Shield: dApp for sharing confidential contents

Shield is a decentralized application that allows you to share confidential contents like files and messages with anyone who own a web3 wallet. Shield ensures the contents you shared are only revealed to your intended recipient.

## How it Works

Shield provides a secure way to share files and text with end-to-end encryption, using a web3 wallet for authentication and access control.

1.  **Client-Side Encryption**: When a user uploads a file or writes a message, the content is encrypted directly in their browser using the Web Crypto API (AES-GCM 256). A unique, single-use secret key is generated for this encryption.
2.  **IPFS Upload**: The encrypted content is uploaded to the InterPlanetary File System (IPFS) via Pinata, ensuring decentralized and content-addressed storage.
3.  **On-Chain Policy Creation**: The user defines access conditions, including the recipient's wallet address, an expiration time, and a maximum number of access attempts. They then sign a transaction to store these conditions as an `AccessPolicy` in the Shield smart contract on the Base blockchain.
4.  **Secure Link Generation**: A unique link is generated containing the IPFS CID and the secret key (in the URL fragment, like `#secretKey`). This link is never stored on the server and is only shown to the creator once.
5.  **Recipient Verification**: When the recipient opens the link, they must prove ownership of their wallet by signing a message (SIWE). The backend verifies this signature and checks the validity of the on-chain `AccessPolicy`.
6.  **User-Side Transaction**: After successful verification, the recipient signs a transaction to call the `logAttempt` function on the smart contract, creating an on-chain record of the access.
7.  **Client-Side Decryption**: Once the transaction is confirmed, the frontend uses the secret key from the URL fragment to download the encrypted content from IPFS and decrypt it in the browser.

This process ensures that the content is only ever decrypted on the recipient's device and that the backend server never has access to the secret key.

## Trust Model

Shield's security is centered around a **trustless, end-to-end encrypted** model.

*   **Confidentiality is Trustless**: Your content is always encrypted and decrypted on the client-side. The secret key is never sent to the server or stored anywhere other than in the secure link itself. This means that only someone with the link can decrypt the content, and the backend operator has no ability to view it.
*   **On-Chain Access Control**: The rules for who can access your content and under what conditions are enforced by the Shield smart contract on the blockchain, providing transparency and decentralized enforcement.
*   **Non-Sensitive Metadata Storage**: For performance and user experience, a centralized backend is used to store a mapping between a policy ID and its corresponding IPFS CID. This metadata is non-sensitive and does not compromise the confidentiality of the encrypted content.

This hybrid architecture allows Shield to provide a user-friendly experience without compromising on the core promise of trustless, end-to-end encrypted file sharing.