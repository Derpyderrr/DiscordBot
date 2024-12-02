const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('List all available commands.'),
    async execute(interaction) {
        try {
            const commandsPath = path.join(__dirname, './');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            const regularCommands = [];
            const staffCommands = [];

            for (const file of commandFiles) {
                const command = require(path.join(commandsPath, file));
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
                return interaction.reply({
                    content: 'No commands found in the command folder.',
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('Commands')
                .setDescription('Here are all the available commands:')
                .setColor(0x2F3136);

            if (regularCommands.length > 0) {
                embed.addFields({
                    name: 'Regular Commands',
                    value: regularCommands.join('\n'),
                    inline: true,
                });
            }

            if (staffCommands.length > 0) {
                embed.addFields({
                    name: 'Staff Commands',
                    value: staffCommands.join('\n'),
                    inline: true,
                });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing /commands:', error);
            await interaction.reply({
                content: 'An error occurred while fetching the commands. Please try again later.',
            });
        }
    },
    staffOnly: false,
};
