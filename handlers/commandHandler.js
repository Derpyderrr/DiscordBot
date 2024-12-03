const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    client.commands = new Map();
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    }

    console.log(`${client.commands.size} commands loaded.`);
}

module.exports = { loadCommands };
