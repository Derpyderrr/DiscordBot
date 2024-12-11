const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your wallet balance.'),
    async execute(interaction) {
        const user = await db.getUser(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Wallet`)
            .setDescription(`**Coins:** ${user.coins}`)
            .setColor('GOLD');
        await interaction.reply({ embeds: [embed] });
    },
};
