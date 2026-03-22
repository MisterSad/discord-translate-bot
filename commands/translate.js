const { SlashCommandBuilder } = require('discord.js');
const { deepLTranslate } = require('../deepl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text into another language')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The text you want to translate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('target')
                .setDescription('The target language code (e.g. EN, FR, ES, DE, etc.)')
                .setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const targetLang = interaction.options.getString('target');

        await interaction.deferReply(); // Gives API time to respond

        try {
            const res = await deepLTranslate(text, targetLang);
            await interaction.editReply(`**Original (${res.detectedSourceLang})**: ${text}\n**Translation (${targetLang.toUpperCase()})**: ${res.text}`);
        } catch (error) {
            console.error('Translation error:', error);
            await interaction.editReply('Sorry, there was an error with the translation service. Check the language code and your DeepL API key.');
        }
    },
};
