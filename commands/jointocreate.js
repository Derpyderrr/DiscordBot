const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vccreate')
        .setDescription('Creates a dynamic voice channel system (join2create).'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;

            // Check if a join2create channel already exists
            const existingChannel = guild.channels.cache.find(
                channel => channel.name.toLowerCase() === 'join2create' && channel.type === ChannelType.GuildVoice
            );

            if (existingChannel) {
                return interaction.editReply('The "join2create" channel already exists.');
            }

            // Create the join2create channel
            const join2CreateChannel = await guild.channels.create({
                name: 'join2create',
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.Connect],
                    },
                ],
            });

            return interaction.editReply(
                `The "join2create" channel has been created! Users can now dynamically create their own channels.`
            );
        } catch (error) {
            console.error('Error creating join2create channel:', error);
            return interaction.editReply('An error occurred while creating the join2create channel.');
        }
    },
};

// Setup the dynamic join2create functionality
module.exports.setupJoinToCreate = (client) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        try {
            // Ignore bot actions
            if (newState.member.user.bot) return;

            const join2CreateChannel = newState.guild.channels.cache.find(
                channel =>
                    channel.name.toLowerCase() === 'join2create' &&
                    channel.type === ChannelType.GuildVoice
            );

            // If there's no join2create channel or the user didn't join it, exit
            if (!join2CreateChannel || newState.channelId !== join2CreateChannel.id) return;

            const guild = newState.guild;
            const category = join2CreateChannel.parent; // Get the category of the join2create channel

            // Create a new voice channel under the same category
            const userChannel = await guild.channels.create({
                name: `${newState.member.user.username}'s Channel`,
                type: ChannelType.GuildVoice,
                parent: category?.id, // Set the same category as the join2create channel
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: newState.member.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.MoveMembers,
                        ],
                    },
                ],
            });

            // Move the user to their new channel
            await newState.setChannel(userChannel);

            // Monitor the dynamically created channel
            const interval = setInterval(async () => {
                const updatedChannel = guild.channels.cache.get(userChannel.id);
                if (updatedChannel && updatedChannel.members.size === 0) {
                    clearInterval(interval);
                    await updatedChannel.delete();
                }
            }, 5000); // Check every 5 seconds
        } catch (error) {
            console.error('Error handling join2create:', error);
        }
    });
};
