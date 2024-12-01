const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { setupDatabase } = require('./utils/database');
const { logError } = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const { setupReactionRoleListeners } = require('./commands/reactionroles.js'); // Import reaction role listeners

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions, // Required for reaction roles
        GatewayIntentBits.GuildMembers, // Required to manage roles
    ],
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Dynamically load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

// Dynamically load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Database setup
setupDatabase(process.env.DB_PATH || './database/db.sqlite');

// Bot is ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online and ready!`);
    client.user.setPresence({
        activities: [{ name: 'with myself', type: ActivityType.Playing }],
        status: 'online',
    });

    // Register reaction role listeners
    setupReactionRoleListeners(client);
    console.log('Reaction role listeners set up.');
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logError('Unhandled Rejection', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logError('Uncaught Exception', error);
});

// Handle client errors
client.on('error', errorHandler);
client.on('shardError', errorHandler);

// Add debug and warning handlers
client.on('warn', (info) => console.warn('Warning:', info));
client.on('debug', (info) => console.debug('Debug:', info));

// Start the bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Failed to log in:', err);
    logError('Login Error', err);
});
