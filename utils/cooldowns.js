function checkCooldown(client, interaction) {
    const { commandName } = interaction;
    const cooldowns = client.cooldowns;

    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }

    const timestamps = cooldowns.get(commandName);
    const now = Date.now();
    const cooldownAmount = 3000; // 3 seconds

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more seconds.`, ephemeral: true });
            return false;
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    return true;
}

module.exports = { checkCooldown };
