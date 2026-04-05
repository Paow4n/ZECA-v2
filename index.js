const fs = require('fs');
const DiscordEngine = require('./engines/discord.engine');
const { Transaction, init } = require('./db');
const { ZkoolClient } = require('./zkool.client');

require('dotenv').config();

// Configurações .env
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 60;
const GQL_URL = 'http://zkool-service:8000/graphql'; // URL interna do Docker
const VK = process.env.VK;
const BIRTH_HEIGHT = parseInt(process.env.BIRTH_HEIGHT) || 0;
const SHOW_VALUE = process.env.DEFAULT_SHOW_VALUE === 'true';

// Inicialização dos Engines (Discord)
const engines = [
    new DiscordEngine({
        token: process.env.DISCORD_BOT_TOKEN,
        channelId: process.env.DISCORD_CHANNEL_ID,
    }),
];

// Função auxiliar para logs
function writeLog(message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync('bot.log', logEntry);
    console.log(message);
}

async function startAll(ua) {
    for (const e of engines) {
        try {
            await e.start(ua);
        } catch (err) {
            writeLog(`[ENGINE ERROR] Falha ao inicializar engine: ${err.message}`);
        }
    }
}

async function broadcast(message, value, txid) {
    await Promise.allSettled(engines.map(e => e.post(message, value, txid)));
}

// APP Entrypoint
(async () => {
    try {
        writeLog("--- Iniciando ZCASH Bot via SDK Sanitizado ---");

        // Inicializa o banco de dados local
        await init();

        if (!VK) throw new Error("A variável VK (UFVK) não foi definida no .env!");

        // Instancia o Client do Zkool
        const zkool = new ZkoolClient(GQL_URL);

        // O init() faz o ping na API e já liga o sincronizador no background!
        await zkool.init();
        writeLog("[INFO] Motor ZkoolClient inicializado. Sincronização em background ativada.");

        try {
            // Tenta criar a conta. Se já existir (erro), ele segue o baile.
            await zkool.createNewAccount(VK, 0, BIRTH_HEIGHT, "ZecaMonitor");
            writeLog("[INFO] Conta UFVK configurada com sucesso.");
        } catch (err) {
            writeLog(`[INFO] Conta já existente no banco de dados da API.`);
        }

        // Garante que o SDK sempre olhe para a sua conta principal (ID 1)
        zkool.accountId = 1;

        // Pega o endereço de forma limpa usando o SDK
        const addressData = await zkool.getAddress();
        let ua = addressData?.ua; 
        if (!ua) throw new Error("Nenhum endereço retornado pelo Zkool.");

        writeLog(`[INFO] Endereço UA detectado: ${ua.substring(0, 10)}...`);

        // Inicializa o Discord
        await startAll(ua);

        let isProcessing = false;

        // Ciclo principal de monitoramento e postagem
        setInterval(async () => {
            if (isProcessing) return;
            isProcessing = true;

            try {
                // Pega a lista simplificada de transações
                const txs = await zkool.getTransactions();
                if (!txs || txs.length === 0) return;

                const latestDbHeight = await Transaction.max('height') || 0;
                
                // Filtra para manter apenas o que é novidade para o nosso banco de dados
                const newTxns = txs.filter(tx => tx.height > latestDbHeight);

                if (newTxns.length === 0) return;

                writeLog(`[SYNC] ${newTxns.length} novas transações confirmadas prontas para leitura.`);

                // Processa cada transação nova para buscar a mensagem (memo)
                for (const tx of newTxns) {
                    const details = await zkool.getTransactionInfo(zkool.accountId, tx.txid);
                    
                    let txMemo = null;
                    if (details && details.notes && details.notes.length > 0 && details.notes[0].memo) {
                        txMemo = details.notes[0].memo;
                    }

                    // Salva no banco de dados local do Bot
                    await Transaction.create({
                        txid: tx.txid,
                        value: Number(tx.value) || 0,
                        height: Number(tx.height),
                        memo: txMemo
                    });

                    // Envia para o Discord (Broadcast) apenas se tiver mensagem válida
                    if (txMemo && String(txMemo).trim().length > 0) {
                        const valueToPost = SHOW_VALUE ? tx.value : "Oculto";
                        await broadcast(txMemo, valueToPost, tx.txid);
                        writeLog(`[BROADCAST] TXID postado no Discord: ${tx.txid}`);
                    }
                }

            } catch (innerErr) {
                writeLog(`[ERROR] Falha na varredura de transações: ${innerErr.message}`);
            } finally {
                isProcessing = false;
            }
        }, POLL_INTERVAL * 1000);

    } catch (err) {
        writeLog(`[FATAL ERROR] Erro crítico no startup: ${err.message}`);
        process.exit(1);
    }
})();