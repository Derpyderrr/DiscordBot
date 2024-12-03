const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const ownerId = process.env.OWNER_ID; // Your ID from .env

module.exports = {
    data: new SlashCommandBuilder()
        .setName('story')
        .setDescription('Start a collaborative story!')
        .addIntegerOption(option =>
            option.setName('pages')
                .setDescription('Number of stories (pages) to write.')
                .setMinValue(1)
                .setMaxValue(5)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('theme')
                .setDescription('Theme for the story (e.g., fantasy, sci-fi).')
                .setRequired(false)),
    async execute(interaction) {
        const pages = interaction.options.getInteger('pages') || 1;
        const theme = interaction.options.getString('theme') || 'None';
        const participants = new Map(); // Map to store participants (ID -> User)
        let isStoryCancelled = false; // Track cancellation status
        let story = ''; // The story being built

        const storyTitle = generateRandomTitle(theme); // Generate the story title

        // Initial message to gather participants
        const replyMessage = await interaction.reply({
            content: `Say "I" or react ✅ to join the story! You have 20 seconds. Say "Cancel" to cancel.`,
            fetchReply: true,
        });

        const messageCollector = interaction.channel.createMessageCollector({
            filter: msg => !msg.author.bot,
            time: 20000,
        });

        const reactionCollector = replyMessage.createReactionCollector({
            filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
            time: 20000,
        });

        messageCollector.on('collect', async (message) => {
            if (message.content.toLowerCase() === 'cancel') {
                // Handle cancel request
                await message.reply('Confirm cancel? Y or N');
                const confirmCollector = interaction.channel.createMessageCollector({
                    filter: msg => msg.author.id === message.author.id && !msg.author.bot,
                    time: 10000,
                    max: 1,
                });

                confirmCollector.on('collect', async (confirmation) => {
                    if (confirmation.content.toLowerCase() === 'y') {
                        isStoryCancelled = true;
                        if (story.trim() === '') {
                            await interaction.editReply('Story cancelled.');
                        } else {
                            await interaction.editReply('Story cancelled. Here is the final product so far:');
                            const cancelEmbed = new EmbedBuilder()
                                .setTitle(`Story (Cancelled): ${storyTitle}`)
                                .setDescription(story.trim())
                                .setFooter({ text: 'Story incomplete.' });
                            await interaction.channel.send({ embeds: [cancelEmbed] });
                        }
                        confirmCollector.stop();
                        messageCollector.stop();
                        reactionCollector.stop();
                    } else if (confirmation.content.toLowerCase() === 'n') {
                        await message.reply('Cancellation cancelled. Story proceeding.');
                    }
                });
            } else if (message.content.toLowerCase() === 'i') {
                if (participants.has(message.author.id)) {
                    // User already joined
                    await message.reply({ content: 'You have already joined!', ephemeral: true });
                    await message.delete().catch(() => {});
                    return;
                }

                // Add participant
                participants.set(message.author.id, message.author);
                await message.reply({ content: 'You have joined!', ephemeral: true });
            }
        });

        reactionCollector.on('collect', async (reaction, user) => {
            if (participants.has(user.id)) {
                // User already joined
                await interaction.followUp({ content: 'You have already joined!', ephemeral: true, targetUser: user });
                return;
            }

            // Add participant
            participants.set(user.id, user);
            await interaction.followUp({ content: 'You have joined!', ephemeral: true, targetUser: user });
        });

        messageCollector.on('end', async () => {
            if (isStoryCancelled) return; // Stop if story was cancelled

            reactionCollector.stop(); // Stop the reaction collector

            // Handle insufficient participants
            if (participants.size < 2 && interaction.user.id !== ownerId) {
                return interaction.editReply({
                    content: 'You need more than 1 participant to start the story.',
                });
            }

            // Select the first user to start the story
            const participantArray = Array.from(participants.values());
            const firstUser = participantArray[Math.floor(Math.random() * participantArray.length)];

            // Send starting message
            const startingEmbed = new EmbedBuilder()
                .setTitle(`Starting Story: ${storyTitle}`)
                .setDescription(`**Theme**: ${theme}\n**Started by**: ${interaction.user}\n**First Participant**: ${firstUser}`)
                .setColor(0x00ff00);

            await interaction.channel.send({ embeds: [startingEmbed] });

            // Start the story
            for (let page = 0; page < pages; page++) {
                for (const user of participantArray) {
                    if (isStoryCancelled) break; // Stop if cancelled

                    await interaction.channel.send(`${user}, it's your turn! Add a sentence.`);

                    const userCollector = interaction.channel.createMessageCollector({
                        filter: msg => msg.author.id === user.id && !msg.author.bot,
                        time: 20000,
                        max: 1,
                    });

                    const userResponse = await new Promise((resolve) => {
                        userCollector.on('collect', (msg) => resolve(msg.content));
                        userCollector.on('end', (collected) => {
                            if (collected.size === 0) resolve('...');
                        });
                    });

                    story += ` ${userResponse}`;
                }

                if (page < pages - 1 && !isStoryCancelled) {
                    await interaction.channel.send(`Page ${page + 1} complete. Continuing to the next page...`);
                }
            }

            if (isStoryCancelled) return; // Ensure cancellation is respected

            // Finalize the story
            const embed = new EmbedBuilder()
                .setTitle(`Story: ${storyTitle}`)
                .setDescription(story.trim())
                .setFooter({ text: 'Story complete!' });

            await interaction.channel.send({ embeds: [embed] });
        });
    },
};

/**
 * Generates a random story title.
 * @param {string} theme - The theme of the story, if provided.
 * @returns {string} A dynamically generated title.
 */
function generateRandomTitle(theme) {
    const prefixes = ['The Adventure of', 'The Mystery of', 'The Chronicles of', 'A Journey to'];
    const descriptors = ['an Enchanted Land', 'a Forgotten World', 'the Last Kingdom', 'the Lost City'];
    const suffixes = ['in Chaos', 'of Dreams', 'and Shadows', 'Beyond Time'];

    // Create a title based on the theme if provided
    if (theme && theme !== 'None') {
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${theme.charAt(0).toUpperCase() + theme.slice(1)} ${randomSuffix}`;
    }

    // Generate a fully random title
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
    return `${randomPrefix} ${randomDescriptor}`;
}
