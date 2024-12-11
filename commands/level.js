const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js'); // Use Colors for predefined color constants
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your pet\'s stats.'),
    async execute(interaction) {
        const user = await db.getUser(interaction.user.id);

        const xpForNextLevel = 100 + (user.level - 1) * 50; // XP needed for the next level
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Pet Stats`)
            .setDescription(`**Pet:** ${user.pet || 'No pet assigned'}\n**Level:** ${user.level}\n**XP:** ${user.xp}/${xpForNextLevel}\n**Prestige:** ${user.prestige}`)
            .setColor(Colors.Blue); // Use Colors.Blue for the color
        await interaction.reply({ embeds: [embed] });
    },
};
