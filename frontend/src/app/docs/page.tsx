import React from 'react';
import styles from './Docs.module.css';
import Link from 'next/link';

const DocsPage = () => {
  return (
    <>
      <div className={styles.docsContainer}>
        <header className={styles.header}>
          <h1>Shield Documentation</h1>
          <p>Your guide to secure, decentralized sharing.</p>
        </header>

        <main className={styles.mainContent}>
          <section id="about" className={styles.section}>
            <h2>About Shield</h2>
            <p>
              Shield is a decentralized application that allows you to share files and messages with end-to-end encryption. By leveraging blockchain technology, Shield ensures that only the intended recipient, authenticated via their wallet, can access the content. It's a trustless, secure, and private way to share sensitive information.
            </p>
          </section>

          <section id="features" className={styles.section}>
            <h2>Features</h2>
            <ul>
              <li><strong>End-to-End Encryption:</strong> All content is encrypted in the browser before being stored, ensuring no one but the recipient can view it.</li>
              <li><strong>Wallet-Based Access Control:</strong> Content is token-gated, meaning only the specific wallet address designated by the sender can decrypt and access it.</li>
              <li><strong>Decentralized Storage:</strong> Metadata is stored on-chain, providing a trustless and censorship-resistant system.</li>
              <li><strong>Farcaster Mini-App:</strong> Seamlessly share and open secure links directly within the Farcaster ecosystem.</li>
              <li><strong>User-Friendly Interface:</strong> A clean and intuitive UI for creating and accessing secure links without a steep learning curve.</li>
            </ul>
          </section>

          <section id="tech-stack" className={styles.section}>
            <h2>Technology Stack</h2>
            <p>Shield is built with a modern, decentralized technology stack:</p>
            <ul>
              <li><strong>Frontend:</strong> Next.js (React)</li>
              <li><strong>Styling:</strong> CSS Modules & Tailwind CSS</li>
              <li><strong>Blockchain Integration:</strong> Wagmi, Viem, RainbowKit</li>
              <li><strong>Smart Contracts:</strong> Solidity (for on-chain logic)</li>
              <li><strong>Database:</strong> Vercel Postgres (for off-chain metadata)</li>
              <li><strong>Deployment:</strong> Vercel</li>
            </ul>
          </section>

          <section id="getting-started" className={styles.section}>
            <h2>Getting Started</h2>
            <p>Using Shield is simple. Here’s how to create your first secure link:</p>
            <ol>
              <li>Connect your wallet to the Shield application.</li>
              <li>Navigate to the "Create Link" page.</li>
              <li>Enter the content you want to share (a message or a file link).</li>
              <li>Specify the wallet address of the recipient.</li>
              <li>Click "Create Secure Link" and sign the transaction with your wallet.</li>
              <li>Your secure link is now ready to be shared!</li>
            </ol>
          </section>

          <section id="how-to" className={styles.section}>
            <h2>How-To Guides</h2>
            <h3>How to Access Content</h3>
            <p>
              If you've received a Shield link, simply open it in your browser. You will be prompted to connect your wallet. If your wallet address matches the one specified by the sender, the content will be decrypted and displayed for you.
            </p>
            <h3>Supported Networks</h3>
            <p>
              Shield is built for the Base ecosystem and currently supports the Base mainnet. Please ensure your wallet is connected to the correct network.
            </p>
          </section>

          <section id="roadmap" className={styles.section}>
            <h2>Roadmap</h2>
            <p>We are continuously working to improve Shield. Here are some features we're planning for the future:</p>
            <ul>
              <li>Support for sharing files directly (not just links).</li>
              <li>Multi-recipient and time-locked content.</li>
              <li>Gasless transactions for a smoother user experience.</li>
              <li>Expanded network support beyond Base.</li>
            </ul>
          </section>

          <section id="faq" className={styles.section}>
            <h2>Frequently Asked Questions</h2>
            <div className={styles.faqItem}>
              <h4>Is Shield secure?</h4>
              <p>Yes. All encryption and decryption happen client-side, meaning your raw content never touches our servers. The smart contract simply stores the encrypted data and the access rules.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>What happens if I lose my wallet?</h4>
              <p>If you lose access to your wallet, you will lose access to any content that was shared with you, and you will not be able to manage the links you've created. Please keep your wallet secure.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Is there a cost to use Shield?</h4>
              <p>Creating a secure link requires a transaction on the Base network, which incurs a small gas fee. Accessing content is free (gasless).</p>
            </div>
          </section>

          <section id="developer" className={styles.section}>
            <h2>For Developers</h2>
            <p>
              Shield is an open-source project. We welcome contributions from the community. You can find our codebase, report issues, or submit pull requests on our GitHub repository.
            </p>
            <Link href="https://github.com/Babs0022/SHIELD" legacyBehavior>
              <a className={styles.link} target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Link>
          </section>

          <section id="contact" className={styles.section}>
            <h2>Contact & Support</h2>
            <p>
              For support, questions, or to report a bug, please open an issue on our GitHub repository. For all other inquiries, you can reach out to us on our social media channels.
            </p>
          </section>

          <section id="socials" className={styles.section}>
            <h2>Community & Socials</h2>
            <p>
              Stay up to date with the latest developments and join the conversation on our social media channels.
            </p>
            <div className={styles.socialLinks}>
              <p className={styles.comingSoonText}>Twitter: Coming Soon</p>
              <p className={styles.comingSoonText}>Farcaster: Coming Soon</p>
              {/* Add more social links as needed */}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default DocsPage;
