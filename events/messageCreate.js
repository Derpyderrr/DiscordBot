const { addXP, checkLevelUp, addCoins } = require('../utils/leveling');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // Add XP and Coins
        const xpGained = 10; // Adjust this value as needed
        const coinGained = 1;
        await addXP(message.author.id, xpGained);
        await addCoins(message.author.id, coinGained);

        // Check for level-up and role assignment
        const leveledUp = await checkLevelUp(message.guild.id, message.author.id);
        if (leveledUp) {
            message.channel.send(`${message.author}, your pet leveled up!`);
        }
    },
};
