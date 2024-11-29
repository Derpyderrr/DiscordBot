/**
 * Logs an error to the console and informs the user about the issue.
 * @param {Error} error - The error object.
 * @param {Interaction} interaction - The interaction that caused the error.
 */
async function logAndReplyError(error, interaction) {
    console.error(`Error in command "${interaction.commandName}":`, error);
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'An unexpected error occurred.', ephemeral: true });
    } else {
        await interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
    }
}

module.exports = { logAndReplyError };
