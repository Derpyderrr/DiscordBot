require('dotenv').config();

module.exports = {
    botToken: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    ownerId: process.env.OWNER_ID,
    dbPath: './database/db.sqlite',
};
