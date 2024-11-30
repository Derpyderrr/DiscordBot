const { REST } = require('@discordjs/rest');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.get('/oauth2/applications/@me')
    .then(() => console.log('Token is valid!'))
    .catch(err => console.error('Token is invalid:', err));
