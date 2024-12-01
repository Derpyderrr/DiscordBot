const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Set up reaction roles'),
    async execute(interaction) {
        try {
            // Step 1: Ask for the message content
            await interaction.reply('What do you want the message to be? (Type your message below or say "cancel" to stop)');
            const messageCollector = interaction.channel.createMessageCollector({
                filter: msg => msg.author.id === interaction.user.id,
                max: 1,
                time: 60000,
            });

            let reactionMessage = '';
            let roles = [];
            let roleReactions = {};

            messageCollector.on('collect', async (msg) => {
                if (msg.content.toLowerCase() === 'cancel') {
                    await interaction.followUp('Reaction roles setup cancelled.');
                    return;
                }

                reactionMessage = msg.content;
                await interaction.followUp('Message set. What roles do you want to set? (Provide role names separated by commas)');

                const roleCollector = interaction.channel.createMessageCollector({
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
                    if (roles.length === 0) {
                        await interaction.followUp('Reaction roles setup failed. No roles provided.');
                        return;
                    }

                    await interaction.followUp(`Roles set. What reaction for ${roles[0]}?`);

                    const reactionCollector = interaction.channel.createMessageCollector({
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

                        // Validate emoji
                        if (!reactionMsg.content.match(/<:.+?:\d+>|[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]+/)) {
                            await interaction.followUp('Invalid reaction provided. Setup failed.');
                            reactionCollector.stop();
                            return;
                        }

                        // Map role to reaction
                        roleReactions[reactionMsg.content] = roles[roleIndex];

                        roleIndex++;
                        if (roleIndex < roles.length) {
                            await interaction.followUp(`Reaction set for ${roles[roleIndex - 1]}. What reaction for ${roles[roleIndex]}?`);
                        } else {
                            reactionCollector.stop();

                            // Final Step: Create the message and add reactions
                            const embed = new EmbedBuilder()
                                .setTitle('Reaction Roles')
                                .setDescription(reactionMessage)
                                .setColor(null);

                            const sentMessage = await interaction.channel.send({ embeds: [embed] });

                            // Add reactions to the message
                            for (const reaction in roleReactions) {
                                await sentMessage.react(reaction);
                            }

                            await interaction.followUp('Reaction roles setup complete!');

                            // Listen for reactions on this message
                            setupReactionRoleListeners(interaction.client, sentMessage.id, roleReactions);
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

/**
 * Sets up reaction role listeners for a given message.
 * @param {Client} client - The Discord client instance.
 * @param {string} messageId - The ID of the message to listen for reactions on.
 * @param {Object} roleReactions - A mapping of reactions to role names.
 */
function setupReactionRoleListeners(client, messageId, roleReactions) {
    client.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.message.id !== messageId) return;

        const guild = reaction.message.guild;
        if (!guild) return;

        const roleName = roleReactions[reaction.emoji.name];
        if (!roleName) return;

        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) return;

        const member = guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.add(role);
                console.log(`Added role ${roleName} to ${user.tag}`);
            } catch (error) {
                console.error(`Failed to add role ${roleName} to ${user.tag}:`, error);
            }
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (reaction.message.id !== messageId) return;

        const guild = reaction.message.guild;
        if (!guild) return;

        const roleName = roleReactions[reaction.emoji.name];
        if (!roleName) return;

        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) return;

        const member = guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.remove(role);
                console.log(`Removed role ${roleName} from ${user.tag}`);
            } catch (error) {
                console.error(`Failed to remove role ${roleName} from ${user.tag}:`, error);
            }
        }
    });
}
