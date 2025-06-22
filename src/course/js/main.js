// main.js – refactored with services
// ------------------------------------------------
// Import your modules
import * as utils from './utils.js';
import * as database from './databaseService.js';
import * as view from './view.js';
import * as practice from './practiceService.js';
import * as navigation from './navigationService.js';
import * as ui from './uiService.js';
import * as content from './contentService.js';
import * as cache from './cacheService.js';
import * as wordLoader from './wordLoaderService.js';
import { getInitialState } from './state.js';

console.log('[main.js] Script start');

function createAppStateComponent() {
    const state = getInitialState();

    return {
        ...state,
        ...utils,
        ...database,
        ...view,
        ...practice,
        ...navigation,
        ...ui,
        ...content,
        ...cache,
        ...wordLoader,

        async init() {
            console.log('[main.js] init()');
            window.appStateInstance = this;
            this.initializeMobileMenuState();

            try {
                console.log('[main.js] Step 1: Initializing database...');
                await this.initDB();
                console.log('[main.js] Database initialized successfully');

                console.log('[main.js] Step 2: Loading HTML views...');
                await this.loadHtmlViews();
                console.log('[main.js] HTML views loaded successfully');

                this.setupPaymentPopup();

                console.log('[main.js] Step 3: Checking database schema...');
                const schema = this.checkDatabaseSchema();

                console.log('[main.js] Step 4: Loading modules...');
                if (schema.hasModulesTable) {
                    this.loadModules();
                } else {
                    console.log('[main.js] No modules table found, will extract from words');
                    this.modules = [];
                }

                console.log('[main.js] Step 5: Loading words for navigation...');
                await this.loadAllWordsForNavigation();

                console.log('[main.js] Step 6: Showing menu view...');
                await this.showMenuView();

                this.isLoading = false;
                console.log('[main.js] Initialization complete!');
            } catch (err) {
                console.error('[main.js] initialisation failed:', err);
                this.error = err.message;
                this.isLoading = false;
            }
        },

        initializeYouGlishWidget() {
            if (!this.currentWord || !this.currentWord.term) return;
            const container = document.getElementById('youglish-container');
            if (!container) return;

            container.innerHTML = '';
            const widgetId = `yg-widget-${this.currentWord.id || Date.now()}`;
            const widgetDiv = document.createElement('div');
            widgetDiv.id = widgetId;
            container.appendChild(widgetDiv);

            const cleanTerm = this.currentWord.term.split('(')[0].trim();

            if (typeof window.YG !== 'undefined' && window.YG.Widget) {
                try {
                    new window.YG.Widget(widgetId, {
                        components: 8415,
                        'bkg-color': 'theme_light',
                        query: cleanTerm,
                        lang: 'english',
                    });
                } catch (error) {
                    console.error('[main.js] Error creating YouGlish widget:', error);
                    container.innerHTML = '<p>Could not load pronunciation widget.</p>';
                }
            } else {
                // Defer initialization
                window.youglishWidgetConfig = {
                    term: cleanTerm,
                    widgetId: widgetId
                };
            }
        },

        async loadWordsForModuleNavigation(moduleId, container) {
            try {
                const query = `
                    SELECT w.id, w.term FROM words w
                    JOIN word_module_assignments wma ON w.id = wma.word_id
                    WHERE wma.module_id = ? ORDER BY w.term
                `;
                const words = this.executeQuery(query, [moduleId]) || [];
                container.innerHTML = '';
                words.forEach((word, index) => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'cursor-pointer p-2 rounded hover:bg-purple-100 transition-colors text-sm border-l-2 border-purple-200 pl-3';
                    wordItem.textContent = word.term || 'Palabra desconocida';
                    wordItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (!this.isModuleFree(moduleId)) {
                            this.showPaymentPopup();
                            return;
                        }
                        this.selectWordFromNav(word.id);
                    });
                    container.appendChild(wordItem);
                    if (index === 4 && words.length > 5) {
                        this.addPracticeSection(container, words.slice(0, 5), 'Practicar Primeras 5 Palabras', moduleId);
                    }
                });
                this.addEndPracticeSections(container, words, moduleId);
            } catch (err) {
                console.error(`[main.js] Error loading words for module ${moduleId}:`, err);
                container.innerHTML = '<div class="text-red-500 text-xs p-2">Error al cargar las palabras</div>';
            }
        },

        addPracticeSection(container, words, title, moduleId) {
            const practiceContainer = document.createElement('div');
            practiceContainer.className = 'my-3 p-3 bg-blue-50 rounded-lg border border-blue-200';
            const practiceButton = document.createElement('button');
            practiceButton.className = 'w-full text-left px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors border border-blue-300 font-medium';
            practiceButton.textContent = `📝 ${title}`;
            practiceButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordIds = words.map(w => w.id);
                const module = this.modules.find(m => m.id == moduleId);
                const moduleName = module ? module.name : `Módulo ${moduleId}`;
                this.startPracticeSession(wordIds, `Práctica: ${title} - ${moduleName}`);
            });
            practiceContainer.appendChild(practiceButton);
            container.appendChild(practiceContainer);
        },

        addEndPracticeSections(container, words, moduleId) {
            const endPracticeContainer = document.createElement('div');
            endPracticeContainer.className = 'mt-3 space-y-2 border-t border-gray-200 pt-3';
            const module = this.modules.find(m => m.id == moduleId);
            const moduleName = module ? module.name : `Módulo ${moduleId}`;
            if (words.length > 5) {
                this.addRemainingWordsPractice(endPracticeContainer, words, moduleName);
            }
            this.addAllWordsPractice(endPracticeContainer, words, moduleName);
            container.appendChild(endPracticeContainer);
        },

        addRemainingWordsPractice(container, words, moduleName) {
            const practiceContainer = document.createElement('div');
            practiceContainer.className = 'p-2 bg-gray-50 rounded border border-gray-200';
            const practiceButton = document.createElement('button');
            practiceButton.className = 'w-full text-left px-2 py-1 text-xs text-orange-600 rounded hover:bg-orange-50 transition-colors border-0 font-normal';
            const remainingCount = words.length - 5;
            practiceButton.textContent = `🎯 Practicar ${remainingCount} Palabras Restantes`;
            practiceButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const remainingWordIds = words.slice(5).map(w => w.id);
                this.startPracticeSession(remainingWordIds, `Práctica: ${remainingCount} Palabras Restantes - ${moduleName}`);
            });
            practiceContainer.appendChild(practiceButton);
            container.appendChild(practiceContainer);
        },

        addAllWordsPractice(container, words, moduleName) {
            const practiceContainer = document.createElement('div');
            practiceContainer.className = 'p-2 bg-gray-50 rounded border border-gray-200';
            const practiceButton = document.createElement('button');
            practiceButton.className = 'w-full text-left px-2 py-1 text-xs text-green-600 rounded hover:bg-green-50 transition-colors border-0 font-normal';
            practiceButton.textContent = `📚 Practicar Todas las ${words.length} Palabras`;
            practiceButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordIds = words.map(w => w.id);
                this.startPracticeSession(wordIds, `Práctica: Todas las Palabras - ${moduleName}`);
            });
            practiceContainer.appendChild(practiceButton);
            container.appendChild(practiceContainer);
        }
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
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (registerComponent()) {
            clearInterval(checkInterval);
        } else if (attempts > 50) {
            clearInterval(checkInterval);
        }
    }, 100);
}

window.onYouglishAPIReady = function (YG) {
    if (window.youglishWidgetConfig) {
        const { term, widgetId } = window.youglishWidgetConfig;
        const container = document.getElementById('youglish-container');
        if (container) {
            // It's possible the container was cleared since the config was set.
            // Ensure the target div exists.
            if (!document.getElementById(widgetId)) {
                container.innerHTML = '';
                const widgetDiv = document.createElement('div');
                widgetDiv.id = widgetId;
                container.appendChild(widgetDiv);
            }
            try {
                new YG.Widget(widgetId, {
                    components: 8415,
                    'bkg-color': 'theme_light',
                    query: term,
                    lang: 'english',
                });
            } catch (error) {
                console.error('[main.js] Error creating delayed YouGlish widget:', error);
                container.innerHTML = '<p>Could not load pronunciation widget.</p>';
            }
        }
        window.youglishWidgetConfig = null;
    }
};

console.log('[main.js] Script end');
