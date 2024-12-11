const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vcsettings')
        .setDescription('Customize your dynamically created voice channel settings.'),
    async execute(interaction) {
        const { guild, member, channel } = interaction;

        if (!channel || channel.type !== 2 || !channel.name.includes(member.user.username)) {
            const embed = new EmbedBuilder()
                .setTitle('VC settings invalid.')
                .setDescription(`Please join "join2create" (or your dynamically created VC) to use this command.`)
                .setColor(Math.floor(Math.random() * 16777215));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('VC Settings!')
            .setDescription(`**${channel.name}**\n🔓 - VC unlocked or 🔒 - VC locked\nAllowed to join \`#\`\nMembers in VC \`#\`\nVC Owner is <@${member.user.id}>`)
            .setColor(Math.floor(Math.random() * 16777215));

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('vcsettings_menu')
                    .setPlaceholder('Choose an option')
                    .addOptions([
                        {
                            label: '🔐 Lock/Unlock channel',
                            value: 'lock_unlock',
                        },
                        {
                            label: '🛗 Set user limit',
                            value: 'set_limit',
                        },
                        {
                            label: '🔤 Change VC name',
                            value: 'change_name',
                        },
                    ]),
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === member.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 20000 });

        collector.on('collect', async i => {
            if (i.customId === 'vcsettings_menu') {
                const value = i.values[0];

                switch (value) {
                    case 'lock_unlock':
                        const locked = channel.permissionOverwrites.cache.some(perm => perm.deny.has(PermissionsBitField.Flags.Connect));
                        await channel.permissionOverwrites.set([
                            {
                                id: guild.roles.everyone.id,
                                deny: locked ? [] : [PermissionsBitField.Flags.Connect],
                            },
                        ]);
                        await i.update({
                            embeds: [new EmbedBuilder().setDescription(`Channel ${locked ? '🔓' : '🔒'}`).setColor(Math.floor(Math.random() * 16777215))],
                        });
                        break;

                    case 'set_limit':
                        await i.update({
                            embeds: [new EmbedBuilder().setDescription('Choose a user limit or type "infinite"').setColor(Math.floor(Math.random() * 16777215))],
                        });

                        const userMessage = await interaction.channel.awaitMessages({ filter, max: 1, time: 20000 });
                        const response = userMessage.first()?.content.toLowerCase();
                        const limit = response === 'infinite' ? 0 : parseInt(response, 10);

                        if (!isNaN(limit) && limit >= 0) {
                            await channel.setUserLimit(limit);
                            await interaction.followUp({
                                embeds: [new EmbedBuilder().setDescription(`User limit set to ${response === 'infinite' ? 'infinite' : limit}`).setColor(Math.floor(Math.random() * 16777215))],
                                ephemeral: true,
                            });
                        } else {
                            await interaction.followUp('Invalid input. Try again.');
                        }
                        break;

                    case 'change_name':
                        await i.update({
                            embeds: [new EmbedBuilder().setDescription('What would you like your VC name to be?').setColor(Math.floor(Math.random() * 16777215))],
                        });

                        const nameResponse = await interaction.channel.awaitMessages({ filter, max: 1, time: 20000 });
                        const newName = nameResponse.first()?.content;

                        if (newName) {
                            await channel.setName(newName);
                            await interaction.followUp({
                                embeds: [new EmbedBuilder().setDescription(`Channel name set to ${newName}`).setColor(Math.floor(Math.random() * 16777215))],
                                ephemeral: true,
                            });
                        }
                        break;
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'No option selected. Interaction ended.', ephemeral: true });
            }
        });
    },
};
