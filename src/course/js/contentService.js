import { TARGET_LANGUAGE_CODE as CONFIG_TARGET_LANGUAGE_CODE } from './config.js';

// ---- Word details loading ----
export async function loadWordDetailsById(wordId) {
    if (!wordId) {
        this.error = "No word ID provided.";
        return;
    }

    try {
        // Use preloaded cache instead of database queries
        if (this.wordDetailsCache && this.wordDetailsCache.has(wordId)) {
            console.log('[contentService] Loading word details from cache for:', wordId);
            this.loadWordFromCache(wordId);
            return;
        }

        // Fallback: Original database queries for words not in cache
        console.log('[contentService] Word not in cache, loading from database:', wordId);
        await this.loadWordFromDatabase(wordId);

    } catch (err) {
        console.error('[contentService] loadWordDetailsById() error:', err);
        this.error = 'Error al cargar los detalles de la palabra';
        this.currentWord = null;
    }
}

export function loadWordFromCache(wordId) {
    this.currentWord = this.getWordDetails(wordId);

    // Also keep the old format for backward compatibility
    this.selectedWordDetails = {
        id: this.currentWord.id,
        term: this.currentWord.term,
        definition: this.currentWord.definition,
        translation: this.currentWord.translation,
        pronunciation: this.currentWord.pronunciation,
        audio_data: this.currentWord.audioSrc,
        notes: this.currentWord.notes
    };

    this.selectedWordExamples = this.currentWord.exampleSentences.map(ex => ({
        text: ex.english,
        audio_data: ex.audioSrc
    }));

    this.selectedWordConversations = [];
    this.currentWord.conversation.forEach(convoBlock => {
        this.selectedWordConversations.push(...convoBlock.lines.map(line => ({
            speaker_label: line.speaker,
            text: line.line,
            audio_data: line.audioSrc,
            line_order: line.lineOrder,
            id: line.dbId
        })));
    });

    this.selectedWordClips = this.currentWord.clips;
    console.log('[contentService] Word details loaded from cache:', this.currentWord);
}

// ---- Module and Word List Loading ----

export async function loadAllWordsForNavigation() {
    try {
        // First, ensure we have all modules loaded
        if (!this.modules || this.modules.length === 0) {
            console.log('[contentService] Loading modules first...');
            this.loadModules();
        }

        // Load all words with their module assignments for the navigation panel
        const allWordsQuery = `
            SELECT w.*, m.id as module_id, m.name as module_name, m.description as module_description
            FROM words w
            JOIN word_module_assignments wma ON w.id = wma.word_id
            JOIN modules m ON wma.module_id = m.id
            ORDER BY m.name, w.term
        `;
        this.allWordsFlat = this.executeQuery(allWordsQuery) ?? [];

        console.log('[contentService] Loaded words with modules:', this.allWordsFlat.length);

        // Preload all word details to eliminate loading delays
        await this.preloadCache();

        // Handle module extraction if needed
        this.extractModulesFromWordsIfNeeded();

        // Populate navigation
        this.populateNavigation();

    } catch (err) {
        console.error('[contentService] loadAllWordsForNavigation() error:', err);
        this.error = 'Error al cargar las palabras para la navegación';
        this.fallbackToModulesOnly();
    }
}

export function loadModules() {
    if (!this.db) {
        this.error = "Database not available to load modules.";
        console.error(this.error);
        return;
    }
    const query = "SELECT id, name, description FROM modules ORDER BY name;";
    const results = this.executeQuery(query);
    if (results) {
        this.modules = results;
        console.log("[contentService] Modules loaded:", this.modules);
    } else {
        console.error("[contentService] Failed to load modules.");
    }
}

export function selectModule(moduleId) {
    console.log(`[contentService] Module selected: ${moduleId}`);
    this.selectedModuleId = moduleId;
    this.selectedWordId = null;
    this.wordsInSelectedModule = [];
    this.clearWordDetails(); // Assumes clearWordDetails is a method on `this`

    this.viewedWordsInModule.clear();
    this.midModulePracticeCompleted = false;
    this.endModulePracticeCompleted = false;
    this.isPracticeActive = false;

    if (moduleId) {
        this.loadWordsForModule(moduleId); // Assumes loadWordsForModule is a method on `this`
    }
}

export function loadWordsForModule(moduleId) {
    if (!this.db) {
        this.error = "Database not available to load words.";
        console.error(this.error);
        return;
    }
    const query = `
        SELECT w.id, w.term
        FROM words w
        JOIN word_module_assignments wma ON w.id = wma.word_id
        WHERE wma.module_id = ?
        ORDER BY w.term;
    `;
    const results = this.executeQuery(query, [moduleId]);
    if (results) {
        this.wordsInSelectedModule = results;
        console.log(`[contentService] Words for module ${moduleId}:`, this.wordsInSelectedModule);
        if (this.wordsInSelectedModule.length === 0) {
            console.warn(`[contentService] No words found for module ${moduleId}.`);
        }
    } else {
        console.error(`[contentService] Failed to load words for module ${moduleId}.`);
    }
}

// ---- Module access control ----
export function isModuleFree(moduleId) {
    // All modules are free now.
    return true;
}

// ---- Utility functions ----
export function clearWordDetails() {
    this.selectedWordDetails = {
        term: null,
        definition: null,
        audio_data: null,
        translation: null
    };
    this.selectedWordExamples = [];
    this.selectedWordConversations = [];
    this.selectedWordClips = [];
    this.currentWord = null;
}