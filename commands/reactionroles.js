const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rr')
        .setDescription('Set up a reaction role for a specific message.')
        .addStringOption(option =>
            option.setName('message_link')
                .setDescription('The link to the message to add the reaction role.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reaction')
                .setDescription('The emoji to use for the reaction role.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('role_name')
                .setDescription('The name of the role to assign.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('one_time_use')
                .setDescription('Specify "Y" to make the role one-time use only.') // Optional field
                .setRequired(false)), // Marked as optional
    async execute(interaction) {
        // Ensure user has Manage Roles permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true }); // Defer the reply

        // Parse options
        const messageLink = interaction.options.getString('message_link');
        const reaction = interaction.options.getString('reaction');
        const roleName = interaction.options.getString('role_name');
        const oneTimeUse = interaction.options.getString('One-time use?') === 'Y'; // Optional flag

        // Parse message link for guild, channel, and message IDs
        const regex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
        const match = messageLink.match(regex);

        if (!match) {
            return interaction.editReply({
                content: 'Invalid message link. Please provide a valid link.',
            });
        }

        const [_, guildId, channelId, messageId] = match;

        // Ensure message link belongs to the same guild
        if (guildId !== interaction.guild.id) {
            return interaction.editReply({
                content: 'The message link must be from this server.',
            });
        }

        try {
            // Fetch the channel and message
            const channel = await interaction.guild.channels.fetch(channelId);
            if (!channel) {
                return interaction.editReply({
                    content: 'Channel not found. Ensure the bot has access to the channel.',
                });
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                return interaction.editReply({
                    content: 'Message not found. Ensure the bot has access to the message.',
                });
            }

            // Validate the role
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (!role) {
                return interaction.editReply({
                    content: 'Something went wrong... The specified role does not exist.',
                });
            }

            // React to the message
            await message.react(reaction);

            // Register reaction role listener
            const reactionRolesMap = getReactionRolesMap(interaction.client);
            if (!reactionRolesMap[message.id]) {
                reactionRolesMap[message.id] = {};
            }
            reactionRolesMap[message.id][reaction] = { roleId: role.id, oneTimeUse };

            // Edit the deferred reply with success message
            return interaction.editReply({
                content: `Reaction role successfully set! React with "${reaction}" on [this message](${messageLink}) to get the "${role.name}" role.${oneTimeUse ? ' (One-time use)' : ''}`,
            });
        } catch (error) {
            console.error('Error setting up reaction role:', error);
            return interaction.editReply({
                content: 'Something went wrong... Please try again.',
            });
        }
    },
};

/**
 * Retrieves the reaction roles map stored in the client's custom cache.
 * Initializes the cache if not present.
 * @param {Client} client - The Discord client instance.
 * @returns {Object} The reaction roles map.
 */
function getReactionRolesMap(client) {
    if (!client.reactionRolesMap) {
        client.reactionRolesMap = {};
    }
    return client.reactionRolesMap;
}

/**
 * Sets up the reaction role event listeners.
 * @param {Client} client - The Discord client instance.
 */
function setupReactionRoleListeners(client) {
    client.on('messageReactionAdd', async (reaction, user) => {
        try {
            if (user.bot) return;

            const { message } = reaction;
            const reactionRolesMap = getReactionRolesMap(client);
            if (!reactionRolesMap[message.id]) return;

            const roleInfo = reactionRolesMap[message.id][reaction.emoji.name];
            if (!roleInfo) return;

            const { roleId, oneTimeUse } = roleInfo;

            const guild = message.guild;
            if (!guild) return;

            const member = await guild.members.fetch(user.id);
            if (!member) return;

            if (!member.roles.cache.has(roleId)) {
                await member.roles.add(roleId);
                console.log(`Added role ${roleId} to ${user.tag}`);
            }
        } catch (error) {
            console.error('Error handling reaction add:', error);
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        try {
            if (user.bot) return;

            const { message } = reaction;
            const reactionRolesMap = getReactionRolesMap(client);
            if (!reactionRolesMap[message.id]) return;

            const roleInfo = reactionRolesMap[message.id][reaction.emoji.name];
            if (!roleInfo) return;

            const { roleId, oneTimeUse } = roleInfo;

            if (oneTimeUse) {
                // Skip removing the role if one-time use is enabled
                return;
            }

            const guild = message.guild;
            if (!guild) return;

            const member = await guild.members.fetch(user.id);
            if (!member) return;

            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                console.log(`Removed role ${roleId} from ${user.tag}`);
            }
        } catch (error) {
            console.error('Error handling reaction remove:', error);
        }
    });
}

// Ensure the reaction role listeners are set up
module.exports.setupReactionRoleListeners = setupReactionRoleListeners;
