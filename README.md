

---

# ZECA

**ZECA** is a JavaScript-based project that connects to the Zcash blockchain to monitor incoming shielded transactions.

When a transaction is detected, the message contained within its **encrypted memo** field is replicated to external platforms. The first available integration is with **Discord** (via bot), but its modular design makes it easy to extend to other platforms such as Telegram, X/Twitter, Matrix, or any other messaging system.

## How It Works.

* ZECA connects to the Zcash network via [Zcash-walletd](https://github.com/james-katz/zcash-walletd) and monitors a specific wallet for incoming transactions.
* Each Zcash Shielded transaction can carry an encrypted memo of **512 bytes** (512 characters).
* After decryption, ZECA extracts the text from the memo.
* The memo content is then transmitted to one or more connected platforms.
* With the Discord integration, for example, messages appear in real-time within a selected channel.

---

## Use Cases.

* **Whistleblowing:** Zcash allows for private transactions with encrypted memos. By monitoring a wallet with its viewing key, ZECA can replicate anonymous reports or tips to communication channels while preserving the sender's privacy.
* **Decentralized Messaging:** Shielded memos can act as a censorship-resistant microblogging system, mirroring messages onto conventional platforms.
* **Community Updates:** DAOs, projects, or communities can use ZECA to distribute updates, announcements, or polls in a verifiable way (on-chain proof).
* **Experimentation:** Explore how a blockchain-based messaging system can bridge into existing platforms.

---

## Installation Instructions.

**NOTE:** You will need Rust and Node.js to run ZECA. This installation is designed for Linux systems but can be performed on Windows systems using Docker.
Subsequently, you will need to use Discord for bot configuration and usage.

### Environment Preparation (It is recommended to create a new folder to store the entire project)

---

### Installing Rust.

Rust is required to compile the low-level components present in Zcash-walletd.

* On Linux, simply run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

```

---

### Installing NVM and Node.js.

We recommend using **nvm** (Node Version Manager) to manage Node.js.

* Linux:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

```

(Restart your terminal after installation).

**Install Node.js LTS:**

```bash
nvm install --lts

```

```bash
nvm use --lts

```

---

### Compilation and Build (Inside the project folder).

1. **Clone the Zcash wallet backend:**

```bash
git clone https://github.com/james-katz/zcash-walletd

```

2. **Install nj-cli (one-time step):**

```bash
cargo install nj-cli

```

3. **Enter the Zcash-walletd folder and build with nj-cli.**

```bash
cd zcash-walletd/js

```

```bash
nj-cli build --release

```

4. **Return to the main project folder and clone the ZECA repository.**

```bash
cd ..

```

```bash
git clone https://github.com/Paow4n/ZECA

```

```bash
cd ZECA

```

5. **Copy the compiled files to the ZECA root:**

```bash
cp -r ../zcash-walletd/js/dist ./dist

```

6. **Configure environment variables:**

```bash
cp sample.env .env

```

Edit the `.env` file with your credentials and keys. (You can obtain the BOT token at [Discord developers](https://discord.com/developers/applications). The Channel ID can be found in Discord itself; you must enable Developer Mode in settings. The Zcash wallet viewing key can be obtained via Zashi following their UFVK retrieval tutorial.)

7. **Install dependencies and prepare the database.**

```bash
npm install

```

```bash
node sync_db.js

```

8. **Start the bot:**

```bash
node index.js

```

---

After following these steps, if you have configured the `.env` correctly and added the bot to a server where you have administrator privileges, running `node index.js` will display Sync information on the terminal and the Bot will go online.

Once the Bot is online, you can use the `/address` command to receive a QR Code with the wallet address configured in the UFVK.

**Important:** The UFVK is sensitive information from your Zcash wallet; it will not be displayed by the bot. The bot will display a shielded address derived from your UFVK. Any funds transferred to this address will go to your wallet, and the memo information will be displayed by the Bot. We strongly recommend setting up a new wallet specifically for the Bot and **not using your personal wallet**.

---

