require('dotenv').config();
const http = require('http');

// Minimal HTTP server required by Render's free Web Service plan
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});
server.listen(process.env.PORT || 3000, () => {
    console.log(`Health check server listening on port ${process.env.PORT || 3000}`);
});


const { Client, GatewayIntentBits, Collection, Events, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

const { deepLTranslate } = require('./deepl');
const flagMappings = require('./flags-mapping');

// Rate limiting: prevent a user from spamming translations on the same message
const reactionCooldowns = new Map();

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    if (user.bot) return; // Ignore reactions from bots

    const emojiName = reaction.emoji.name;
    const targetLang = flagMappings[emojiName];

    if (targetLang) {
        const messageContent = reaction.message.content;

        if (!messageContent) return; // Ignore empty messages (e.g., just images)

        // Rate limiting: 10-second cooldown per user / message / language
        const cooldownKey = `${user.id}:${reaction.message.id}:${targetLang}`;
        if (reactionCooldowns.has(cooldownKey)) return;
        reactionCooldowns.set(cooldownKey, true);
        setTimeout(() => reactionCooldowns.delete(cooldownKey), 10_000);

        try {
            const res = await deepLTranslate(messageContent, targetLang);

            // Send the translation as a reply to the original message
            await reaction.message.reply({
                content: `**Translation to ${emojiName} requested by ${user.username}:**\n${res.text}`,
                allowedMentions: { repliedUser: false } // Prevent pinging the original author
            });
        } catch (error) {
            console.error('Translation error via reaction:', error);
            // Optionally notify the user who reacted that it failed
            try {
                await user.send(`Sorry, I couldn't translate that message to ${emojiName}.`);
            } catch (e) {
                // User might have DMs closed
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
