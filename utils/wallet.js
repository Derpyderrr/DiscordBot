const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View and buy items from the shop.')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item to purchase.')
                .setRequired(false)),
    async execute(interaction) {
        const itemName = interaction.options.getString('item');
        const settings = await db.getServerSettings(interaction.guild.id);

        if (!itemName) {
            const shopItems = settings.shopItems.map(item => `${item.emoji} **${item.name}** - ${item.price} coins`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('Shop')
                .setDescription(shopItems || 'No items available.')
                .setColor('GREEN');
            return interaction.reply({ embeds: [embed] });
        }

        const item = settings.shopItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) return interaction.reply({ content: 'Item not found.', ephemeral: true });

        const user = await db.getUser(interaction.user.id);
        if (user.coins < item.price) return interaction.reply({ content: 'Not enough coins.', ephemeral: true });

        user.coins -= item.price;
        await db.updateUser(interaction.user.id, user);
        return interaction.reply({ content: `You bought **${item.name}** for ${item.price} coins!`, ephemeral: true });
    },
};
