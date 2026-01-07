const Engine = require('./engine.interface');
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, Events, REST, Routes } = require('discord.js');
const QRCode = require('qrcode');

// ALTERAÇÃO: Carrega as variáveis do arquivo .env
require('dotenv').config();

class DiscordEngine extends Engine {
    constructor(cfg) {
        super(cfg);
        // ALTERAÇÃO: Define a visibilidade global baseada no .env
        // Se DEFAULT_SHOW_VALUE for 'true', exibe o valor. Caso contrário, oculta.
        this.showValueGlobal = process.env.DEFAULT_SHOW_VALUE === 'true';
    }

    async start(ua) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.MessageContent,
            ]
        });

        this.address = ua;

        // Registro do comando /address
        this.client.once(Events.ClientReady, async () => {
            const rest = new REST({ version: '10' }).setToken(this.cfg.token);
            const commands = [
                { name: 'address', description: 'Show the shielded address + QR Code' },
            ];
            await rest.put(
                Routes.applicationCommands(this.client.user.id),
                { body: commands }
            );
            console.log('DISCORD SLASH COMMAND REGISTERED');
        });

        // Handle slash command
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName !== 'address') return;

            try {
                const png = await QRCode.toBuffer(this.address, {
                    errorCorrectionLevel: 'M',
                    type: 'png',
                    margin: 1,
                    scale: 6,
                });
                const file = new AttachmentBuilder(png, { name: 'zec-address.png' });

                const embed = new EmbedBuilder()
                    .setColor(0xf4b728)
                    .setTitle('Send a Shielded Zcash memo')
                    .setDescription('Please send your message through the **Shielded Zcash address** below. The Memo will be replicated on all supported platforms.')
                    .setImage('attachment://zec-address.png');

                await interaction.reply({
                    embeds: [embed],
                    files: [file],
                    ephemeral: true, 
                });
            } catch (err) {
                console.error('Slash command error', err);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'Error generating QR.', ephemeral: true });
                }
            }
        });

        // Fetch and store channel id
        try {
            this.client.once(Events.ClientReady, async () => {
                this.channel = await this.client.channels.fetch(this.cfg.channelId);
                console.log('Discord engine ready');
            });
        } catch (err) {
            console.error('Fetch channel error:', err);
        }

        await this.client.login(this.cfg.token);
    }

    async post(message, value, txid) {
        if (!this.channel) throw new Error('Discord engine not started');

        // ALTERAÇÃO: O valor é exibido ou ocultado com base na variável global do .env
        const valueDisplay = this.showValueGlobal 
            ? `${value / 10 ** 8} ZEC` 
            : '🔒 *Valor Oculto*';

        const msgEmbed = new EmbedBuilder()
            .setColor(0xf4b728)
            .setAuthor({ name: this.client.user.username, iconURL: this.client.user.avatarURL() })
            .addFields([
                { name: 'Message', value: `${message}`, inline: false },
                { name: 'Transaction ID', value: `[🔗 Explorer](https://mainnet.zcashexplorer.app/transactions/${txid})`, inline: false },
                { name: 'Value', value: valueDisplay, inline: false },
            ]);

        await this.channel.send({ embeds: [msgEmbed] });
        
        // Log no terminal para monitoramento
        console.log(`[POST] TXID: ${txid} | Exibindo valor: ${this.showValueGlobal}`);
    }
}

module.exports = DiscordEngine;