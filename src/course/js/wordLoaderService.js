import { TARGET_LANGUAGE_CODE as CONFIG_TARGET_LANGUAGE_CODE } from './config.js';

export async function loadWordFromDatabase(wordId) {
    if (!this.db) {
        this.error = "Database not available.";
        return;
    }

    // Load basic word details
    const wordQuery = 'SELECT * FROM words WHERE id = ?';
    const wordResults = this.executeQuery(wordQuery, [wordId]);

    if (wordResults && wordResults.length > 0) {
        const wordData = wordResults[0];
        const wordTranslation = await this.loadWordTranslation(wordId);

        // Map to currentWord for the view
        this.currentWord = {
            id: wordData.id,
            term: wordData.term,
            definition: wordData.definition,
            translation: wordTranslation || wordData.translation,
            pronunciation: wordData.pronunciation,
            audioSrc: wordData.audio_data,
            exampleSentences: [],
            conversation: [],
            clips: [],
            notes: wordData.notes
        };

        // Also keep the old format for backward compatibility
        this.selectedWordDetails = {
            ...wordData,
            translation: wordTranslation || wordData.translation
        };

        // Load related data
        await this.loadWordExamples(wordId);
        await this.loadWordConversations(wordId);
        await this.loadWordClips(wordId);

        console.log('[wordLoaderService] Word details loaded for:', wordId, this.currentWord);
    } else {
        this.error = `Palabra con ID ${wordId} no encontrada.`;
        this.currentWord = null;
    }
}

export async function loadWordTranslation(wordId) {
    try {
        const translationQuery = 'SELECT translation FROM words_translations WHERE words_id = ? AND language_code = ?';
        const translationResults = this.executeQuery(translationQuery, [wordId, CONFIG_TARGET_LANGUAGE_CODE]);
        if (translationResults && translationResults.length > 0) {
            return translationResults[0].translation;
        }
        return null;
    } catch (err) {
        console.warn('[wordLoaderService] Word translations table not available or error loading translation:', err);
        return null;
    }
}

export async function loadWordExamples(wordId) {
    try {
        const examplesQuery = 'SELECT * FROM examples WHERE word_id = ?';
        const examples = this.executeQuery(examplesQuery, [wordId]) || [];
        this.selectedWordExamples = examples;

        // Load example translations and map to currentWord format
        this.currentWord.exampleSentences = await Promise.all(examples.map(async (example) => {
            const exampleTranslation = await this.loadExampleTranslation(example.id);
            return {
                english: example.text,
                translation: exampleTranslation,
                audioSrc: example.audio_data
            };
        }));
    } catch (err) {
        console.warn('[wordLoaderService] Examples table not available or error loading examples:', err);
        this.selectedWordExamples = [];
        this.currentWord.exampleSentences = [];
    }
}

export async function loadExampleTranslation(exampleId) {
    try {
        const exampleTranslationQuery = 'SELECT translation FROM example_translations WHERE example_id = ? AND language_code = ?';
        const exampleTranslationResults = this.executeQuery(exampleTranslationQuery, [exampleId, CONFIG_TARGET_LANGUAGE_CODE]);
        if (exampleTranslationResults && exampleTranslationResults.length > 0) {
            return exampleTranslationResults[0].translation;
        }
        return null;
    } catch (err) {
        console.warn('[wordLoaderService] Example translations table not available:', err);
        return null;
    }
}

export async function loadWordConversations(wordId) {
    try {
        const conversationsQuery = 'SELECT * FROM conversation_lines WHERE word_id = ? ORDER BY id';
        const conversations = this.executeQuery(conversationsQuery, [wordId]) || [];
        this.selectedWordConversations = conversations;

        if (conversations.length > 0) {
            const conversationLines = await this.processConversationLines(conversations);
            const conversationGroups = this.groupConversationLines(conversationLines);
            this.currentWord.conversation = conversationGroups.map(group => ({ lines: group }));
        }
    } catch (err) {
        console.warn('[wordLoaderService] Conversations table not available or error loading conversations:', err);
        this.selectedWordConversations = [];
        this.currentWord.conversation = [];
    }
}

export async function processConversationLines(conversations) {
    return await Promise.all(conversations.map(async (convo) => {
        const conversationTranslation = await this.loadConversationTranslation(convo.id);
        return {
            speaker: convo.speaker_label || 'Speaker',
            line: convo.text,
            translatedLine: conversationTranslation,
            audioSrc: convo.audio_data,
            lineOrder: convo.line_order,
            dbId: convo.id
        };
    }));
}

export async function loadConversationTranslation(conversationId) {
    try {
        const convoTranslationQuery = 'SELECT translation FROM conversation_line_translations WHERE conversation_line_id = ? AND language_code = ?';
        const convoTranslationResults = this.executeQuery(convoTranslationQuery, [conversationId, CONFIG_TARGET_LANGUAGE_CODE]);
        if (convoTranslationResults && convoTranslationResults.length > 0) {
            return convoTranslationResults[0].translation;
        }
        return null;
    } catch (err) {
        console.warn('[wordLoaderService] Conversation translations table not available:', err);
        return null;
    }
}

export function groupConversationLines(conversationLines) {
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

export async function loadWordClips(wordId) {
    try {
        const clipsQuery = 'SELECT * FROM clips WHERE word_id = ?';
        const clips = this.executeQuery(clipsQuery, [wordId]) || [];
        this.selectedWordClips = clips;
        this.currentWord.clips = clips;
    } catch (err) {
        console.warn('[wordLoaderService] Clips table not available or error loading clips:', err);
        this.selectedWordClips = [];
        this.currentWord.clips = [];
    }
} 