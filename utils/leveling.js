const db = require('./database'); // Your database utility

// Add XP to user
async function addXP(userId, amount) {
    const user = await db.getUser(userId);
    user.xp += amount;
    await db.updateUser(userId, user);
}

// Add coins to wallet
async function addCoins(userId, amount) {
    const user = await db.getUser(userId);
    user.coins += amount;
    await db.updateUser(userId, user);
}

// Check if user leveled up
async function checkLevelUp(serverId, userId) {
    const user = await db.getUser(userId);
    const settings = await db.getServerSettings(serverId);

    const xpForNextLevel = 100 + (user.level - 1) * 50; // Incremental XP for levels
    if (user.xp >= xpForNextLevel) {
        user.level += 1;
        user.xp -= xpForNextLevel;

        // Assign roles based on level
        const levelRoles = settings.levelRoles || [];
        for (const { level, roleId, removePrevious } of levelRoles) {
            if (user.level === level) {
                const guild = await client.guilds.fetch(serverId);
                const member = await guild.members.fetch(userId);
                await member.roles.add(roleId);

                if (removePrevious) {
                    const previousRole = levelRoles.find(r => r.level === user.level - 1)?.roleId;
                    if (previousRole) await member.roles.remove(previousRole);
                }
            }
        }

        // Save updates
        await db.updateUser(userId, user);
        return true;
    }
    return false;
}

module.exports = { addXP, addCoins, checkLevelUp };
