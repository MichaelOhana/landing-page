// Header functionality
function initializeHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('backdrop-blur-md', 'bg-white/90');
        } else {
            header.classList.remove('backdrop-blur-md', 'bg-white/90');
        }
    });
}

// FAQ functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const arrow = item.querySelector('.arrow-down');

        if (!question || !answer) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherArrow = otherItem.querySelector('.arrow-down');
                    if (otherAnswer) otherAnswer.style.maxHeight = '0';
                    if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = '0';
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// Animations
function initializeAnimations() {
    // Check if IntersectionObserver is supported
    if (!window.IntersectionObserver) {
        console.log('IntersectionObserver not supported');
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }
        });
    }, observerOptions);

    // Find and observe elements with animation classes
    const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up');

    if (animatedElements.length === 0) {
        console.log('No animated elements found');
        return;
    }

    animatedElements.forEach(el => {
        if (el && el.style) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        }
    });

    console.log(`Observing ${animatedElements.length} animated elements`);
}

// Audio button functionality
function initializeAudioButton() {
    const audioButton = document.getElementById('audio-button');
    if (!audioButton) return;

    audioButton.addEventListener('click', () => {
        // Create speech synthesis
        const text = 'Single-Family';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);

        // Visual feedback
        audioButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            audioButton.style.transform = 'scale(1)';
        }, 150);
    });
}

// Video player functionality
function initializeVideoPlayer() {
    // This would initialize YouTube video player if the section was active
    // Currently commented out in HTML, so just return
    return;
}

// Practice Exercise Logic
function initializePracticeExercise() {
    const practiceSection = document.getElementById('practice-exercise');
    if (!practiceSection) return;

    const checkAnswersBtn = document.getElementById('check-answers');
    const resultsDiv = document.getElementById('practice-results');

    if (!checkAnswersBtn || !resultsDiv) return;

    checkAnswersBtn.addEventListener('click', function () {
        const inputs = practiceSection.querySelectorAll('input[type="text"]');
        const correctAnswers = ['closing', 'appraisal', 'mortgage'];
        let correct = 0;

        inputs.forEach((input, index) => {
            const userAnswer = input.value.toLowerCase().trim();
            const correctAnswer = correctAnswers[index];

            if (userAnswer === correctAnswer) {
                input.style.borderColor = '#10B981';
                input.style.backgroundColor = '#D1FAE5';
                correct++;
            } else {
                input.style.borderColor = '#EF4444';
                input.style.backgroundColor = '#FEE2E2';
            }
        });

        resultsDiv.innerHTML = `
            <div class="text-center p-4 rounded-lg ${correct === 3 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                <div class="text-lg font-semibold">
                    ${correct}/3 Correct!
                </div>
                <div class="text-sm mt-2">
                    ${correct === 3 ? 'Perfect! You\'re ready for real conversations.' : 'Keep practicing! Try the highlighted words again.'}
                </div>
            </div>
        `;
        resultsDiv.classList.remove('hidden');
    });
}

// Testimonials Carousel with Auto-scroll and Drag
function initializeTestimonialsCarousel() {
    console.log('Initializing testimonials carousel...');
    const slider = document.getElementById('testimonialSlider');

    if (!slider) {
        console.log('Slider not found!');
        return;
    }

    console.log('Slider found, setting up carousel...');

    let currentTranslate = 0;
    let startPos = 0;
    let currentPos = 0;
    let isDragging = false;
    let animationID = 0;
    let prevTranslate = 0;

    // Auto-scroll variables
    let autoScrollSpeed = 1; // Increased speed for visibility
    let isAutoScrolling = true;

    // Calculate slides per view based on screen size
    function getSlidesPerView() {
        if (window.innerWidth >= 1024) return 3; // lg screens
        if (window.innerWidth >= 768) return 2;  // md screens
        return 1; // sm screens
    }

    // Get slider dimensions
    function getSliderDimensions() {
        const containerWidth = slider.parentElement.offsetWidth;
        const slidesPerView = getSlidesPerView();
        const cardWidth = containerWidth / slidesPerView;
        const totalCards = slider.children.length;
        const totalWidth = totalCards * cardWidth;

        console.log('Slider dimensions:', { containerWidth, cardWidth, totalCards, totalWidth });
        return { containerWidth, cardWidth, totalWidth, totalCards };
    }

    // Set slider position
    function setSliderPosition() {
        slider.style.transform = `translateX(${currentTranslate}px)`;
    }

    // Auto-scroll animation
    function autoScroll() {
        if (!isAutoScrolling || isDragging) {
            animationID = requestAnimationFrame(autoScroll);
            return;
        }

        const { totalWidth, totalCards } = getSliderDimensions();

        // Move slider to the left
        currentTranslate -= autoScrollSpeed;

        // Reset when we've scrolled through about 13 cards (original testimonials)
        const resetPoint = -(totalWidth * 0.8); // Reset after 80% to maintain smooth loop
        if (currentTranslate <= resetPoint) {
            currentTranslate = 0;
        }

        setSliderPosition();
        animationID = requestAnimationFrame(autoScroll);
    }

    // Mouse/Touch event handlers
    function getPositionX(event) {
        return event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
    }

    function dragStart(event) {
        console.log('Drag start');
        startPos = getPositionX(event);
        isDragging = true;
        isAutoScrolling = false;
        prevTranslate = currentTranslate;

        slider.style.cursor = 'grabbing';
        slider.style.transition = 'none';

        // Prevent default behavior
        if (event.type === 'mousedown') {
            event.preventDefault();
        }
    }

    function dragMove(event) {
        if (!isDragging) return;

        currentPos = getPositionX(event);
        const diff = currentPos - startPos;
        currentTranslate = prevTranslate + diff;

        setSliderPosition();

        // Prevent default behavior
        event.preventDefault();
    }

    function dragEnd() {
        if (!isDragging) return;

        console.log('Drag end');
        isDragging = false;
        slider.style.cursor = 'grab';
        slider.style.transition = 'transform 0.3s ease-out';

        const { totalWidth } = getSliderDimensions();

        // Ensure we don't go beyond reasonable bounds
        if (currentTranslate > 100) {
            currentTranslate = 0;
        } else if (currentTranslate < -(totalWidth + 100)) {
            currentTranslate = -(totalWidth * 0.1);
        }

        setSliderPosition();

        // Resume auto-scroll after 3 seconds
        setTimeout(() => {
            isAutoScrolling = true;
            slider.style.transition = 'none';
        }, 3000);
    }

    // Event listeners for mouse
    slider.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    // Event listeners for touch
    slider.addEventListener('touchstart', dragStart, { passive: false });
    slider.addEventListener('touchmove', dragMove, { passive: false });
    slider.addEventListener('touchend', dragEnd);

    // Pause auto-scroll on hover (desktop only)
    slider.addEventListener('mouseenter', () => {
        if (!isDragging) {
            isAutoScrolling = false;
            console.log('Auto-scroll paused');
        }
    });

    slider.addEventListener('mouseleave', () => {
        if (!isDragging) {
            isAutoScrolling = true;
            console.log('Auto-scroll resumed');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        currentTranslate = 0;
        setSliderPosition();
    });

    // Prevent drag on images and text selection
    slider.addEventListener('dragstart', (e) => e.preventDefault());
    slider.style.userSelect = 'none';

    // Initialize
    console.log('Starting auto-scroll...');
    setSliderPosition();
    autoScroll();
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing components...');

    try {
        initializeHeader();
        console.log('Header initialized');
    } catch (error) {
        console.log('Header initialization failed:', error);
    }

    try {
        initializeFAQ();
        console.log('FAQ initialized');
    } catch (error) {
        console.log('FAQ initialization failed:', error);
    }

    try {
        initializeAnimations();
        console.log('Animations initialized');
    } catch (error) {
        console.log('Animations initialization failed:', error);
    }

    try {
        initializeAudioButton();
        console.log('Audio button initialized');
    } catch (error) {
        console.log('Audio button initialization failed:', error);
    }

    try {
        initializeVideoPlayer();
        console.log('Video player initialized');
    } catch (error) {
        console.log('Video player initialization failed:', error);
    }

    try {
        initializePracticeExercise();
        console.log('Practice exercise initialized');
    } catch (error) {
        console.log('Practice exercise initialization failed:', error);
    }

    try {
        initializeTestimonialsCarousel();
        console.log('Testimonials carousel initialized');
    } catch (error) {
        console.log('Testimonials carousel initialization failed:', error);
    }
}); 