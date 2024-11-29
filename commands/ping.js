const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        try {
            await interaction.reply('Pong!');
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
        }
    },
};
