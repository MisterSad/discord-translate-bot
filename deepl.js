const axios = require('axios');

/**
 * Translates text using the DeepL free API.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The target language code (e.g. 'EN', 'FR', 'DE').
 * @returns {Promise<{text: string, detectedSourceLang: string}>}
 */
async function deepLTranslate(text, targetLang) {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) throw new Error('DEEPL_API_KEY is not set in environment variables.');

    // DeepL language codes are uppercase
    const normalizedTarget = targetLang.toUpperCase();

    const response = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        new URLSearchParams({
            text,
            target_lang: normalizedTarget,
        }),
        {
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    const translation = response.data.translations[0];
    return {
        text: translation.text,
        detectedSourceLang: translation.detected_source_language.toLowerCase(),
    };
}

module.exports = { deepLTranslate };
