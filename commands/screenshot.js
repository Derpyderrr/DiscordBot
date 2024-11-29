const { SlashCommandBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
const { logAndReplyError } = require('../utils/errorLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Takes a screenshot of the given URL.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to screenshot')
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            await interaction.reply({ content: 'Invalid URL! Please provide a valid URL starting with http:// or https://.', ephemeral: true });
            return;
        }

        await interaction.reply('Taking screenshot...');

        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);
            const screenshotBuffer = await page.screenshot();
            await browser.close();

            await interaction.editReply({
                content: 'Here is your screenshot:',
                files: [{ attachment: screenshotBuffer, name: 'screenshot.png' }],
            });
        } catch (error) {
            await logAndReplyError(error, interaction);
        }
    },
};
