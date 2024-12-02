const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const punctuationFixer = require('punctuation-fixer'); // Example library; replace if needed

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
                .setDescription('Theme for the story (e.g., fantasy, sci-fi, horror).')
                .setRequired(false)),
    async execute(interaction) {
        const pages = interaction.options.getInteger('pages') || 1;
        const theme = interaction.options.getString('theme') || 'random';
        const participants = new Set();

        await interaction.reply({
            content: 'Say "I" or react ✅ to join the story! You have 20 seconds.',
        });

        // Collect participants
        const filter = m => m.content.toLowerCase() === 'i' && !m.author.bot;
        const reactionFilter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;

        const messageCollector = interaction.channel.createMessageCollector({ filter, time: 20000 });
        const reactionCollector = interaction.channel.createReactionCollector({ filter: reactionFilter, time: 20000 });

        messageCollector.on('collect', message => {
            participants.add(message.author);
        });

        reactionCollector.on('collect', (reaction, user) => {
            participants.add(user);
        });

        return new Promise((resolve) => {
            setTimeout(async () => {
                messageCollector.stop();
                reactionCollector.stop();

                if (participants.size === 0) {
                    await interaction.editReply({
                        content: 'No participants joined. The story will not begin.',
                    });
                    return resolve();
                }

                let currentPage = 1;
                let fullStory = '';
                let usedParticipants = [];

                const writeStory = async () => {
                    const embed = new EmbedBuilder()
                        .setTitle(`Story ${currentPage} (${theme})`)
                        .setColor(0x7289da)
                        .setDescription('The story begins...')
                        .setFooter({ text: 'Next up: TBD' });

                    let story = [];
                    let availableParticipants = Array.from(participants);

                    for (let i = 0; i < participants.size; i++) {
                        const nextUser = availableParticipants.splice(
                            Math.floor(Math.random() * availableParticipants.length),
                            1
                        )[0];
                        usedParticipants.push(nextUser);

                        embed.setFooter({ text: `Next up: ${nextUser.tag}` });
                        await interaction.channel.send({
                            embeds: [embed],
                            content: `${nextUser}, it's your turn! Add the next sentence.`,
                        });

                        // Wait for the user's response
                        const userFilter = m => m.author.id === nextUser.id && !m.author.bot;
                        const userCollector = interaction.channel.createMessageCollector({ filter: userFilter, time: 20000 });

                        const userMessage = await new Promise((resolve) => {
                            userCollector.on('collect', message => {
                                resolve(message.content);
                                userCollector.stop();
                            });

                            userCollector.on('end', (collected) => {
                                if (collected.size === 0) {
                                    resolve('The participant was unavailable.');
                                }
                            });
                        });

                        story.push(userMessage);
                        embed.setDescription(story.join(' '));
                    }

                    // Finalize the story
                    const finalizedStory = punctuationFixer.fix(story.join(' '));
                    fullStory += `\n\nPage ${currentPage}:\n${finalizedStory}`;

                    if (currentPage < pages) {
                        await interaction.channel.send(`Page ${currentPage} complete! Starting the next page...`);
                        currentPage++;
                        usedParticipants = [];
                        availableParticipants = Array.from(participants);
                        await writeStory();
                    } else {
                        // Final output
                        const finalEmbed = new EmbedBuilder()
                            .setTitle(embed.title)
                            .setDescription(fullStory)
                            .setFooter({ text: 'Story complete!' })
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

                        await interaction.channel.send({
                            content: `Story finished! Here's the complete story:`,
                            embeds: [finalEmbed],
                        });

                        resolve();
                    }
                };

                await interaction.editReply({
                    content: `${participants.size} participants joined! Starting the story...`,
                });

                writeStory();
            }, 20000);
        });
    },
};
