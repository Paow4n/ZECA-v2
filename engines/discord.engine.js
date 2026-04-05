const Engine = require('./engine.interface');
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, Events, REST, Routes, MessageFlags } = require('discord.js');
const QRCode = require('qrcode');

// Load .env variables.
require('dotenv').config();

class DiscordEngine extends Engine {
    constructor(cfg) {
        super(cfg);
        // Set global visibility based on .env configuration.
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

        // Register /address command.
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
                    // O endereço continua no Embed por estética...
                    .addFields([
                        { name: 'Unified Address', value: this.address }
                    ])
                    .setImage('attachment://zec-address.png');

                await interaction.reply({
                    embeds: [embed],
                    files: [file],
                    flags: [MessageFlags.Ephemeral], 
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

        // Blindagem contra NaN: Verifica se o .env permite e se o valor é um número real
        const valueDisplay = (this.showValueGlobal && !isNaN(value))
            ? `${Number(value) / 10 ** 8} ZEC` 
            : '🔒 *Hidden Value*';

        const msgEmbed = new EmbedBuilder()
            .setColor(0xf4b728)
            .setAuthor({ name: this.client.user.username, iconURL: this.client.user.avatarURL() })
            .addFields([
                { name: 'Message', value: `${message}`, inline: false },
                { name: 'Transaction ID', value: `[🔗 Explorer](https://mainnet.zcashexplorer.app/transactions/${txid})`, inline: false },
                { name: 'Value', value: valueDisplay, inline: false },
            ]);

        await this.channel.send({ embeds: [msgEmbed] });
        
        // Log status to console for monitoring.
        console.log(`[POST] TXID: ${txid} | Exibindo valor: ${this.showValueGlobal}`);
    }
}

module.exports = DiscordEngine;