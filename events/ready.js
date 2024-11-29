module.exports = {
    name: 'ready',
    execute(client) {
        console.log(`${client.user.tag} is online!`);
        client.user.setActivity('with Discord.js', { type: 'PLAYING' });
    },
};
