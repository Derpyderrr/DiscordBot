const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { logAndReplyError } = require('../utils/errorLogger');
const { hasPermission } = require('../utils/checkPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setroles')
        .setDescription('Sets up default roles in the server.'),
    async execute(interaction) {
        try {
            if (!hasPermission(interaction.member, 'ManageRoles')) {
                await interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
                return;
            }

            const roles = [
                { name: 'Member', color: 'BLUE' },
                { name: 'Moderator', color: 'GREEN' },
                { name: 'Admin', color: 'RED' },
            ];

            await interaction.reply('Setting up roles...');
            for (const role of roles) {
                const existingRole = interaction.guild.roles.cache.find(r => r.name === role.name);
                if (existingRole) continue;

                await interaction.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    reason: 'Default role setup',
                });
            }

            await interaction.followUp('Roles have been set up successfully!');
        } catch (error) {
            await logAndReplyError(error, interaction);
        }
    },
};
