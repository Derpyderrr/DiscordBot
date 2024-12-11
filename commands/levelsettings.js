const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelsettings')
        .setDescription('Customize the level-based role rewards.')
        .addIntegerOption(option =>
            option.setName('prestige_reward')
                .setDescription('Set the prestige reward in coins.')
                .setRequired(false)),
    async execute(interaction) {
        const prestigeReward = interaction.options.getInteger('prestige_reward');
        const serverSettings = await db.getServerSettings(interaction.guild.id);

        if (prestigeReward) {
            serverSettings.prestigeReward = prestigeReward;
            await db.updateServerSettings(interaction.guild.id, serverSettings);
        }

        const embed = new EmbedBuilder()
            .setTitle('Level Settings')
            .setDescription('Current level settings for the server.')
            .setColor(Colors.Green) // Corrected color usage
            .addFields(
                { name: 'Prestige Reward', value: `${serverSettings.prestigeReward} coins`, inline: true },
                { name: 'Level Roles', value: serverSettings.levelRoles.length ? serverSettings.levelRoles.map(lr => `Level ${lr.level}: <@&${lr.roleId}>`).join('\n') : 'None configured.', inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    },
};
