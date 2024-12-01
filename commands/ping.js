const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        try {
            // Send the initial "Pinging..." message
            const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

            // Calculate the latency
            const latency = sent.createdTimestamp - interaction.createdTimestamp;

            // Construct the embed
            const embed = new EmbedBuilder()
                .setDescription(`Pong! \`${latency}ms\``)
                .setColor(null); // Set to a hex color code for a specific color

            // Edit the message to replace "Pinging..." with "Pong!" and the embed
            await interaction.editReply({ content: 'Pong!', embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
        }
    },
};
