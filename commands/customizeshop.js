const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customizeshop')
        .setDescription('Customize the shop for this server.')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform: add or remove.')
                .setRequired(true)
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                ))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji for the item (ignored for roles).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the item (ignored for roles).')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('price')
                .setDescription('The price of the item or role.')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add to the shop.')
                .setRequired(false)), // Role option explicitly added
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({
                content: 'You do not have permission to customize the shop.',
                ephemeral: true,
            });
        }

        const action = interaction.options.getString('action');
        const emoji = interaction.options.getString('emoji');
        const name = interaction.options.getString('name');
        const price = interaction.options.getInteger('price');
        const role = interaction.options.getRole('role');

        if (action === 'add') {
            if (!price || price <= 0) {
                return interaction.reply({
                    content: 'You must specify a valid price greater than 0.',
                    ephemeral: true,
                });
            }

            const serverSettings = await db.getServerSettings(interaction.guild.id);

            if (!serverSettings.shopItems) {
                serverSettings.shopItems = [];
            }

            if (role) {
                // Adding a role to the shop
                serverSettings.shopItems.push({ role: role.id, name: role.name, price });
                await db.updateServerSettings(interaction.guild.id, serverSettings);

                const embed = new EmbedBuilder()
                    .setTitle('Shop Updated')
                    .setDescription('A new role has been added to the shop!')
                    .setColor(Colors.Green)
                    .addFields(
                        { name: 'Role', value: role.name, inline: true },
                        { name: 'Price', value: `${price} coins`, inline: true }
                    );

                return interaction.reply({ embeds: [embed] });
            }

            // Adding a custom item to the shop
            serverSettings.shopItems.push({ emoji: emoji || '🎉', name: name || 'Unnamed Item', price });
            await db.updateServerSettings(interaction.guild.id, serverSettings);

            const embed = new EmbedBuilder()
                .setTitle('Shop Updated')
                .setDescription('A new item has been added to the shop!')
                .setColor(Colors.Green)
                .addFields(
                    { name: 'Emoji', value: emoji || '🎉', inline: true },
                    { name: 'Name', value: name || 'Unnamed Item', inline: true },
                    { name: 'Price', value: `${price} coins`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        } else if (action === 'remove') {
            const serverSettings = await db.getServerSettings(interaction.guild.id);

            if (!serverSettings.shopItems || serverSettings.shopItems.length === 0) {
                return interaction.reply({
                    content: 'The shop is currently empty. Nothing to remove.',
                    ephemeral: true,
                });
            }

            // Remove an item by name or role
            const index = serverSettings.shopItems.findIndex(item => item.name === name || item.role === role?.id);
            if (index === -1) {
                return interaction.reply({
                    content: 'The specified item or role was not found in the shop.',
                    ephemeral: true,
                });
            }

            const removedItem = serverSettings.shopItems.splice(index, 1);
            await db.updateServerSettings(interaction.guild.id, serverSettings);

            const embed = new EmbedBuilder()
                .setTitle('Shop Updated')
                .setDescription('An item has been removed from the shop.')
                .setColor(Colors.Red)
                .addFields(
                    { name: 'Removed Item', value: removedItem[0].name || 'Unnamed Item', inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }
    },
};
