const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, Colors } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setroles')
        .setDescription('Automatically ensures predefined roles with specific permissions are created'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        // Define the roles to be checked and created
        const roles = [
            {
                name: 'Owner',
                permissions: [PermissionsBitField.Flags.Administrator],
                color: Colors.Red,
            },
            {
                name: 'Manager',
                permissions: [
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ManageRoles,
                    PermissionsBitField.Flags.KickMembers,
                    PermissionsBitField.Flags.BanMembers,
                    PermissionsBitField.Flags.ManageMessages,
                ],
                color: Colors.Blue,
            },
            {
                name: 'Staff',
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.MuteMembers,
                    PermissionsBitField.Flags.DeafenMembers,
                    PermissionsBitField.Flags.MoveMembers,
                    PermissionsBitField.Flags.ManageNicknames,
                ],
                color: Colors.Green,
            },
            {
                name: 'Member',
                permissions: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks,
                ],
                color: Colors.Grey,
            },
        ];

        try {
            const missingRoles = [];

            // Check and create missing roles
            for (const role of roles) {
                const existingRole = guild.roles.cache.find(r => r.name === role.name);

                if (!existingRole) {
                    const newRole = await guild.roles.create({
                        name: role.name,
                        permissions: role.permissions,
                        color: role.color,
                        reason: `Restored by /setroles command`,
                    });

                    missingRoles.push(newRole.name);
                }
            }

            // Respond based on the roles that were restored or already existed
            if (missingRoles.length === 0) {
                return interaction.editReply('Roles already exist!');
            } else {
                return interaction.editReply(`Roles restored: ${missingRoles.join(', ')}`);
            }
        } catch (error) {
            console.error(error);
            return interaction.editReply('An error occurred while ensuring roles exist.');
        }
    },
};
