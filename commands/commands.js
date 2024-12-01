const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('List all available commands.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Read all command files in the 'commands' folder
            const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

            // Separate regular and staff-only commands
            const regularCommands = [];
            const staffCommands = [];

            for (const file of commandFiles) {
                const command = require(`./${file}`);
                if (command.data && command.data.name) {
                    const commandEntry = `\`/${command.data.name}\``;

                    if (command.staffOnly) {
                        staffCommands.push(commandEntry);
                    } else {
                        regularCommands.push(commandEntry);
                    }
                }
            }

            if (regularCommands.length === 0 && staffCommands.length === 0) {
                return interaction.editReply({
                    content: 'No commands found in the command folder.',
                    ephemeral: true,
                });
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle('Commands')
                .setDescription('Here are all the available commands:')
                .setColor(14493993);

            // Add the regular commands field if available
            if (regularCommands.length > 0) {
                embed.addFields({
                    name: 'Command List',
                    value: regularCommands.join('\n'),
                    inline: true,
                });
            }

            // Add the staff commands field if available
            if (staffCommands.length > 0) {
                embed.addFields({
                    name: 'Staff Commands',
                    value: staffCommands.join('\n'),
                    inline: true,
                });
            }

            // Send the embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching commands:', error);
            await interaction.editReply({
                content: 'An error occurred while fetching the command list.',
                ephemeral: true,
            });
        }
    },
};
