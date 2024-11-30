const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' }); // Explicitly specify the .env file path

// Debug to confirm environment variables are loaded
if (!process.env.DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN is not set in the .env file.');
    process.exit(1); // Exit the process if the token is missing
}
if (!process.env.CLIENT_ID) {
    console.error('Error: CLIENT_ID is not set in the .env file.');
    process.exit(1); // Exit the process if the client ID is missing
}
if (!process.env.OWNER_ID) {
    console.warn('Warning: OWNER_ID is not set in the .env file. Certain features may not work.');
}

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
    try {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

// Load events dynamically
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try {
        const event = require(path.join(eventsPath, file));
        const eventName = event.name || file.split('.')[0];
        client.on(eventName, (...args) => event.execute(...args, client));
    } catch (error) {
        console.error(`Error loading event ${file}:`, error);
    }
}

// Initialize the database
try {
    setupDatabase(process.env.DB_PATH || './database/db.sqlite');
    console.log('Database initialized successfully.');
} catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1); // Exit the process if the database setup fails
}

// Client is ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
    client.user.setPresence({
        activities: [{ name: 'with myself', type: ActivityType.PLAYING}],
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
client.on('error', (error) => {
    console.error('Client error:', error);
    logError('clientError', error);
});
client.on('shardError', (error) => {
    console.error('Shard error:', error);
    logError('shardError', error);
});

// Debug loaded token
console.log('Loaded token:', process.env.DISCORD_TOKEN ? 'Token exists' : 'Token missing');

// Start the bot
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to log in:', error);
    process.exit(1); // Exit the process if the login fails
});
