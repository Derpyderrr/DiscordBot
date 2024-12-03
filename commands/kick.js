const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to kick.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick.')
                .setRequired(false)),
    async execute(interaction) {
        const member = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            const embed = new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor('RED');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const guildMember = interaction.guild.members.cache.get(member.id);
        if (!guildMember) {
            const embed = new EmbedBuilder()
                .setTitle('Member Not Found')
                .setDescription('The specified member is not in this server.')
                .setColor('ORANGE');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Attempt to kick the member
        try {
            await guildMember.kick(reason);
            const embed = new EmbedBuilder()
                .setTitle('Member Kicked')
                .setDescription(`**${member.tag}** has been kicked.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('GREEN');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occurred while trying to kick the member.')
                .setColor('RED');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    staffOnly: true, // Staff command
};
