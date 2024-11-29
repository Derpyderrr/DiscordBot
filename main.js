const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config(); // Load environment variables
const config = {
    botToken: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    ownerId: process.env.OWNER_ID,
    dbPath: './database/db.sqlite', // Adjust this path as needed
};
const { setupDatabase } = require('./utils/database');

if (!config.botToken) {
    console.error('ERROR: Bot token is missing in the configuration.');
    process.exit(1);
}

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
        if (!command.data?.name) {
            console.warn(`The command file "${file}" is missing a "data.name" property.`);
            continue;
        }
        client.commands.set(command.data.name, command);
    } catch (error) {
        console.error(`Error loading command file "${file}":`, error);
    }
}

// Load events dynamically
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        const eventName = file.split('.')[0];
        if (event.once) {
            client.once(eventName, (...args) => event.execute(...args, client));
        } else {
            client.on(eventName, (...args) => event.execute(...args, client));
        }
    } catch (error) {
        console.error(`Error loading event file "${file}":`, error);
    }
}

// Handle interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        await interaction.reply({ content: 'Command not found.', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command "${interaction.commandName}":`, error);
        await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
});

client.once('ready', () => {
    console.log(`${client.user.tag} is now online and ready to use.`);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
    console.log('Shutting down bot...');
    client.destroy();
    process.exit(0);
});

// Initialize the database
try {
    setupDatabase(config.dbPath);
    console.log('Database initialized successfully.');
} catch (error) {
    console.error('Error initializing the database:', error);
}

// Login to Discord
client.login(config.botToken);
