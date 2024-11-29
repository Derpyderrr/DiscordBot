const { logError } = require('../utils/logger');
const { checkCooldown } = require('../utils/cooldowns');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if (!checkCooldown(client, interaction)) return;
            await command.execute(interaction);
        } catch (error) {
            logError(error, interaction.commandName);
            await interaction.reply({
                content: 'There was an error executing this command.',
                ephemeral: true,
            });
        }
    },
};
