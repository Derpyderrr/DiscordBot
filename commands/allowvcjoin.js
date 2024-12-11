const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allowvc')
        .setDescription('Allow a user to join your private VC.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to allow into your VC.')
                .setRequired(true),
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const { member, channel } = interaction;

        if (!channel || channel.type !== 2 || !channel.name.includes(member.user.username)) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setTitle('VC settings invalid.').setDescription('You must be in your VC to use this command.').setColor(Math.floor(Math.random() * 16777215))],
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Invite to VC')
            .setDescription(`<@${user.id}>, would you like to join **${channel.name}**?`)
            .setColor(Math.floor(Math.random() * 16777215));

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('accept').setLabel('✅').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('decline').setLabel('❌').setStyle(ButtonStyle.Danger),
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 20000 });

        collector.on('collect', async i => {
            if (i.customId === 'accept') {
                await user.voice.setChannel(channel);
                await i.update({ embeds: [new EmbedBuilder().setDescription('User has been moved.').setColor(Math.floor(Math.random() * 16777215))], components: [] });
            } else if (i.customId === 'decline') {
                await i.update({ embeds: [new EmbedBuilder().setDescription('The user declined.').setColor(Math.floor(Math.random() * 16777215))], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'No response received. Interaction ended.', components: [] });
            }
        });
    },
};
