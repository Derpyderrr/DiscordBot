const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rr')
        .setDescription('Reaction roles'),
    async execute(interaction) {
        // Ensure the bot has necessary permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Ensure the interaction is acknowledged
        try {
            await interaction.reply('What do you want the message to be? (Type your message below or say "cancel" to stop)');
        } catch (err) {
            console.error('Error acknowledging the interaction:', err);
            return;
        }

        try {
            const channel = interaction.channel;

            // Create a collector to listen for the user's response
            const messageCollector = channel.createMessageCollector({
                filter: msg => msg.author.id === interaction.user.id,
                max: 1,
                time: 60000,
            });

            let reactionMessage = '';
            let roles = [];
            let roleReactions = [];

            console.log('Message collector created. Waiting for user input.');

            messageCollector.on('collect', async (msg) => {
                if (msg.content.toLowerCase() === 'cancel') {
                    await interaction.followUp('Reaction roles setup cancelled.');
                    return;
                }

                reactionMessage = msg.content;
                console.log('Message content received:', reactionMessage);

                await interaction.followUp('Message set. What roles do you want to set? (Provide role names separated by commas)');

                const roleCollector = channel.createMessageCollector({
                    filter: msg => msg.author.id === interaction.user.id,
                    max: 1,
                    time: 60000,
                });

                roleCollector.on('collect', async (roleMsg) => {
                    if (roleMsg.content.toLowerCase() === 'cancel') {
                        await interaction.followUp('Reaction roles setup cancelled.');
                        return;
                    }

                    roles = roleMsg.content.split(',').map(role => role.trim());
                    console.log('Roles received:', roles);

                    if (roles.length === 0) {
                        await interaction.followUp('Reaction roles setup failed. No roles provided.');
                        return;
                    }

                    await interaction.followUp(`Roles set. What reaction for ${roles[0]}?`);

                    const reactionCollector = channel.createMessageCollector({
                        filter: msg => msg.author.id === interaction.user.id,
                        time: 60000,
                    });

                    let roleIndex = 0;

                    reactionCollector.on('collect', async (reactionMsg) => {
                        if (reactionMsg.content.toLowerCase() === 'cancel') {
                            await interaction.followUp('Reaction roles setup cancelled.');
                            reactionCollector.stop();
                            return;
                        }

                        if (!reactionMsg.content.match(/<:.+?:\d+>|[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]+/)) {
                            await interaction.followUp('Reaction roles setup failed. Invalid reaction provided.');
                            reactionCollector.stop();
                            return;
                        }

                        roleReactions.push({
                            role: roles[roleIndex],
                            reaction: reactionMsg.content,
                        });

                        roleIndex++;

                        if (roleIndex < roles.length) {
                            await interaction.followUp(`Reaction set for ${roleReactions[roleIndex - 1].role}. What reaction for ${roles[roleIndex]}?`);
                        } else {
                            reactionCollector.stop();

                            // Final step: Display the embed and add reactions
                            const embed = new EmbedBuilder()
                                .setTitle('Reaction role')
                                .setDescription(reactionMessage)
                                .setColor(null);

                            const sentMessage = await interaction.channel.send({
                                embeds: [embed],
                            });

                            // Automatically add reactions to the message
                            for (const { reaction } of roleReactions) {
                                try {
                                    await sentMessage.react(reaction);
                                } catch (error) {
                                    console.error(`Failed to add reaction ${reaction}:`, error);
                                }
                            }

                            await interaction.followUp('Reaction roles setup complete!');
                        }
                    });

                    reactionCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('Reaction roles setup timed out.');
                        }
                    });
                });

                roleCollector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.followUp('Reaction roles setup timed out.');
                    }
                });
            });

            messageCollector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.followUp('Reaction roles setup timed out.');
                }
            });
        } catch (error) {
            console.error('Error in reaction roles setup:', error);
            await interaction.followUp({ content: 'An error occurred during the setup process.', ephemeral: true });
        }
    },
};
