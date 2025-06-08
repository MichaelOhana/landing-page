document.addEventListener('DOMContentLoaded', function () {
    // Enhanced FAQ Accordion with improved animations
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const answer = item.querySelector('.faq-answer');
            const arrow = item.querySelector('.arrow-down');
            const isActive = item.classList.contains('active');

            // Close all other items with smooth animation
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    otherItem.querySelector('.arrow-down').style.transform = 'rotate(0deg)';
                }
            });

            // Toggle active class on the clicked item
            item.classList.toggle('active');

            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                answer.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Enhanced Video Preview with improved UI
    const videos = [
        { id: 'YZC89FUwBhY', start: 72 },
        { id: 'mE3VS4t4lrQ', start: 39 },
        { id: 'uh0peDxFnV0', start: 389 },
        { id: 'CXi7gXsEjMM', start: 1 },
        { id: 'R4179pku_J4', start: 197 },
        { id: 'cMzzRGLM7ow', start: 69 }
    ];

    const thumbnailsContainer = document.querySelector('.video-thumbnails');
    let player;

    // Load YouTube IFrame API
    window.onYouTubeIframeAPIReady = function () {
        if (videos.length > 0) {
            loadVideo(videos[0].id, videos[0].start);
        }
    }

    function loadVideo(videoId, startSeconds) {
        if (player) {
            player.loadVideoById({
                videoId: videoId,
                startSeconds: startSeconds
            });
        } else {
            player = new YT.Player('video-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'start': startSeconds,
                    'autoplay': 0,
                    'controls': 1,
                    'rel': 0,
                    'modestbranding': 1
                }
            });
        }
    }

    // Create enhanced thumbnails with better styling
    videos.forEach((video, index) => {
        if (!thumbnailsContainer) return; // Exit if container doesn't exist

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'relative group cursor-pointer';

        const thumb = document.createElement('img');
        thumb.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
        thumb.alt = `Video preview ${index + 1}`;
        thumb.dataset.videoId = video.id;
        thumb.dataset.start = video.start;
        thumb.className = 'w-36 h-24 object-cover rounded-xl border-3 border-transparent hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg';

        if (index === 0) {
            thumb.classList.add('border-blue-500', 'ring-4', 'ring-blue-200');
        }

        // Add play button overlay
        const playButton = document.createElement('div');
        playButton.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300';
        playButton.innerHTML = '<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center"><span class="text-gray-800 text-sm">▶</span></div>';

        thumbContainer.appendChild(thumb);
        thumbContainer.appendChild(playButton);
        thumbnailsContainer.appendChild(thumbContainer);

        thumbContainer.addEventListener('click', () => {
            // Remove active state from all thumbnails
            document.querySelectorAll('.video-thumbnails img').forEach(t => {
                t.classList.remove('border-blue-500', 'ring-4', 'ring-blue-200');
            });
            // Add active state to clicked thumbnail
            thumb.classList.add('border-blue-500', 'ring-4', 'ring-blue-200');
            loadVideo(video.id, video.start);
        });
    });

    // Enhanced Audio button with better feedback
    const audioButton = document.getElementById('audio-button');
    if (audioButton) {
        audioButton.addEventListener('click', () => {
            // Add visual feedback
            audioButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                audioButton.style.transform = 'scale(1)';
            }, 150);

            const text = 'Single-Family';
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // Slower for learning
            speechSynthesis.speak(utterance);
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply scroll animations to elements
    const animatedElements = document.querySelectorAll('section > div');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add dynamic header background on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.25)';
            header.style.backdropFilter = 'blur(20px)';
        }
    });

    // Practice exercise functionality
    const practiceInput = document.querySelector('input[placeholder="____________"]');
    const checkButton = document.querySelector('button[data-check-answer]') ||
        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Check Answer'));

    if (practiceInput && checkButton) {
        checkButton.addEventListener('click', () => {
            const answer = practiceInput.value.toLowerCase().trim();
            if (answer === 'single-family' || answer === 'single family') {
                practiceInput.style.borderColor = '#10B981';
                practiceInput.style.backgroundColor = '#D1FAE5';
                checkButton.textContent = 'Correct! ✅';
                checkButton.style.background = 'linear-gradient(to right, #10B981, #059669)';
            } else {
                practiceInput.style.borderColor = '#EF4444';
                practiceInput.style.backgroundColor = '#FEE2E2';
                checkButton.textContent = 'Try Again 🔄';
                checkButton.style.background = 'linear-gradient(to right, #EF4444, #DC2626)';
            }
        });

        practiceInput.addEventListener('input', () => {
            // Reset styles on new input
            practiceInput.style.borderColor = '#60A5FA';
            practiceInput.style.backgroundColor = '#FFFFFF';
            checkButton.textContent = 'Check Answer ✓';
            checkButton.style.background = 'linear-gradient(to right, #10B981, #3B82F6)';
        });
    }

    // Testimonials slider functionality
    const testimonialContainer = document.getElementById('testimonialContainer');

    if (testimonialContainer) {
        let autoScrollAnimationFrame;
        let isUserInteracting = false;
        let scrollPosition = 0;
        const scrollSpeed = 0.35; // Reduced from 0.5 to make it half as fast

        // Clone testimonials for seamless infinite scroll
        function setupInfiniteScroll() {
            const testimonialSlider = document.getElementById('testimonialSlider');
            if (!testimonialSlider) return;

            const testimonials = testimonialSlider.children;
            const testimonialArray = Array.from(testimonials);

            // Clone all testimonials and append them to the flex container for seamless loop
            testimonialArray.forEach(testimonial => {
                const clone = testimonial.cloneNode(true);
                testimonialSlider.appendChild(clone);
            });
        }

        // Smooth infinite auto-scroll functionality
        function startAutoScroll() {
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
            }

            function smoothScroll(currentTime) {
                if (!isUserInteracting) {
                    scrollPosition += scrollSpeed;

                    const maxScroll = testimonialContainer.scrollWidth / 2; // Half because we duplicated content

                    // Reset position when we've scrolled through original content
                    if (scrollPosition >= maxScroll) {
                        scrollPosition = 0;
                    }

                    testimonialContainer.scrollLeft = scrollPosition;
                }

                autoScrollAnimationFrame = requestAnimationFrame(smoothScroll);
            }

            autoScrollAnimationFrame = requestAnimationFrame(smoothScroll);
        }

        function stopAutoScroll() {
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
            }
        }

        // Mouse interactions
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        testimonialContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            isUserInteracting = true;
            stopAutoScroll();

            testimonialContainer.style.cursor = 'grabbing';
            testimonialContainer.style.userSelect = 'none';

            startX = e.pageX - testimonialContainer.offsetLeft;
            scrollLeft = testimonialContainer.scrollLeft;
            scrollPosition = scrollLeft; // Sync scroll position
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const x = e.pageX - testimonialContainer.offsetLeft;
            const walk = (x - startX) * 2;
            const newScrollLeft = scrollLeft - walk;
            testimonialContainer.scrollLeft = newScrollLeft;
            scrollPosition = newScrollLeft; // Keep position in sync
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                testimonialContainer.style.cursor = 'grab';
                testimonialContainer.style.userSelect = 'auto';

                setTimeout(() => {
                    isUserInteracting = false;
                    startAutoScroll();
                }, 3000);
            }
        });

        // Touch interactions
        testimonialContainer.addEventListener('touchstart', () => {
            isUserInteracting = true;
            stopAutoScroll();
            scrollPosition = testimonialContainer.scrollLeft; // Sync position
        }, { passive: true });

        testimonialContainer.addEventListener('touchend', () => {
            setTimeout(() => {
                isUserInteracting = false;
                scrollPosition = testimonialContainer.scrollLeft; // Sync position
                startAutoScroll();
            }, 3000);
        }, { passive: true });

        // Initialize
        testimonialContainer.style.cursor = 'grab';

        // Setup infinite scroll and start after a delay
        setupInfiniteScroll();
        setTimeout(() => {
            startAutoScroll();
        }, 2000);
    }
}); 