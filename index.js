const fs = require('fs'); // Módulo para log
const DiscordEngine = require('./engines/discord.engine');
const native = require('./dist/');
const { Transaction } = require ('./db');

require('dotenv').config();

// .env configuration
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 60; //
const LWD_SERVERS = process.env.LWD_URL.split(','); // Server .env
let currentServerIndex = 0;
let syncLock = false;

// Engine Initialization (Engines)
const engines = [
    new DiscordEngine({
        token: process.env.DISCORD_BOT_TOKEN,
        channelId: process.env.DISCORD_CHANNEL_ID,
    }),
];

// Auxiliary function for recording logs with timestamps
function writeLog(message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync('bot.log', logEntry); // Record in bot.log
    console.log(message); // Show in terminal too
}

async function startAll(ua) {
    for (const e of engines) {
        try {
            await e.start(ua);
        } catch (err) {
            writeLog(`[ENGINE ERROR] Fail to initialize engine: ${err.message}`);
        }
    }
}

async function broadcast(message, value, txid) {
    await Promise.allSettled(engines.map(e => e.post(message, value, txid)));
}

// APP entrypoint
(async () => {
    try {
        writeLog("--- Starting ZCASH Bot ---");
        
        // Initializes the native library.
        native.init();

        // Get default address    
        const addrStr = native.getAddresses();
        const addrJson = JSON.parse(addrStr);

        let ua = "";
        if(addrJson[0] && addrJson[0].address) {
            ua = addrJson[0].address;
        } else {
            throw new Error("No addresses found in the wallet.");
        }
        
        // Initialize engines (Discord)
        await startAll(ua);

        // Create timer to look for transactions
        setInterval(async () => {
            if(syncLock) {
                writeLog("[SYNC] Synchronization process already underway.");
                return;
            }

            // Internal security block to prevent the bot from crashing.
            try {
                syncLock = true;
                writeLog(`[SYNC] Checking blocks on the server.: ${LWD_SERVERS[currentServerIndex]}`);

                // Synchronization (may cause a broken pipe if the network fails)
                const scan = await native.requestScan();
                
                const txnsStr = native.getTransfers(0, [0]);
                const txnsJson = JSON.parse(txnsStr);                
                
                // Get latest known transaction in the database
                const latest = await Transaction.max('height') || 0;

                // Keep only new transactions
                const newTxns = txnsJson.in.filter(tx => tx.height > latest);
                if (newTxns.length === 0) {
                    writeLog("[SYNC] No new transactions.");
                    return;
                }

                writeLog(`[SYNC] ${newTxns.length} Transactions received.`);

                // Add new transactions into the database
                const rows = newTxns.map(t => ({
                    txid: t.txid,
                    value: Number(t.amount) || 0,
                    height: Number(t.height),
                    memo: t.note ?? null,
                }));

                await Transaction.bulkCreate(rows, { ignoreDuplicates: true });

                // Send the memo to the platform engines
                for (const t of newTxns) {
                    if (t.note && String(t.note).trim().length > 0) {
                        await broadcast(t.note, t.amount, t.txid);
                        writeLog(`[BROADCAST] TXID posted: ${t.txid}`);
                    }
                }
            // Error handling -> Tratamento de erros. 
            } catch (innerErr) {
                // Checks if innerErr exists and if it has a 'message' property.
                const errorMsg = (innerErr && innerErr.message) ? innerErr.message : "Unknown error or failure in the native library.";
                
                writeLog(`[ERROR] Failure during the cycle: ${errorMsg}`);
                
                // We now securely verify if it's a connection error.
                if (errorMsg.includes('pipe') || errorMsg.includes('connection') || errorMsg.includes('stream')) {
                    rotateServer();
                }
            } finally {
                // This ensures that, even if there is an error, the bot will try again in the next minute.
                syncLock = false; 
            }
            
        }, POLL_INTERVAL * 1000);
    } catch(err) {
        writeLog(`[FATAL ERROR] Critical error during startup: ${err.message}`);
        process.exit(1);
    }
})();