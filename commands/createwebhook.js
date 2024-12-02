const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createwebhook')
        .setDescription('Create a webhook in the current channel using the bot\'s name and avatar.'),
    async execute(interaction) {
        if (!interaction.channel) {
            return interaction.reply({
                content: 'This command can only be used in a channel.',
                ephemeral: true,
            });
        }

        try {
            // Defer the interaction for processing
            await interaction.deferReply({ ephemeral: true });

            // Fetch all webhooks in the channel
            const existingWebhooks = await interaction.channel.fetchWebhooks();

            // Find an existing webhook created by the bot
            const botWebhook = existingWebhooks.find(
                webhook => webhook.owner?.id === interaction.client.user.id &&
                    webhook.name === interaction.client.user.username
            );

            if (botWebhook) {
                try {
                    // Validate the existing webhook
                    const webhookMessage = await botWebhook.send('Webhook already exists.');
                    setTimeout(() => webhookMessage.delete(), 3000); // Delete the webhook message after 3 seconds
                    return interaction.editReply({
                        content: 'Webhook already exists.',
                    });
                } catch (error) {
                    // If the webhook is invalid, delete it
                    console.warn('Invalid webhook detected. Deleting and creating a new one.', error);
                    await botWebhook.delete('Recreating invalid webhook.');
                }
            }

            // Create a new webhook
            const newWebhook = await interaction.channel.createWebhook({
                name: interaction.client.user.username,
                avatar: interaction.client.user.displayAvatarURL(),
            });

            if (newWebhook) {
                // Send confirmation through the webhook
                const webhookMessage = await newWebhook.send('Webhook created!');
                setTimeout(() => webhookMessage.delete(), 3000); // Delete the webhook message after 3 seconds
                return interaction.editReply({
                    content: 'Webhook created!',
                });
            } else {
                throw new Error('Failed to create webhook.');
            }
        } catch (error) {
            console.error('Error creating webhook:', error);

            // Handle any errors gracefully
            await interaction.editReply({
                content: 'Webhook creation failed. Please try again or check bot permissions.',
            });
        }
    },
    staffOnly: true, // Staff command
};
