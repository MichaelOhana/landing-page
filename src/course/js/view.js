import { TARGET_LANGUAGE_CODE as CONFIG_TARGET_LANGUAGE_CODE, VIEWS } from './config.js';

// --- View Loader ---

// This function will be a method of the Alpine 'appState'
// `this` will refer to the appState instance.
export async function loadHtmlViews() {
    this.isLoadingHtmlViews = true;
    console.log("[view.js] Loading HTML views...");
    try {
        const [
            wordRes,
            practiceRes,
            paymentPopupRes
        ] = await Promise.all([
            fetch(VIEWS.WORD_DETAIL),
            fetch(VIEWS.PRACTICE),
            fetch(VIEWS.PAYMENT_POPUP)
        ]);

        if (!wordRes.ok) throw new Error(`Failed to fetch ${VIEWS.WORD_DETAIL}: ${wordRes.statusText}`);
        this.wordDetailViewHtml = await wordRes.text();

        if (!practiceRes.ok) throw new Error(`Failed to fetch ${VIEWS.PRACTICE}: ${practiceRes.statusText}`);
        this.practiceViewHtml = await practiceRes.text();

        if (!paymentPopupRes.ok) throw new Error(`Failed to fetch ${VIEWS.PAYMENT_POPUP}: ${paymentPopupRes.statusText}`);
        this.paymentPopupHtml = await paymentPopupRes.text();

        console.log("[view.js] HTML views loaded successfully.");
    } catch (err) {
        console.error("[view.js] Error loading HTML views:", err);
        this.error = (this.error ? this.error + '; ' : '') + `Failed to load page templates: ${err.message}`;
        if (!this.wordDetailViewHtml) this.wordDetailViewHtml = `<p class="text-red-500 text-center">Error loading word detail view. Please refresh.</p>`;
        if (!this.practiceViewHtml) this.practiceViewHtml = `<p class="text-red-500 text-center">Error loading practice view. Please refresh.</p>`;
        if (!this.paymentPopupHtml) this.paymentPopupHtml = `<p class="text-red-500 text-center">Error loading payment popup. Please refresh.</p>`;
    } finally {
        this.isLoadingHtmlViews = false;
    }
}

// --- View Service ---

// Note: `this` in these functions will refer to the Alpine component instance

export async function showMenuView() {
    console.log('[view.js] showMenuView()');
    this.currentView = 'menu';
    const viewContainer = document.getElementById('view-container');
    if (viewContainer) {
        viewContainer.innerHTML = `
            <div class="pt-16 md:pt-0">
                <div class="text-center py-20">
                    <h1 class="text-3xl font-bold text-purple-700 mb-4">Curso de Aprendizaje de Idiomas</h1>
                    <p class="text-lg text-gray-600 mb-6">Selecciona un módulo del panel de navegación para comenzar a aprender.</p>
                    <div class="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                        <h2 class="text-xl font-semibold text-purple-600 mb-4">Cómo Usar Este Curso</h2>
                        <div class="text-left space-y-3 text-gray-700">
                            <p>• <strong>Explorar Módulos:</strong> Haz clic en cualquier módulo en el panel izquierdo para expandir y ver sus palabras</p>
                            <p>• <strong>Estudiar Palabras:</strong> Haz clic en palabras individuales para ver información detallada, ejemplos y audio</p>
                            <p>• <strong>Sesiones de Práctica:</strong> Cada módulo tiene opciones de práctica estratégicamente ubicadas:</p>
                            <p class="ml-6">📝 <strong>Practicar Primeras 5 Palabras</strong> - Aparece después de la 5ª palabra</p>
                            <p class="ml-6">🎯 <strong>Practicar Palabras Restantes</strong> - Aparece al final para las palabras 6+</p>
                            <p class="ml-6">📚 <strong>Practicar Todas las Palabras</strong> - Revisión completa del módulo al final</p>
                            <p>• <strong>Tipos de Ejercicios:</strong> La práctica incluye completar oraciones y conversaciones</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export async function showWordDetail(wordId) {
    console.log('[view.js] showWordDetail()', wordId);
    this.currentView = 'word';
    this.selectedWordId = wordId;

    // Skip loading state if word details are cached
    const isWordCached = this.wordDetailsCache && this.wordDetailsCache.has(wordId);
    if (!isWordCached) {
        this.isLoadingWordDetails = true;
    }

    const viewContainer = document.getElementById('view-container');
    if (viewContainer && this.wordDetailViewHtml) {
        viewContainer.innerHTML = this.wordDetailViewHtml;
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Load word details
    await this.loadWordDetailsById(wordId);

    // Initialize YouGlish widget with retry logic
    this.initializeYouGlishWidgetWithRetry();

    // Render YouTube clips using plain JavaScript with retry logic
    if (this.currentWord && this.currentWord.clips) {
        console.log('[view.js] Rendering clips. Clips found:', this.currentWord.clips.length);
        await this.renderYouTubeClipsWithRetry();
    } else if (this.currentWord) {
        console.log('[view.js] Word loaded but no clips available for word:', this.currentWord.term);
        this.showNoClipsMessage();
    }

    this.isLoadingWordDetails = false;
}

export async function initializeYouGlishWidgetWithRetry() {
    let attempts = 0;
    const maxAttempts = 4;
    const retryDelay = 50;

    const tryInit = async () => {
        attempts++;
        const container = document.getElementById('youglish-container');

        if (container) {
            this.initializeYouGlishWidget();
            return true;
        } else if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return tryInit.call(this);
        } else {
            console.error('[view.js] YouGlish container not found. Creating fallback.');
            const wordDetailContainer = document.querySelector('[x-show="currentWord && !isLoadingWordDetails"]');
            if (wordDetailContainer) {
                const fallbackContainer = document.createElement('div');
                fallbackContainer.id = 'youglish-container';
                wordDetailContainer.appendChild(fallbackContainer);
                this.initializeYouGlishWidget();
                return true;
            }
            return false;
        }
    };
    return await tryInit.call(this);
}

export async function renderYouTubeClipsWithRetry() {
    let attempts = 0;
    const maxAttempts = 4;
    const retryDelay = 50;

    const tryRenderClips = async () => {
        attempts++;
        const container = document.getElementById('youtube-clips-container');

        if (container) {
            console.log('[view.js] Container found on attempt', attempts, ', rendering clips...');
            this.renderYouTubeClips(this.currentWord.clips, 'youtube-clips-container');
            return true;
        } else if (attempts < maxAttempts) {
            console.log('[view.js] Container not found, attempt', attempts, 'of', maxAttempts, ', retrying in', retryDelay, 'ms...');
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return tryRenderClips();
        } else {
            console.error('[view.js] youtube-clips-container not found after', maxAttempts, 'attempts');
            return this.createFallbackClipsContainer();
        }
    };

    return await tryRenderClips();
}

export function createFallbackClipsContainer() {
    const wordDetailContainer = document.querySelector('[x-show="currentWord && !isLoadingWordDetails"]');
    if (wordDetailContainer) {
        console.log('[view.js] Found word detail container, creating fallback clips container');
        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'youtube-clips-container';
        fallbackContainer.className = 'space-y-4 mt-6';
        wordDetailContainer.appendChild(fallbackContainer);

        console.log('[view.js] Created fallback container, rendering clips...');
        this.renderYouTubeClips(this.currentWord.clips, 'youtube-clips-container');
        return true;
    } else {
        console.error('[view.js] Could not find any suitable container for clips');
        return false;
    }
}

export function showNoClipsMessage() {
    const container = document.getElementById('youtube-clips-container');
    if (container) {
        container.innerHTML = `
            <div class="text-gray-500 italic p-6 bg-gray-50 rounded-lg text-center">
                No YouTube clips available for this word.
            </div>
        `;
    }
}

export function goBackToWordList() {
    console.log('[view.js] goBackToWordList()');
    this.currentView = 'menu';
    this.selectedWordId = null;
    this.currentWord = null;
    this.showMenuView();
} 