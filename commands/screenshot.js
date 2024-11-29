const puppeteer = require('puppeteer');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'screenshot', // Command name for the prefix command
    async execute(message, url) {
        if (!isValidURL(url)) {
            message.reply('Please provide a valid URL.');
            return;
        }

        try {
            const screenshotBuffer = await takeScreenshot(url);
            const screenshotSizeKB = (screenshotBuffer.length / 1024).toFixed(2);

            const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'screenshot.png' });

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: message.author.username,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setTitle("Here's your screenshot")
                .setImage('attachment://screenshot.png')
                .setColor(0x00aeff)
                .setFooter({ text: `Screenshot size: ${screenshotSizeKB} KB` })
                .setTimestamp();

            await message.reply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error('Error taking screenshot:', error);
            message.reply('Failed to capture the screenshot. Please try again later.');
        }
    },
};

// Validate URL
function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Puppeteer logic for taking a screenshot
async function takeScreenshot(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
        const screenshot = await page.screenshot();
        console.log('Screenshot captured, size:', screenshot.length);
        await browser.close();
        return screenshot;
    } catch (error) {
        await browser.close();
        console.error('Error in Puppeteer:', error);
        throw error;
    }
}
