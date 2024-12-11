const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the shop and purchase items.'),
    async execute(interaction) {
        const serverSettings = await db.getServerSettings(interaction.guild.id);
        const shopItems = serverSettings.shopItems;

        if (!shopItems || shopItems.length === 0) {
            return interaction.reply({
                content: 'The shop is currently empty. Ask an admin to customize it!',
                ephemeral: true,
            });
        }

        // Build the embed for the shop
        const embed = new EmbedBuilder()
            .setTitle('Shop')
            .setDescription('Browse and purchase items using your coins!')
            .setColor(Colors.Green); // Use predefined color constant

        shopItems.forEach((item, index) => {
            embed.addFields({
                name: `Item #${index + 1}: ${item.emoji} ${item.name}`,
                value: `Price: ${item.price} coins`,
                inline: false,
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};
