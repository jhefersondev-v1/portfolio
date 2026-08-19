/* ========================================
   JRCF Professional Portfolio
   ======================================== */







/* ========================================
   TYPING EFFECT
   ======================================== */
(function() {
    const phrases = [
        'Desarrollador de Software en Formación',
        'Estudiante de Ingeniería de Software e IA',
        'Apasionado por la Tecnología y la Innovación',
        'Desarrollador Web Full Stack',
        'Creador de Soluciones con Java y Python',
        'Entusiasta del Machine Learning y la IA',
        'Construyendo el Futuro con Código'
    ];
    
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const current = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            typingElement.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === current.length) {
            typingSpeed = 2500;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    type();
})();

/* ========================================
   NAVIGATION
   ======================================== */
(function() {
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Active link
        const sections = document.querySelectorAll('.section, .hero');
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
})();

/* ========================================
   SCROLL REVEAL
   ======================================== */
(function() {
    const revealElements = document.querySelectorAll(
        '.section-header, .about-grid, .skill-category, .project-card, .timeline-item, .education-cards, .contact-grid'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
})();

/* ========================================
   PROJECT FILTER
   ======================================== */
(function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.type === filter) {
                    card.classList.remove('hidden');
                    // Re-trigger animation
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(40px)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
})();

/* ========================================
   CONTACT FORM
   ======================================== */
(function() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate sending
            const btn = form.querySelector('.btn');
            const originalText = btn.querySelector('.btn-text').textContent;
            btn.querySelector('.btn-text').textContent = 'Enviando...';
            btn.disabled = true;

            setTimeout(() => {
                status.textContent = '✅ ¡Mensaje enviado con éxito! Te responderé pronto.';
                status.className = 'form-status success';
                btn.querySelector('.btn-text').textContent = originalText;
                btn.disabled = false;
                form.reset();

                setTimeout(() => {
                    status.textContent = '';
                    status.className = 'form-status';
                }, 5000);
            }, 1500);
        });
    }
})();

/* ========================================
   SMOOTH SCROLL
   ======================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

/* ========================================
   SKILL LEVEL BARS ON SCROLL
   ======================================== */
(function() {
    const categories = document.querySelectorAll('.skill-category');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    categories.forEach(cat => observer.observe(cat));
})();

/* ========================================
   PARALLAX-LIKE EFFECT FOR AI BRAIN
   ======================================== */
(function() {
    const brain = document.querySelector('.hero-visual');
    if (!brain) return;

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        brain.style.transform = `translate(${x}px, ${y}px)`;
    });
})();

/* ========================================
   CONSOLE EASTER EGG
   ======================================== */
console.log('%c⚡ Jheferson Cholan - Portfolio', 'font-size: 24px; font-weight: bold; color: #00f0ff;');
console.log('%c¿Interesado en el código? ¡Conectemos!', 'font-size: 14px; color: #7b2ffc;');
console.log('%c> github.com/JHEFER26-NEW', 'font-size: 12px; color: #a0a0b8;');

/* ========================================
   1. 3D TILT EFFECT ON PROJECT CARDS
   Premium parallax-tilt on hover using rAF
   ======================================== */
(function() {
    const TILT_MAX = 15; // degrees
    const PERSPECTIVE = 800; // px

    document.querySelectorAll('.project-card').forEach(function(card) {
        let rafId = null;
        let target = { rx: 0, ry: 0 };
        let current = { rx: 0, ry: 0 };
        let isHovering = false;

        // Ensure card can host 3D transforms
        card.style.transformStyle = 'preserve-3d';
        card.style.willChange = 'transform';

        function lerp(a, b, t) {
            return a + (b - a) * t;
        }

        function animate() {
            current.rx = lerp(current.rx, target.rx, 0.08);
            current.ry = lerp(current.ry, target.ry, 0.08);

            card.style.transform =
                'perspective(' + PERSPECTIVE + 'px) rotateX(' + current.rx.toFixed(2) + 'deg) rotateY(' + current.ry.toFixed(2) + 'deg)';

            // Keep animating until settled
            if (Math.abs(current.rx - target.rx) > 0.01 || Math.abs(current.ry - target.ry) > 0.01) {
                rafId = requestAnimationFrame(animate);
            } else {
                current.rx = target.rx;
                current.ry = target.ry;
                card.style.transform =
                    'perspective(' + PERSPECTIVE + 'px) rotateX(' + current.rx.toFixed(2) + 'deg) rotateY(' + current.ry.toFixed(2) + 'deg)';
                rafId = null;
            }
        }

        card.addEventListener('mousemove', function(e) {
            isHovering = true;
            var rect = card.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width;  // 0..1
            var y = (e.clientY - rect.top) / rect.height;   // 0..1

            target.ry = (x - 0.5) * TILT_MAX * 2;   // left/right
            target.rx = -(y - 0.5) * TILT_MAX * 2;   // up/down (inverted)

            if (!rafId) {
                rafId = requestAnimationFrame(animate);
            }
        });

        card.addEventListener('mouseleave', function() {
            isHovering = false;
            target.rx = 0;
            target.ry = 0;
            if (!rafId) {
                rafId = requestAnimationFrame(animate);
            }
        });
    });
})();

/* ========================================
   2. SPOTLIGHT / GLOW EFFECT ON CARDS
   Radial gradient follows cursor via
   CSS custom properties + ::before
   ======================================== */
(function() {
    var GLOW_SELECTORS = '.project-card, .skill-category, .contact-link, .timeline-card';
    var glowTargets = document.querySelectorAll(GLOW_SELECTORS);

    glowTargets.forEach(function(el) {
        // Mark element so CSS ::before can pick up the custom props
        el.classList.add('has-spotlight');

        el.addEventListener('mousemove', function(e) {
            var rect = el.getBoundingClientRect();
            el.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
            el.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        });

        el.addEventListener('mouseenter', function() {
            el.style.setProperty('--spotlight-opacity', '1');
        });

        el.addEventListener('mouseleave', function() {
            el.style.setProperty('--spotlight-opacity', '0');
        });
    });

    // Inject spotlight CSS once (no external stylesheet dependency)
    var style = document.createElement('style');
    style.textContent =
        '.has-spotlight { position: relative; overflow: hidden; }' +
        '.has-spotlight::after {' +
        '  content: "";' +
        '  position: absolute;' +
        '  top: 0; left: 0; width: 100%; height: 100%;' +
        '  background: radial-gradient(circle 250px at var(--mouse-x, 50%) var(--mouse-y, 50%),' +
        '    rgba(0, 240, 255, 0.12), transparent 70%);' +
        '  opacity: var(--spotlight-opacity, 0);' +
        '  transition: opacity 0.35s ease;' +
        '  pointer-events: none;' +
        '  z-index: 1;' +
        '  border-radius: inherit;' +
        '}';
    document.head.appendChild(style);
})();

/* ========================================
   3. MAGNETIC BUTTON EFFECT
   Buttons subtly pull toward the cursor
   within a 100px proximity radius
   ======================================== */
(function() {
    var MAGNETIC_RANGE = 100; // px from button center
    var PULL_STRENGTH = 0.35; // fraction of distance to translate

    document.querySelectorAll('.btn').forEach(function(btn) {
        var currentX = 0;
        var currentY = 0;
        var targetX = 0;
        var targetY = 0;
        var rafId = null;

        function springAnimate() {
            currentX += (targetX - currentX) * 0.15;
            currentY += (targetY - currentY) * 0.15;

            btn.style.transform = 'translate(' + currentX.toFixed(1) + 'px, ' + currentY.toFixed(1) + 'px)';

            if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
                rafId = requestAnimationFrame(springAnimate);
            } else {
                currentX = targetX;
                currentY = targetY;
                btn.style.transform = 'translate(' + currentX.toFixed(1) + 'px, ' + currentY.toFixed(1) + 'px)';
                rafId = null;
            }
        }

        btn.addEventListener('mousemove', function(e) {
            var rect = btn.getBoundingClientRect();
            var btnCenterX = rect.left + rect.width / 2;
            var btnCenterY = rect.top + rect.height / 2;
            var dx = e.clientX - btnCenterX;
            var dy = e.clientY - btnCenterY;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAGNETIC_RANGE) {
                targetX = dx * PULL_STRENGTH;
                targetY = dy * PULL_STRENGTH;
            } else {
                targetX = 0;
                targetY = 0;
            }

            if (!rafId) {
                rafId = requestAnimationFrame(springAnimate);
            }
        });

        btn.addEventListener('mouseleave', function() {
            targetX = 0;
            targetY = 0;
            if (!rafId) {
                rafId = requestAnimationFrame(springAnimate);
            }
        });
    });
})();

/* ========================================
   4. STAGGERED SKILL TAG REVEAL
   Tags cascade in one by one when their
   parent .skill-category scrolls into view
   ======================================== */
(function() {
    var STAGGER_DELAY = 50; // ms between each tag

    // Inject animation CSS
    var style = document.createElement('style');
    style.textContent =
        '.skill-tag {' +
        '  opacity: 0;' +
        '  transform: translateY(12px) scale(0.9);' +
        '  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);' +
        '}' +
        '.skill-category.tags-revealed .skill-tag {' +
        '  opacity: 1;' +
        '  transform: translateY(0) scale(1);' +
        '}';
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && !entry.target.classList.contains('tags-revealed')) {
                var tags = entry.target.querySelectorAll('.skill-tag');
                tags.forEach(function(tag, index) {
                    tag.style.transitionDelay = (index * STAGGER_DELAY) + 'ms';
                });
                // Trigger on next frame so the delay values are applied first
                requestAnimationFrame(function() {
                    entry.target.classList.add('tags-revealed');
                });
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.skill-category').forEach(function(cat) {
        observer.observe(cat);
    });
})();

/* ========================================
   5. TEXT REVEAL ANIMATION (CLIP-PATH)
   Section titles wipe in from left when
   they scroll into the viewport
   ======================================== */
(function() {
    // Inject clip-path animation CSS
    var style = document.createElement('style');
    style.textContent =
        '.section-title {' +
        '  clip-path: inset(0 100% 0 0);' +
        '  transition: clip-path 0.9s cubic-bezier(0.77, 0, 0.175, 1);' +
        '}' +
        '.section-title.text-revealed {' +
        '  clip-path: inset(0 0% 0 0);' +
        '}';
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('text-revealed');
                observer.unobserve(entry.target); // one-shot
            }
        });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section-title').forEach(function(title) {
        observer.observe(title);
    });
})();

/* ========================================
   6. SMOOTH COUNTER WITH easeOutExpo
   Replaces the linear counter with a
   satisfying ease-out exponential curve
   ======================================== */
(function() {
    var DURATION = 2000; // ms

    function easeOutExpo(t) {
        return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animateCounter(el) {
        var target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;

        var start = performance.now();

        function tick(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / DURATION, 1);
            var easedProgress = easeOutExpo(progress);
            var value = Math.round(easedProgress * target);

            el.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    // Observe .hero-stats with a fresh observer so it doesn't clash
    var heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        var alreadyFired = false;
        var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !alreadyFired) {
                    alreadyFired = true;
                    document.querySelectorAll('.stat-number').forEach(animateCounter);
                    counterObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });

        counterObserver.observe(heroStats);
    }
})();
