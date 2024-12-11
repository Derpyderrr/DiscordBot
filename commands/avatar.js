const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

// Utility functions to fetch users
async function GetUser(message, args) {
    try {
        const user = message.mentions.users.first() || 
            message.guild.members.cache.get(args[0])?.user ||
            message.guild.members.cache.find(member => member.user.username.toLowerCase() === args.join(" ").toLowerCase())?.user ||
            message.author;
        return user;
    } catch (error) {
        throw new Error("Unable to fetch user. Please try again.");
    }
}

async function GetGlobalUser(client, args) {
    try {
        const user = await client.users.fetch(args[0]);
        return user;
    } catch (error) {
        throw new Error("Unable to fetch global user. Please provide a valid user ID.");
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to get their avatar.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('scope')
                .setDescription('Choose between global or guild.')
                .setRequired(false)),
    async execute(interaction) {
        const userOption = interaction.options.getUser('target') || interaction.user;
        const scope = interaction.options.getString('scope') || 'guild';

        try {
            let user;
            if (scope.toLowerCase() === 'global') {
                user = await GetGlobalUser(interaction.client, [userOption.id]);
            } else {
                user = await GetUser(interaction, [userOption.id]);
            }

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Avatar of: ${user.tag}`,
                    iconURL: user.displayAvatarURL({ dynamic: true }),
                    url: 'https://discord.gg/FQGXbypRf8'
                })
                .setColor('#00ff00') // Set your desired color
                .addFields([
                    { name: 'PNG', value: `[Link](${user.displayAvatarURL({ format: 'png' })})`, inline: true },
                    { name: 'JPEG', value: `[Link](${user.displayAvatarURL({ format: 'jpg' })})`, inline: true },
                    { name: 'WEBP', value: `[Link](${user.displayAvatarURL({ format: 'webp' })})`, inline: true },
                ])
                .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setFooter({ text: 'Avatar command executed', iconURL: interaction.client.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'An error occurred while fetching the avatar. Please try again.',
                ephemeral: true
            });
        }
    },
};
