const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createembed')
        .setDescription('Create a custom embed.')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed in hex (e.g., #00ff00).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('The footer text of the embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('Custom author name for the embed.')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const color = interaction.options.getString('color') || '#ffffff';
            const footer = interaction.options.getString('footer') || null;
            const customAuthor = interaction.options.getString('author');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color);

            // Add author: Custom author if provided, or default to the bot
            if (customAuthor) {
                embed.setAuthor({ name: customAuthor });
            } else {
                embed.setAuthor({
                    name: interaction.client.user.username,
                    iconURL: interaction.client.user.displayAvatarURL(),
                });
            }

            if (footer) embed.setFooter({ text: footer });

            const webhooks = await interaction.channel.fetchWebhooks();
            const existingWebhook = webhooks.find(wh => wh.owner.id === interaction.client.user.id);

            if (!existingWebhook) {
                return interaction.editReply({
                    content: 'Please run `/createwebhook` to create a webhook in this channel.',
                });
            }

            await existingWebhook.send({
                username: interaction.client.user.username,
                avatarURL: interaction.client.user.displayAvatarURL(),
                embeds: [embed],
            });

            const messages = await interaction.channel.messages.fetch({ limit: 10 });
            const userMessages = messages.filter(msg => msg.interaction?.id === interaction.id);
            await interaction.channel.bulkDelete(userMessages);

            await interaction.editReply({
                content: 'Embed sent!',
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error creating embed:', error);
            await interaction.editReply({
                content: 'An error occurred while creating the embed. Please try again.',
                ephemeral: true,
            });
        }
    },
};
