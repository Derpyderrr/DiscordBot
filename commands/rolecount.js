const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolecount')
        .setDescription('Counts members with a specific role')
        .addStringOption(option =>
            option
                .setName('role')
                .setDescription('The exact name of the role to count')
                .setRequired(true)
        ),
    async execute(interaction) {
        const roleName = interaction.options.getString('role'); // Get role name from command input
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
        }

        // Find the role by its name
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            return interaction.reply({
                content: `Role "${roleName}" not found. Please make sure the name is correct.`,
                ephemeral: true,
            });
        }

        // Get members with the role
        const membersWithRole = role.members.map(member => member.user);
        const memberCount = membersWithRole.length;

        // Get the last person who obtained the role from the audit logs
        let lastObtainedUser = 'Unknown';
        try {
            const auditLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: 25, // MEMBER_ROLE_UPDATE
            });
            const logEntry = auditLogs.entries.find(entry =>
                entry.changes.some(change => change.key === '$add' && change.new.some(r => r.id === role.id))
            );
            if (logEntry) {
                lastObtainedUser = logEntry.target.tag || 'Unknown';
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }

        // Format the list of users with the role
        const userList = membersWithRole.length
            ? membersWithRole.map(user => `${user.tag}`).join('\n')
            : 'No users currently have this role.';

        // Construct the embed
        const embed = new EmbedBuilder()
            .setTitle(`Rolecount for "${role.name}"`)
            .setColor(role.color || null)
            .addFields(
                {
                    name: 'Info',
                    value: `Users have this role**: ${memberCount}\nThe last person to obtain this role was **${lastObtainedUser}**`,
                },
                {
                    name: 'Users with this role',
                    value: userList,
                }
            )
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL(),
            });

        // Send the embed as a response
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: false, // Staff command
};
