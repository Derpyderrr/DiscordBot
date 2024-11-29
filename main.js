const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config');
const { setupDatabase } = require('./utils/database');
const { errorHandler } = require('./utils/errorHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Load commands dynamically
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if (!command.data || !command.data.name) {
            console.warn(`Command file "${file}" is missing a required "data.name" property.`);
            continue;
        }
        client.commands.set(command.data.name, command);
    } catch (error) {
        console.error(`Error loading command file "${file}":`, error.message);
    }
}

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        await interaction.reply({ content: 'Command not found!', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command "${interaction.commandName}":`, error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Initialize database
setupDatabase(config.dbPath);

// Handle client events
client.on('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

client.on('error', errorHandler);

// Login to Discord
client.login(config.botToken);
