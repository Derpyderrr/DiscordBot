const { SlashCommandBuilder } = require('discord.js');
const { logAndReplyError } = require('../utils/errorLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! and shows bot latency.'),
    async execute(interaction) {
        try {
            const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            const websocketPing = interaction.client.ws.ping;
            await interaction.editReply(`Pong! Latency: ${latency}ms. Websocket: ${websocketPing}ms.`);
        } catch (error) {
            await logAndReplyError(error, interaction);
        }
    },
};
