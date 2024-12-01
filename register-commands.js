require('dotenv').config(); // Ensure this is at the top of the file

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const fs = require('fs');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error('Error: DISCORD_TOKEN or CLIENT_ID is not set in the .env file.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
