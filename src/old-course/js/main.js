// main.js – simplified, single‑start Alpine setup
// ------------------------------------------------
// Import your modules
import * as utils from './utils.js';
import { initDB, executeQuery } from './dbService.js';
import { loadHtmlViews } from './viewLoader.js';
import * as wordServiceFunctions from './wordService.js';
import * as moduleServiceFunctions from './moduleService.js';
import * as practiceServiceFunctions from './practiceService.js';
import { TARGET_LANGUAGE_CODE as CONFIG_TARGET_LANGUAGE_CODE } from './config.js';
import { getInitialState } from './state.js';

console.log('[main.js] Script start');

// Function to create the Alpine component
function createAppStateComponent() {
    // Helper function to get target language from config
    const getTargetLanguage = () => {
        try {
            return CONFIG_TARGET_LANGUAGE_CODE || 'es';
        } catch (e) {
            return 'es';
        }
    };
    const CONFIG_TARGET_LANGUAGE_CODE = getTargetLanguage();

    const state = getInitialState();

    return {
        // ---- reactive state ----
        ...state,

        // ---- utility functions ----
        ...utils,

        // ---- mobile menu functions ----
        toggleMobileMenu() {
            console.log('[appState] toggleMobileMenu() called, current state:', this.isMobileMenuOpen);
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
            if (this.isMobileMenuOpen) {
                document.body.classList.add('overflow-hidden');
            } else {
                document.body.classList.remove('overflow-hidden');
            }
        },

        closeMobileMenu() {
            if (this.isMobileMenuOpen) {
                this.isMobileMenuOpen = false;
                document.body.classList.remove('overflow-hidden');
            }
        },

        // ---- service functions ----
        ...wordServiceFunctions,
        ...moduleServiceFunctions,
        ...practiceServiceFunctions,

        // ---- lifecycle ----
        async init() {
            console.log('[appState] init()');
            window.appStateInstance = this;

            if (window.youglishApiIsReady) {
                this.setYouglishApiReady();
            }

            const isDesktop = window.innerWidth >= 768;
            this.isMobileMenuOpen = isDesktop;
            document.body.classList.remove('overflow-hidden');

            try {
                await initDB.call(this);
                await loadHtmlViews.call(this);
                const schema = this.checkDatabaseSchema();
                if (schema.hasModulesTable) {
                    this.loadModules();
                } else {
                    this.modules = [];
                }
                await this.loadAllWordsForNavigation();
                await this.showMenuView();
                this.isLoading = false;
                console.log('[appState] Initialization complete!');
            } catch (err) {
                console.error('[appState] initialisation failed:', err);
                this.error = err.message;
                this.isLoading = false;
            }
        },

        // ---- database query helper ----
        executeQuery(query, params = []) {
            return executeQuery.call(this, query, params);
        },

        checkDatabaseSchema() {
            try {
                const tablesQuery = "SELECT name FROM sqlite_master WHERE type='table'";
                const tables = this.executeQuery(tablesQuery) || [];
                const hasModulesTable = tables.some(t => t.name.toLowerCase() === 'modules');
                const hasClipsTable = tables.some(t => t.name.toLowerCase() === 'clips');
                return { tables, hasModulesTable, hasClipsTable };
            } catch (err) {
                console.error('[appState] Error checking database schema:', err);
                return { tables: [], hasModulesTable: false, hasClipsTable: false };
            }
        },

        // ---- navigation and view management ----
        async loadAllWordsForNavigation() {
            try {
                const allWordsQuery = `
                    SELECT w.*, m.id as module_id, m.name as module_name, m.description as module_description
                    FROM words w
                    LEFT JOIN word_module_assignments wma ON w.id = wma.word_id
                    LEFT JOIN modules m ON wma.module_id = m.id
                    ORDER BY m.name, w.term
                `;
                this.allWordsFlat = this.executeQuery(allWordsQuery) ?? [];

                if ((!this.modules || this.modules.length === 0) && this.allWordsFlat.length > 0) {
                    const moduleMap = new Map();
                    this.allWordsFlat.forEach(word => {
                        if (word.module_id && !moduleMap.has(word.module_id)) {
                            moduleMap.set(word.module_id, {
                                id: word.module_id,
                                name: word.module_name || `Módulo ${word.module_id}`,
                                description: word.module_description || ''
                            });
                        }
                    });
                    this.modules = Array.from(moduleMap.values());
                }
                this.populateWordNavigation();
            } catch (err) {
                console.error('[appState] loadAllWordsForNavigation() error:', err);
                this.error = 'Error al cargar las palabras para la navegación';
                if (this.modules && this.modules.length > 0) {
                    this.populateModulesOnly();
                }
            }
        },

        populateWordNavigation() {
            // This function is now very complex and interacts with the DOM directly.
            // It is being kept as-is from the previous version.
            // A summary of what it does:
            // 1. Gets the 'word-navigation-list' element.
            // 2. Clears it.
            // 3. Groups words by module.
            // 4. Creates collapsible list items for each module.
            // 5. Appends word items to each module's list.
            // 6. Adds practice buttons within the module lists.
            const navList = document.getElementById('word-navigation-list');
            if (!navList) return;
            navList.innerHTML = '';
            const loadingIndicator = navList.querySelector('[x-show="isLoading"]');
            if (loadingIndicator) navList.appendChild(loadingIndicator);

            const wordsByModule = {};
            this.allWordsFlat.forEach(word => {
                const moduleId = word.module_id || 'ungrouped';
                if (!wordsByModule[moduleId]) wordsByModule[moduleId] = [];
                wordsByModule[moduleId].push(word);
            });

            Object.keys(wordsByModule).forEach(moduleId => {
                const module = this.modules.find(m => m.id == moduleId) || { name: `Módulo ${moduleId}`, description: '' };
                const moduleHeader = document.createElement('li');
                moduleHeader.className = 'font-semibold text-purple-700 mt-4 mb-2 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-50 transition-colors';
                moduleHeader.innerHTML = `<div class="flex justify-between items-center"><div><div class="text-sm font-bold">${module.name}</div>${module.description ? `<div class="text-xs text-purple-600 font-normal mt-1">${module.description}</div>` : ''}</div><span class="module-toggle text-purple-500">▼</span></div>`;

                const wordsContainer = document.createElement('div');
                wordsContainer.className = 'module-words hidden mt-2 ml-4 space-y-1';
                wordsByModule[moduleId].forEach(word => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'cursor-pointer p-2 rounded hover:bg-purple-100 transition-colors text-sm border-l-2 border-purple-200 pl-3';
                    wordItem.textContent = word.term;
                    wordItem.onclick = (e) => { e.stopPropagation(); this.selectWordFromNav(word.id); };
                    wordsContainer.appendChild(wordItem);
                });

                moduleHeader.onclick = () => {
                    const isExpanded = !wordsContainer.classList.contains('hidden');
                    wordsContainer.classList.toggle('hidden');
                    moduleHeader.querySelector('.module-toggle').textContent = isExpanded ? '▼' : '▲';
                    if (!isExpanded) this.selectModule(moduleId);
                };

                navList.appendChild(moduleHeader);
                navList.appendChild(wordsContainer);
            });
        },

        populateModulesOnly() {
            const navList = document.getElementById('word-navigation-list');
            if (!navList) return;
            navList.innerHTML = '';

            this.modules.forEach(module => {
                const moduleHeader = document.createElement('li');
                moduleHeader.className = 'font-semibold text-purple-700 mt-4 mb-2 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-50 transition-colors';
                moduleHeader.innerHTML = `<div class="flex justify-between items-center"><div><div class="text-sm font-bold">${module.name}</div>${module.description ? `<div class="text-xs text-purple-600 font-normal mt-1">${module.description}</div>` : ''}</div></div>`;
                moduleHeader.onclick = () => this.selectModule(module.id);
                navList.appendChild(moduleHeader);
            });
        },

        async selectWordFromNav(wordId) {
            this.selectedWordId = wordId;
            this.closeMobileMenu();
            await this.showWordDetail(wordId);
        },

        async showMenuView() {
            this.currentView = 'menu';
            const viewContainer = document.getElementById('view-container');
            if (viewContainer) viewContainer.innerHTML = this.menuViewHtml;
        },

        async showWordDetail(wordId) {
            this.currentView = 'word';
            this.selectedWordId = wordId;
            this.isLoadingWordDetails = true;

            const viewContainer = document.getElementById('view-container');
            if (viewContainer && this.wordDetailViewHtml) {
                viewContainer.innerHTML = this.wordDetailViewHtml;
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            await this.loadWordDetailsById(wordId);
            this.isLoadingWordDetails = false;
            await new Promise(resolve => setTimeout(resolve, 50));

            if (this.currentWord && this.currentWord.term) {
                this.initializeYouGlish(this.currentWord.term);
            }
        },

        async loadWordDetailsById(wordId) {
            if (!this.db || !wordId) return;
            try {
                const wordQuery = 'SELECT * FROM words WHERE id = ?';
                const wordResults = this.executeQuery(wordQuery, [wordId]);
                if (wordResults && wordResults.length > 0) {
                    const wordData = wordResults[0];
                    let wordTranslation = null;
                    try {
                        const translationQuery = 'SELECT translation FROM words_translations WHERE words_id = ? AND language_code = ?';
                        const translationResults = this.executeQuery(translationQuery, [wordId, CONFIG_TARGET_LANGUAGE_CODE]);
                        if (translationResults && translationResults.length > 0) wordTranslation = translationResults[0].translation;
                    } catch (e) { /* ignore */ }

                    this.currentWord = {
                        id: wordData.id,
                        term: wordData.term,
                        definition: wordData.definition,
                        translation: wordTranslation || wordData.translation,
                        pronunciation: wordData.pronunciation,
                        audioSrc: wordData.audio_data,
                        exampleSentences: [], conversation: [], clips: [], notes: wordData.notes
                    };

                    try {
                        const examplesQuery = 'SELECT * FROM examples WHERE word_id = ?';
                        const examples = this.executeQuery(examplesQuery, [wordId]) || [];
                        this.currentWord.exampleSentences = await Promise.all(examples.map(async (ex) => {
                            let trans = null;
                            try {
                                const q = 'SELECT translation FROM example_translations WHERE example_id = ? AND language_code = ?';
                                const res = this.executeQuery(q, [ex.id, CONFIG_TARGET_LANGUAGE_CODE]);
                                if (res && res.length > 0) trans = res[0].translation;
                            } catch (e) {/*ignore*/ }
                            return { english: ex.text, translation: trans, audioSrc: ex.audio_data };
                        }));
                    } catch (e) {/*ignore*/ }

                } else {
                    this.currentWord = null;
                }
            } catch (err) {
                console.error('[appState] loadWordDetailsById() error:', err);
                this.currentWord = null;
            }
        },

        initializeYouGlish(term) {
            if (!term || !this.youglishApiReady) {
                if (!this.youglishApiReady) console.warn('[appState] YouGlish not ready, deferring init.');
                return;
            }

            const tryInit = () => {
                let container = document.getElementById('youglish-container');
                if (!container) return;

                container.innerHTML = '';
                try {
                    new YG.Widget('youglish-container', {
                        width: '100%',
                        height: 400,
                        query: term,
                        lang: 'en',
                        components: 9,
                        autoplay: 0
                    }).addEventListener('error', () => {
                        container.innerHTML = '<p class="text-red-500 text-center py-4">Error loading examples.</p>';
                    });
                } catch (e) {
                    console.error('[appState] Failed to create YouGlish widget:', e);
                }
            };

            // Wait for container to be in DOM
            setTimeout(tryInit, 100);
        },

        setYouglishApiReady() {
            console.log('[appState] YouGlish API is ready.');
            this.youglishApiReady = true;
            if (this.currentView === 'word' && this.currentWord && this.currentWord.term) {
                this.initializeYouGlish(this.currentWord.term);
            }
        },
    };
}

function registerComponent() {
    if (typeof Alpine !== 'undefined') {
        Alpine.data('appState', createAppStateComponent);
        return true;
    }
    return false;
}

if (!registerComponent()) {
    document.addEventListener('alpine:init', registerComponent);
}

console.log('[main.js] Script end');
