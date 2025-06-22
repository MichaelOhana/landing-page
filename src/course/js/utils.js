export function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export function getYouTubeVideoId(url) {
    if (!url) return '';

    // If it's already just a video ID (11 characters, alphanumeric + hyphens/underscores)
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }

    // Otherwise, try to extract from a full URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url; // Fallback to original if extraction fails
}

export function formatSentenceWithBlank(sentence, answerLength = 10, targetWord = null) {
    if (!sentence) return '';

    const blankPlaceholder = `<span class="inline-block border-b-2 border-gray-400 mx-1" style="min-width: ${Math.max(50, answerLength * 8)}px;"></span>`;

    // First, handle existing ___BLANK___ placeholders
    let result = sentence.replace(/___BLANK___/g, blankPlaceholder);

    // If we have a target word and no ___BLANK___ was found, replace the target word
    if (targetWord && result === sentence) {
        // Create a case-insensitive regex to find the target word
        const wordRegex = new RegExp(`\\b${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        result = result.replace(wordRegex, blankPlaceholder);
    }

    return result;
}

export function renderYouTubeClips(clips, containerId) {
    console.log('[renderYouTubeClips] Called with:', { clips, containerId });

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('[renderYouTubeClips] Container not found:', containerId);
        console.error('[renderYouTubeClips] Available elements with ID:',
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }

    console.log('[renderYouTubeClips] Container found:', container);

    if (!clips || clips.length === 0) {
        console.log('[renderYouTubeClips] No clips provided, showing empty state');
        container.innerHTML = `
            <div class="text-gray-500 italic p-6 bg-gray-50 rounded-lg text-center">
                No YouTube clips available for this word.
            </div>
        `;
        return;
    }

    console.log('[renderYouTubeClips] Rendering', clips.length, 'clips:', clips);

    const clipsHtml = `
        <div class="space-y-4">
            <h3 class="text-2xl font-semibold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">YouTube Clips</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${clips.map((clip, index) => {
        const videoId = getYouTubeVideoId(clip.youtube_url);
        console.log('[renderYouTubeClips] Processing clip', index, ':', {
            original_url: clip.youtube_url,
            extracted_id: videoId,
            start_sec: clip.start_sec
        });

        if (!videoId) {
            console.warn('[renderYouTubeClips] Invalid video ID for clip:', clip);
            return `
                        <div class="relative rounded-lg overflow-hidden shadow-md bg-red-100 p-4">
                            <p class="text-red-600">Invalid YouTube URL: ${clip.youtube_url}</p>
                        </div>
                    `;
        }

        return `
                        <div class="relative rounded-lg overflow-hidden shadow-md bg-black" style="padding-bottom: 56.25%;">
                            <iframe class="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/${videoId}?start=${clip.start_sec || 0}&playsinline=1&iv_load_policy=3&rel=0&showinfo=0&modestbranding=1&controls=1&fs=0&autoplay=0&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widgetid=1&forigin=${encodeURIComponent(window.location.origin)}&aoriginsup=1&gporigin=${encodeURIComponent(window.location.origin)}&vf=6"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                            </iframe>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    console.log('[renderYouTubeClips] Setting container HTML');
    container.innerHTML = clipsHtml;
    console.log('[renderYouTubeClips] Clips rendered successfully');
} 