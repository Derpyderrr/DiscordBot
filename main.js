const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import utility modules
const { logError } = require('./utils/logger');
const { setupDatabase } = require('./utils/database');
const { errorHandler } = require('./utils/errorHandler');

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

// Load events dynamically
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    const eventName = event.name || file.split('.')[0];
    client.on(eventName, (...args) => event.execute(...args, client));
}

// Initialize the database
setupDatabase(process.env.DB_PATH || './database/db.sqlite');

// Log in to Discord
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
    client.user.setPresence({
        activities: [{ name: 'Discord bot development', type: ActivityType.Watching }],
        status: 'online',
    });
    console.log(`${client.user.tag} is now online and ready to use.`);
});

// Add global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logError('unhandledRejection', reason); // Optional: Log to your logger utility
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    logError('uncaughtException', error); // Optional: Log to your logger utility
});

// Add error event listener for the client
client.on('error', errorHandler);
client.on('shardError', errorHandler);

console.log('Loaded token:', process.env.DISCORD_TOKEN);

// Start the bot
client.login(process.env.DISCORD_TOKEN);
