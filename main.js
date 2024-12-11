const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { setupDatabase } = require('./utils/database');
const { errorHandler } = require('./handlers/errorHandler');

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
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

console.log(`${commandFiles.length} commands loaded.`);

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

console.log(`${eventFiles.length} events loaded.`);

// Initialize the database
setupDatabase();

// Bot ready event
client.once('ready', () => {
    console.log(`${client.user.tag} is online and ready!`);
    client.user.setPresence({
        activities: [{ name: 'with myself!', type: ActivityType.Playing }],
        status: 'online',
    });
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', promise, 'Reason:', reason);
    errorHandler(reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    errorHandler(error);
});

// Start the bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Login failed:', err);
    errorHandler(err);
});
