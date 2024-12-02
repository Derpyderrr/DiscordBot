const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createjembed')
        .setDescription('Create JSON embed.')
        .addStringOption(option =>
            option.setName('json')
                .setDescription('A JSON string for the embed. Required.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const jsonString = interaction.options.getString('json');
            let embeds = [];

            try {
                const parsed = JSON.parse(jsonString);

                if (parsed.embeds && Array.isArray(parsed.embeds)) {
                    embeds = parsed.embeds.map(embedData => {
                        if (!embedData.author) {
                            embedData.author = {
                                name: interaction.client.user.username,
                                icon_url: interaction.client.user.displayAvatarURL(),
                            };
                        }
                        return EmbedBuilder.from(embedData);
                    });
                } else if (parsed.title || parsed.description || parsed.color) {
                    if (!parsed.author) {
                        parsed.author = {
                            name: interaction.client.user.username,
                            icon_url: interaction.client.user.displayAvatarURL(),
                        };
                    }
                    embeds = [EmbedBuilder.from(parsed)];
                } else {
                    return interaction.editReply({
                        content: 'Invalid JSON provided. Please check your structure and try again.',
                    });
                }
            } catch (error) {
                return interaction.editReply({
                    content: 'Invalid JSON provided. Please check your syntax and try again.',
                });
            }

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
                embeds,
            });

            const messages = await interaction.channel.messages.fetch({ limit: 10 });
            const userMessages = messages.filter(msg => msg.interaction?.id === interaction.id);
            await interaction.channel.bulkDelete(userMessages);

            await interaction.editReply({
                content: 'JSON Embed(s) sent!',
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error creating JSON embed:', error);
            await interaction.editReply({
                content: 'An error occurred while creating the JSON embed. Please try again.',
                ephemeral: true,
            });
        }
    },
    staffOnly: true, // Staff command
};
