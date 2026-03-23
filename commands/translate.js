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

        // --- Input validation ---
        if (text.length > 2000) {
            return interaction.reply({ content: '❌ Text is too long (max 2000 characters).', ephemeral: true });
        }

        const validLangPattern = /^[A-Za-z]{2}(-[A-Za-z]{2,4})?$/;
        if (!validLangPattern.test(targetLang)) {
            return interaction.reply({ content: '❌ Invalid language code. Use codes like `EN`, `FR`, `DE`, `PT-BR`, etc.', ephemeral: true });
        }

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
