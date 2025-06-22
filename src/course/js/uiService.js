// UI service - handles user interface interactions
// Note: `this` in these functions will refer to the Alpine component instance

// ---- Mobile menu functions ----
export function toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
        document.body.classList.add('overflow-hidden');
    } else {
        document.body.classList.remove('overflow-hidden');
    }
}

export function closeMobileMenu() {
    if (this.isMobileMenuOpen) {
        this.isMobileMenuOpen = false;
        document.body.classList.remove('overflow-hidden');
    }
}

export function initializeMobileMenuState() {
    const isDesktop = window.innerWidth >= 768; // md breakpoint
    this.isMobileMenuOpen = isDesktop;
    document.body.classList.remove('overflow-hidden');
}

// ---- Payment popup functions ----
export function showPaymentPopup() {
    const popup = document.getElementById('payment-popup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

export function closePaymentPopup() {
    const popup = document.getElementById('payment-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

export function setupPaymentPopup() {
    if (this.paymentPopupHtml) {
        const popupContainer = document.createElement('div');
        popupContainer.innerHTML = this.paymentPopupHtml;
        document.body.appendChild(popupContainer.firstElementChild);
    }
}

// ---- Audio playback ----
export function playAudio(audioData) {
    if (!audioData) return;
    try {
        let blob;
        if (audioData instanceof Blob) {
            blob = audioData;
        } else if (audioData instanceof ArrayBuffer || audioData instanceof Uint8Array) {
            blob = new Blob([audioData], { type: 'audio/mpeg' });
        } else {
            return;
        }
        const url = URL.createObjectURL(blob);
        if (this.audioPlayer) {
            this.audioPlayer.src = url;
            this.audioPlayer.play().catch(e => console.error("Error playing audio:", e));
        }
    } catch (e) {
        console.error("Error processing audio data:", e);
    }
}
