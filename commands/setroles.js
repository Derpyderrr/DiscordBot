const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setroles')
        .setDescription('Sets up basic roles in the server.'),
    async execute(interaction) {
        const guild = interaction.guild;

        if (!guild) {
            return await interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
        }

        try {
            // Properly defer the reply to avoid the 3-second timeout
            await interaction.deferReply({ ephemeral: true });

            const roles = [
                { name: 'Member', color: 'BLUE' },
                { name: 'Moderator', color: 'GREEN' },
                { name: 'Admin', color: 'RED' },
            ];

            for (const role of roles) {
                const existingRole = guild.roles.cache.find(r => r.name === role.name);
                if (existingRole) {
                    console.log(`Role "${role.name}" already exists.`);
                    continue;
                }

                await guild.roles.create({
                    name: role.name,
                    color: role.color,
                    reason: 'Basic role setup',
                });
                console.log(`Role "${role.name}" created.`);
            }

            // Edit the deferred reply to indicate success
            await interaction.editReply('Basic roles have been set up successfully!');
        } catch (error) {
            console.error('Error in /setroles command:', error);

            // Edit the deferred reply to indicate failure
            await interaction.editReply('An error occurred while setting up roles. Please check the bot\'s permissions.');
        }
    },
};
