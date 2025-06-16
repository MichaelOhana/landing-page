// Performance-optimized script with lazy loading and reduced main thread blocking
(function () {
    'use strict';

    // Use requestIdleCallback for non-critical tasks
    const requestIdleCallback = window.requestIdleCallback || function (cb) {
        return setTimeout(cb, 1);
    };

    // Debounce function to reduce excessive calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll events
    function throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();

            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Wait for DOM to be ready
    function domReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // Critical functionality - load immediately
    domReady(function () {
        // Enhanced FAQ Accordion with performance optimizations
        function initFAQ() {
            const faqItems = document.querySelectorAll('.faq-item');
            if (faqItems.length === 0) return;

            // Use event delegation for better performance
            document.addEventListener('click', function (e) {
                const question = e.target.closest('.faq-question');
                if (!question) return;

                const item = question.closest('.faq-item');
                const answer = item.querySelector('.faq-answer');
                const arrow = item.querySelector('.arrow-down');

                if (!answer || !arrow) return;

                // Use requestAnimationFrame to ensure smooth animations
                requestAnimationFrame(() => {
                    const isActive = item.classList.contains('active');

                    // Close all other items efficiently
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                            const otherAnswer = otherItem.querySelector('.faq-answer');
                            const otherArrow = otherItem.querySelector('.arrow-down');
                            if (otherAnswer) otherAnswer.style.maxHeight = null;
                            if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                        }
                    });

                    // Toggle current item
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
        }

        // Enhanced Audio button with performance improvements
        function initAudioButton() {
            const audioButton = document.getElementById('audio-button');
            if (!audioButton) return;

            audioButton.addEventListener('click', function () {
                // Add visual feedback with RAF
                requestAnimationFrame(() => {
                    this.style.transform = 'scale(0.95)';
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            this.style.transform = 'scale(1)';
                        }, 150);
                    });
                });

                // Use Web Speech API efficiently
                if ('speechSynthesis' in window) {
                    const text = 'Vivienda Unifamiliar';
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-ES';
                    utterance.rate = 0.8;
                    speechSynthesis.speak(utterance);
                }
            });
        }

        // Smooth scrolling with performance optimization
        function initSmoothScrolling() {
            document.addEventListener('click', function (e) {
                const anchor = e.target.closest('a[href^="#"]');
                if (!anchor) return;

                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);

                if (target) {
                    // Use native smooth scrolling when available, fallback to JS
                    if ('scrollBehavior' in document.documentElement.style) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // Fallback smooth scroll
                        const targetPosition = target.offsetTop;
                        const startPosition = window.pageYOffset;
                        const distance = targetPosition - startPosition;
                        const duration = 800;
                        let start = null;

                        function animation(currentTime) {
                            if (start === null) start = currentTime;
                            const timeElapsed = currentTime - start;
                            const run = ease(timeElapsed, startPosition, distance, duration);
                            window.scrollTo(0, run);
                            if (timeElapsed < duration) requestAnimationFrame(animation);
                        }

                        function ease(t, b, c, d) {
                            t /= d / 2;
                            if (t < 1) return c / 2 * t * t + b;
                            t--;
                            return -c / 2 * (t * (t - 2) - 1) + b;
                        }

                        requestAnimationFrame(animation);
                    }
                }
            });
        }

        // Track InitiateCheckout event for Facebook Pixel
        function initCheckoutTracking() {
            const checkoutBtn = document.getElementById('checkout-button');
            if (!checkoutBtn) return;

            checkoutBtn.addEventListener('click', function (e) {
                // Ensure Facebook Pixel fires before leaving the page
                if (typeof fbq === 'function') {
                    // Prevent immediate navigation
                    e.preventDefault();
                    const targetUrl = checkoutBtn.href;

                    // Trigger the Facebook Pixel event
                    try {
                        fbq('track', 'InitiateCheckout');
                    } catch (err) {
                        // Fallback: push event to dataLayer for GTM setups
                        if (window.dataLayer) {
                            window.dataLayer.push({ event: 'InitiateCheckout' });
                        }
                    }

                    // Continue to checkout after a brief delay to allow the request
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 150);
                }
            });
        }

        // Initialize critical features
        initFAQ();
        initAudioButton();
        initSmoothScrolling();
        initCheckoutTracking();
    });

    // Non-critical functionality - load when idle
    requestIdleCallback(function () {
        // Enhanced scroll animations with Intersection Observer
        function initScrollAnimations() {
            if (!('IntersectionObserver' in window)) return;

            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        });
                        observer.unobserve(entry.target);
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
        }

        // Dynamic header background on scroll with throttling
        function initHeaderScroll() {
            const header = document.querySelector('header');
            if (!header) return;

            const throttledScroll = throttle(() => {
                requestAnimationFrame(() => {
                    if (window.scrollY > 100) {
                        header.style.background = 'rgba(255, 255, 255, 0.95)';
                        header.style.backdropFilter = 'blur(20px)';
                    } else {
                        header.style.background = 'rgba(255, 255, 255, 0.25)';
                        header.style.backdropFilter = 'blur(20px)';
                    }
                });
            }, 16); // ~60fps

            window.addEventListener('scroll', throttledScroll, { passive: true });
        }

        // Practice exercise functionality
        function initPracticeExercise() {
            const practiceInput = document.querySelector('input[placeholder="____________"]');
            const checkButton = document.querySelector('button[data-check-answer]') ||
                Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent && btn.textContent.includes('Check Answer')
                );

            if (!practiceInput || !checkButton) return;

            // Debounced input handler
            const debouncedInputHandler = debounce(() => {
                requestAnimationFrame(() => {
                    practiceInput.style.borderColor = '#60A5FA';
                    practiceInput.style.backgroundColor = '#FFFFFF';
                    checkButton.textContent = 'Comprobar respuesta ✓';
                    checkButton.style.background = 'linear-gradient(to right, #10B981, #3B82F6)';
                });
            }, 300);

            checkButton.addEventListener('click', () => {
                const answer = practiceInput.value.toLowerCase().trim();
                const correctAnswers = ['single-family', 'single family', 'vivienda unifamiliar'];

                requestAnimationFrame(() => {
                    if (correctAnswers.includes(answer)) {
                        practiceInput.style.borderColor = '#10B981';
                        practiceInput.style.backgroundColor = '#D1FAE5';
                        checkButton.textContent = '¡Correcto! ✅';
                        checkButton.style.background = 'linear-gradient(to right, #10B981, #059669)';
                    } else {
                        practiceInput.style.borderColor = '#EF4444';
                        practiceInput.style.backgroundColor = '#FEE2E2';
                        checkButton.textContent = 'Inténtalo de nuevo 🔄';
                        checkButton.style.background = 'linear-gradient(to right, #EF4444, #DC2626)';
                    }
                });
            });

            practiceInput.addEventListener('input', debouncedInputHandler);
        }

        // Initialize non-critical features
        initScrollAnimations();
        initHeaderScroll();
        initPracticeExercise();
    });

    // Testimonials slider with performance optimizations - load last
    requestIdleCallback(function () {
        function initTestimonialsSlider() {
            const testimonialContainer = document.getElementById('testimonialContainer');
            if (!testimonialContainer) return;

            let animationFrame;
            let isUserInteracting = false;
            let scrollPosition = 0;
            const scrollSpeed = 0.35;

            // Optimize infinite scroll setup
            function setupInfiniteScroll() {
                const testimonialSlider = document.getElementById('testimonialSlider');
                if (!testimonialSlider) return;

                const testimonials = Array.from(testimonialSlider.children);
                const fragment = document.createDocumentFragment();

                // Use DocumentFragment for better performance
                testimonials.forEach(testimonial => {
                    const clone = testimonial.cloneNode(true);
                    fragment.appendChild(clone);
                });
                testimonialSlider.appendChild(fragment);
            }

            // Optimized smooth scroll with RAF
            function startAutoScroll() {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }

                function smoothScroll() {
                    if (!isUserInteracting) {
                        scrollPosition += scrollSpeed;
                        const maxScroll = testimonialContainer.scrollWidth / 2;

                        if (scrollPosition >= maxScroll) {
                            scrollPosition = 0;
                        }

                        testimonialContainer.scrollLeft = scrollPosition;
                    }
                    animationFrame = requestAnimationFrame(smoothScroll);
                }

                animationFrame = requestAnimationFrame(smoothScroll);
            }

            function stopAutoScroll() {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
            }

            // Optimized mouse interactions
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
                scrollPosition = scrollLeft;
                e.preventDefault();
            });

            // Use throttled mousemove for better performance
            const throttledMouseMove = throttle((e) => {
                if (!isDragging) return;
                e.preventDefault();

                const x = e.pageX - testimonialContainer.offsetLeft;
                const walk = (x - startX) * 2;
                const newScrollLeft = scrollLeft - walk;
                testimonialContainer.scrollLeft = newScrollLeft;
                scrollPosition = newScrollLeft;
            }, 16);

            document.addEventListener('mousemove', throttledMouseMove);

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

            // Touch interactions with passive listeners
            testimonialContainer.addEventListener('touchstart', () => {
                isUserInteracting = true;
                stopAutoScroll();
                scrollPosition = testimonialContainer.scrollLeft;
            }, { passive: true });

            testimonialContainer.addEventListener('touchend', () => {
                setTimeout(() => {
                    isUserInteracting = false;
                    scrollPosition = testimonialContainer.scrollLeft;
                    startAutoScroll();
                }, 3000);
            }, { passive: true });

            // Initialize slider
            testimonialContainer.style.cursor = 'grab';
            setupInfiniteScroll();

            // Start auto-scroll after a delay
            setTimeout(() => {
                startAutoScroll();
            }, 2000);
        }

        initTestimonialsSlider();
    });

})(); 