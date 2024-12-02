const { SlashCommandBuilder } = require('@discordjs/builders');
const puppeteer = require('puppeteer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Takes a screenshot of the given URL.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to screenshot')
                .setRequired(true)
        ),
    async execute(interaction) {
        const url = interaction.options.getString('url');

        try {
            await interaction.deferReply(); // Acknowledge the command

            if (!url.startsWith('http')) {
                return await interaction.editReply('Invalid URL. Please provide a valid URL starting with http:// or https://');
            }

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);

            const screenshot = await page.screenshot();
            await browser.close();

            await interaction.editReply({ files: [{ attachment: screenshot, name: 'screenshot.png' }] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('There was an error taking the screenshot. Please try again later.');
        }
    },
    staffOnly: false, // Mark this as a regular command
};
