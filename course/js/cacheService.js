import { TARGET_LANGUAGE_CODE as CONFIG_TARGET_LANGUAGE_CODE } from './config.js';

// Note: `this` in these functions will refer to the Alpine component instance

export async function preloadCache() {
    console.log('[cacheService] Preloading complete word details for all words...');
    this.wordDetailsCache = new Map();

    const wordIds = this.allWordsFlat.map(w => w.id);
    if (wordIds.length === 0) return;

    const placeholders = wordIds.map(() => '?').join(',');

    // Load all related data in batch
    const translationsMap = this.loadTranslationsBatch(wordIds, placeholders);
    const examplesByWord = this.loadExamplesBatch(wordIds, placeholders);
    const conversationsByWord = this.loadConversationsBatch(wordIds, placeholders);
    const clipsByWord = this.loadClipsBatch(wordIds, placeholders);

    // Load translation maps for examples and conversations
    const exampleTranslationsMap = this.loadExampleTranslationsBatch(examplesByWord);
    const convTranslationsMap = this.loadConversationTranslationsBatch(conversationsByWord);

    // Build complete word details cache
    this.buildWordDetailsCache(translationsMap, examplesByWord, conversationsByWord, clipsByWord, exampleTranslationsMap, convTranslationsMap);

    console.log('[cacheService] Preloaded complete details for', this.wordDetailsCache.size, 'words');
}

export function loadTranslationsBatch(wordIds, placeholders) {
    const translationsQuery = `SELECT words_id, translation FROM words_translations WHERE words_id IN (${placeholders}) AND language_code = ?`;
    const translations = this.executeQuery(translationsQuery, [...wordIds, CONFIG_TARGET_LANGUAGE_CODE]) || [];
    return new Map(translations.map(t => [t.words_id, t.translation]));
}

export function loadExamplesBatch(wordIds, placeholders) {
    const examplesQuery = `SELECT * FROM examples WHERE word_id IN (${placeholders})`;
    const examples = this.executeQuery(examplesQuery, wordIds) || [];
    return examples.reduce((acc, ex) => {
        if (!acc[ex.word_id]) acc[ex.word_id] = [];
        acc[ex.word_id].push(ex);
        return acc;
    }, {});
}

export function loadConversationsBatch(wordIds, placeholders) {
    const conversationsQuery = `SELECT * FROM conversation_lines WHERE word_id IN (${placeholders}) ORDER BY id`;
    const conversations = this.executeQuery(conversationsQuery, wordIds) || [];
    return conversations.reduce((acc, conv) => {
        if (!acc[conv.word_id]) acc[conv.word_id] = [];
        acc[conv.word_id].push(conv);
        return acc;
    }, {});
}

export function loadClipsBatch(wordIds, placeholders) {
    const clipsQuery = `SELECT * FROM clips WHERE word_id IN (${placeholders})`;
    const clips = this.executeQuery(clipsQuery, wordIds) || [];
    return clips.reduce((acc, clip) => {
        if (!acc[clip.word_id]) acc[clip.word_id] = [];
        acc[clip.word_id].push(clip);
        return acc;
    }, {});
}

export function loadExampleTranslationsBatch(examplesByWord) {
    const allExamples = Object.values(examplesByWord).flat();
    if (allExamples.length === 0) return new Map();

    const exampleIds = allExamples.map(ex => ex.id);
    const examplePlaceholders = exampleIds.map(() => '?').join(',');
    const exampleTranslationsQuery = `SELECT example_id, translation FROM example_translations WHERE example_id IN (${examplePlaceholders}) AND language_code = ?`;
    const exampleTranslations = this.executeQuery(exampleTranslationsQuery, [...exampleIds, CONFIG_TARGET_LANGUAGE_CODE]) || [];
    return new Map(exampleTranslations.map(t => [t.example_id, t.translation]));
}

export function loadConversationTranslationsBatch(conversationsByWord) {
    const allConversations = Object.values(conversationsByWord).flat();
    if (allConversations.length === 0) return new Map();

    const conversationIds = allConversations.map(conv => conv.id);
    const convPlaceholders = conversationIds.map(() => '?').join(',');
    const convTranslationsQuery = `SELECT conversation_line_id, translation FROM conversation_line_translations WHERE conversation_line_id IN (${convPlaceholders}) AND language_code = ?`;
    const convTranslations = this.executeQuery(convTranslationsQuery, [...conversationIds, CONFIG_TARGET_LANGUAGE_CODE]) || [];
    return new Map(convTranslations.map(t => [t.conversation_line_id, t.translation]));
}

export function buildWordDetailsCache(translationsMap, examplesByWord, conversationsByWord, clipsByWord, exampleTranslationsMap, convTranslationsMap) {
    this.allWordsFlat.forEach(wordData => {
        const wordId = wordData.id;
        const wordExamples = examplesByWord[wordId] || [];
        const wordConversations = conversationsByWord[wordId] || [];
        const wordClips = clipsByWord[wordId] || [];

        // Process example sentences
        const exampleSentences = wordExamples.map(example => ({
            english: example.text,
            translation: exampleTranslationsMap.get(example.id),
            audioSrc: example.audio_data
        }));

        // Process conversations
        const conversationLines = wordConversations.map(convo => ({
            speaker: convo.speaker_label || 'Speaker',
            line: convo.text,
            translatedLine: convTranslationsMap.get(convo.id),
            audioSrc: convo.audio_data,
            lineOrder: convo.line_order,
            dbId: convo.id
        }));

        // Group conversations by line_order resets
        const conversationGroups = this.groupConversationLinesForCache(conversationLines);

        // Cache complete word details
        this.wordDetailsCache.set(wordId, {
            id: wordData.id,
            term: wordData.term,
            definition: wordData.definition,
            translation: translationsMap.get(wordId) || wordData.translation,
            pronunciation: wordData.pronunciation,
            audioSrc: wordData.audio_data,
            exampleSentences,
            conversation: conversationGroups.map(group => ({ lines: group })),
            clips: wordClips,
            notes: wordData.notes
        });
    });
}

export function groupConversationLinesForCache(conversationLines) {
    const conversationGroups = [];
    let currentGroup = [];
    let lastLineOrder = -1;

    conversationLines.forEach((line) => {
        if (line.lineOrder === 0 || line.lineOrder < lastLineOrder) {
            if (currentGroup.length > 0) {
                conversationGroups.push([...currentGroup]);
                currentGroup = [];
            }
        }
        currentGroup.push(line);
        lastLineOrder = line.lineOrder;
    });

    if (currentGroup.length > 0) {
        conversationGroups.push(currentGroup);
    }

    conversationGroups.forEach(group => {
        group.sort((a, b) => (a.lineOrder || 0) - (b.lineOrder || 0));
    });

    return conversationGroups;
}

export function getWordDetails(wordId) {
    return this.wordDetailsCache.get(wordId);
} 