const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setroles')
        .setDescription('Set basic roles'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            await interaction.reply({
                content: 'You do not have permission to manage roles.',
                ephemeral: true,
            });
            return;
        }

        const roles = [
            { name: 'Member', color: 'BLUE' },
            { name: 'Moderator', color: 'GREEN' },
            { name: 'Admin', color: 'RED' },
        ];

        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: 'This command must be run in a server.',
                ephemeral: true,
            });
            return;
        }

        try {
            await interaction.reply('Setting up roles...');
            for (const role of roles) {
                const existingRole = guild.roles.cache.find(r => r.name === role.name);
                if (!existingRole) {
                    await guild.roles.create({
                        name: role.name,
                        color: role.color,
                        reason: 'Basic role setup',
                    });
                }
            }
            await interaction.followUp('Roles have been set up!');
        } catch (error) {
            logError(error, 'setroles');
            await interaction.followUp('An error occurred while setting up roles.');
        }
    },
};
