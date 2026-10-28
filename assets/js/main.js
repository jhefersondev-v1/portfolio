/**
 * PORTAFOLIO PROFESIONAL - JRCHOLAN (Jheferson Cholan)
 * https://jrcholan.lat/
 * Apple Liquid Glass Design System - Scripts & Interactions
 */

(function whenPortfolioReady(initialize) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})(() => {
    // -------------------------------------------------------------------------
    // 1. INICIALIZACIÓN DE ICONOS LUCIDE
    // -------------------------------------------------------------------------
    const refreshIcons = () => {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    };
    refreshIcons();

    // -------------------------------------------------------------------------
    // GOOGLE ANALYTICS 4 EVENT DISPATCHER & PRIVACY TOOLS
    // -------------------------------------------------------------------------
    const trackEvent = (eventName, params = {}) => {
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, params);
            }
        } catch (e) {}
    };

    const clearAnalyticsCookies = () => {
        try {
            const cookies = document.cookie.split(';');
            cookies.forEach((c) => {
                const name = c.split('=')[0].trim();
                if (name === '_ga' || name.startsWith('_ga_')) {
                    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=${window.location.hostname}; SameSite=Lax`;
                    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
                }
            });
        } catch (e) {}
    };

    // -------------------------------------------------------------------------
    // 2. SISTEMA DE TEMA APPLE (LIGHT / DARK THEME SWITCHER)
    // -------------------------------------------------------------------------
    const themeToggle = document.getElementById('themeToggle');
    const themeColorMeta = document.getElementById('themeColorMeta');
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const observeMedia = (query, listener) => {
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', listener);
        } else if (typeof query.addListener === 'function') {
            query.addListener(listener);
        }
    };
    const readSavedTheme = () => {
        try {
            const saved = localStorage.getItem('theme');
            return saved === 'dark' || saved === 'light' ? saved : null;
        } catch (error) {
            return null;
        }
    };
    let selectedTheme = readSavedTheme();

    const getPreferredTheme = () => {
        return selectedTheme || (colorScheme.matches ? 'dark' : 'light');
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', theme === 'dark' ? '#050507' : '#FFFFFF');
        }
        if (themeToggle) {
            themeToggle.setAttribute(
                'aria-label',
                theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            );
            themeToggle.setAttribute(
                'title',
                theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'
            );
        }
    };

    // Aplicar tema inicial
    applyTheme(getPreferredTheme());

    // Botón de alternancia de tema
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            selectedTheme = newTheme;
            try {
                localStorage.setItem('theme', newTheme);
            } catch (error) {
                // El tema sigue funcionando si el navegador bloquea el almacenamiento.
            }
            applyTheme(newTheme);
            trackEvent('select_theme', { theme_name: newTheme });
        });
    }

    // Escuchar cambios de preferencia del sistema si el usuario no tiene guardado un tema fijo
    observeMedia(colorScheme, (e) => {
        if (!selectedTheme) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== 'theme' && event.key !== null) return;
        selectedTheme = readSavedTheme();
        applyTheme(getPreferredTheme());
    });

    // -------------------------------------------------------------------------
    // 3. TOAST NOTIFICATION & COPIAR CORREO (QUICK ACTIONS)
    // -------------------------------------------------------------------------
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    let toastTimer = null;
    let toastHideTimer = null;

    const showToast = (message = 'Correo copiado al portapapeles') => {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.hidden = false;
        toast.classList.add('show');

        clearTimeout(toastTimer);
        clearTimeout(toastHideTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toastHideTimer = setTimeout(() => {
                toast.hidden = true;
            }, 300);
        }, 3200);
    };

    document.querySelectorAll('[data-copy-email]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = btn.dataset.copyEmail || 'jheferson6666@gmail.com';
            trackEvent('contact_action', { action_type: 'copy_email' });
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(email);
                } else {
                    // Fallback para navegadores antiguos
                    const textarea = document.createElement('textarea');
                    textarea.value = email;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    let copied = false;
                    try {
                        copied = document.execCommand('copy');
                    } finally {
                        textarea.remove();
                        btn.focus({ preventScroll: true });
                    }
                    if (!copied) throw new Error('Clipboard unavailable');
                }
                showToast(`¡Copiado!: ${email}`);

                // Feedback visual en el botón
                const copyText = btn.querySelector('.copy-text');
                if (copyText) {
                    const originalText = copyText.textContent;
                    copyText.textContent = '¡Copiado!';
                    setTimeout(() => {
                        copyText.textContent = originalText;
                    }, 2000);
                }
            } catch (err) {
                showToast('No se pudo copiar automáticamente.');
            }
        });
    });

    // -------------------------------------------------------------------------
    // 4. FLOATING CAPSULE NAVBAR, DROPDOWN & MENÚ MÓVIL (APPLE V2)
    // -------------------------------------------------------------------------
    const navDropdownBtn = document.getElementById('navDropdownBtn');
    const navDropdownMenu = document.getElementById('navDropdownMenu');
    const dropdownLinks = [...document.querySelectorAll('.dropdown-link')];
    const primaryNavLinks = [...document.querySelectorAll('.nav-links > .nav-link')];

    const navToggle = document.getElementById('navToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileNavLinks = [...document.querySelectorAll('.mobile-nav-link')];
    const desktopNavigation = window.matchMedia('(min-width: 861px)');

    const closeDropdown = () => {
        if (!navDropdownBtn || !navDropdownMenu) return;
        navDropdownMenu.classList.remove('open');
        navDropdownMenu.inert = true;
        navDropdownBtn.setAttribute('aria-expanded', 'false');
    };

    const openDropdown = () => {
        if (!navDropdownBtn || !navDropdownMenu) return;
        navDropdownMenu.inert = false;
        navDropdownMenu.classList.add('open');
        navDropdownBtn.setAttribute('aria-expanded', 'true');
    };

    if (navDropdownBtn && navDropdownMenu) {
        closeDropdown();
        navDropdownBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = navDropdownMenu.classList.contains('open');
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        navDropdownBtn.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            openDropdown();
            const link = event.key === 'ArrowUp' ? dropdownLinks.at(-1) : dropdownLinks[0];
            link?.focus();
        });

        navDropdownMenu.addEventListener('keydown', (event) => {
            const index = dropdownLinks.indexOf(document.activeElement);
            if (index < 0) return;
            let nextIndex = index;
            if (event.key === 'ArrowDown') nextIndex = (index + 1) % dropdownLinks.length;
            else if (event.key === 'ArrowUp') nextIndex = (index - 1 + dropdownLinks.length) % dropdownLinks.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = dropdownLinks.length - 1;
            else return;
            event.preventDefault();
            dropdownLinks[nextIndex]?.focus();
        });

        navDropdownBtn.closest('.nav-dropdown-wrapper')?.addEventListener('focusout', (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) closeDropdown();
        });

        dropdownLinks.forEach((link) => {
            link.addEventListener('click', () => {
                closeDropdown();
            });
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.nav-dropdown-wrapper')) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navDropdownMenu.classList.contains('open')) {
                closeDropdown();
                navDropdownBtn.focus();
            }
        });
    }

    const closeMobileDrawer = () => {
        if (!navToggle || !mobileDrawer) return;
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        mobileDrawer.classList.remove('open');
        mobileDrawer.inert = true;
        setTimeout(() => {
            if (!mobileDrawer.classList.contains('open')) {
                mobileDrawer.setAttribute('hidden', '');
            }
        }, 280);
    };

    const openMobileDrawer = () => {
        if (!navToggle || !mobileDrawer) return;
        closeDropdown();
        mobileDrawer.removeAttribute('hidden');
        mobileDrawer.inert = false;
        void mobileDrawer.offsetHeight;
        mobileDrawer.classList.add('open');
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
        mobileNavLinks[0]?.focus({ preventScroll: true });
    };

    if (navToggle && mobileDrawer) {
        mobileDrawer.inert = true;
        navToggle.addEventListener('click', () => {
            const isOpen = mobileDrawer.classList.contains('open');
            if (isOpen) {
                closeMobileDrawer();
            } else {
                openMobileDrawer();
            }
        });

        mobileNavLinks.forEach((link) => {
            link.addEventListener('click', () => {
                closeMobileDrawer();
            });
        });

        document.addEventListener('click', (event) => {
            if (mobileDrawer.classList.contains('open') && !event.target.closest('#mainNav')) {
                closeMobileDrawer();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!mobileDrawer.classList.contains('open')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMobileDrawer();
                navToggle.focus();
            }
        });

        document.getElementById('mainNav')?.addEventListener('focusout', (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) closeMobileDrawer();
        });

        observeMedia(desktopNavigation, (event) => {
            const desktopLinkFocused = document.getElementById('navLinks')?.contains(document.activeElement);
            closeDropdown();
            if (!event.matches) {
                navDroplet?.classList.remove('is-ready');
                if (desktopLinkFocused) navToggle.focus({ preventScroll: true });
                return;
            }
            const moveFocus = mobileDrawer.contains(document.activeElement);
            closeMobileDrawer();
            if (moveFocus) primaryNavLinks[0]?.focus({ preventScroll: true });
            if (currentDropletTarget) {
                updateDroplet(currentDropletTarget, true);
            }
        });
    }

    // Las páginas de casos conservan una cabecera compacta sin duplicar el menú principal.
    const caseToggle = document.querySelector('.case-page .nav-toggle');
    const caseMenu = document.querySelector('.case-page #main-nav');
    if (caseToggle && caseMenu) {
        const setCaseMenu = (open) => {
            const isOpen = open && !desktopNavigation.matches;
            const restoreToggleFocus = !isOpen && !desktopNavigation.matches && caseMenu.contains(document.activeElement);
            caseMenu.classList.toggle('open', isOpen);
            caseMenu.hidden = !desktopNavigation.matches && !isOpen;
            caseMenu.inert = caseMenu.hidden;
            caseToggle.classList.toggle('active', isOpen);
            caseToggle.setAttribute('aria-expanded', String(isOpen));
            caseToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
            if (isOpen) caseMenu.querySelector('a')?.focus({ preventScroll: true });
            else if (restoreToggleFocus) caseToggle.focus({ preventScroll: true });
        };
        setCaseMenu(false);
        caseToggle.addEventListener('click', () => setCaseMenu(!caseMenu.classList.contains('open')));
        caseMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setCaseMenu(false)));
        document.addEventListener('keydown', (event) => {
            if (!caseMenu.classList.contains('open')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                setCaseMenu(false);
                caseToggle.focus();
            }
        });
        caseToggle.closest('.site-header')?.addEventListener('focusout', (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setCaseMenu(false);
        });
        document.addEventListener('click', (event) => {
            if (caseMenu.classList.contains('open') && !event.target.closest('.case-page .site-header')) setCaseMenu(false);
        });
        observeMedia(desktopNavigation, () => {
            const moveFocus = desktopNavigation.matches && document.activeElement === caseToggle;
            setCaseMenu(false);
            if (moveFocus) caseMenu.querySelector('a')?.focus({ preventScroll: true });
        });
    }

    // -------------------------------------------------------------------------
    // 5. RESALTADO DE SECCIÓN ACTIVA & LIQUID GLASS WATER DROPLET (APPLE V6)
    // -------------------------------------------------------------------------
    const sections = [...document.querySelectorAll('.section-anchor')];
    const subNavIds = ['skills', 'technologies', 'ai', 'formation', 'certifications'];

    const navDroplet = document.getElementById('navDroplet');
    const navLinksContainer = document.getElementById('navLinks');
    let lastDropletX = null;
    let stretchTimer = null;
    let currentDropletTarget = null;

    const updateDroplet = (targetEl, immediate = false) => {
        if (!navDroplet || !navLinksContainer || !targetEl) return;
        if (!desktopNavigation.matches) {
            navDroplet.classList.remove('is-ready');
            return;
        }

        const containerRect = navLinksContainer.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const left = Math.round(targetRect.left - containerRect.left + navLinksContainer.scrollLeft);
        const top = Math.round(targetRect.top - containerRect.top + navLinksContainer.scrollTop);
        const width = Math.round(targetRect.width);
        const height = Math.round(targetRect.height);

        if (width === 0 || height === 0) return;

        currentDropletTarget = targetEl;

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (immediate || lastDropletX === null || isReducedMotion) {
            navDroplet.style.transition = 'none';
            navDroplet.style.left = `${left}px`;
            navDroplet.style.top = `${top}px`;
            navDroplet.style.width = `${width}px`;
            navDroplet.style.height = `${height}px`;
            navDroplet.style.transform = 'scale(1, 1)';
            void navDroplet.offsetHeight;
            navDroplet.style.transition = '';
            navDroplet.classList.add('is-ready');
            lastDropletX = left;
            return;
        }

        const deltaX = left - lastDropletX;
        if (Math.abs(deltaX) > 6) {
            const stretch = Math.min(Math.abs(deltaX) / 180, 0.28);
            if (deltaX > 0) {
                navDroplet.style.transformOrigin = 'left center';
            } else {
                navDroplet.style.transformOrigin = 'right center';
            }
            navDroplet.style.transform = `scaleX(${1 + stretch}) scaleY(${1 - stretch * 0.35})`;
        }

        navDroplet.style.left = `${left}px`;
        navDroplet.style.top = `${top}px`;
        navDroplet.style.width = `${width}px`;
        navDroplet.style.height = `${height}px`;
        navDroplet.classList.add('is-ready');
        lastDropletX = left;

        clearTimeout(stretchTimer);
        stretchTimer = setTimeout(() => {
            navDroplet.style.transform = 'scale(1, 1)';
        }, 220);
    };

    const setActiveLink = (id) => {
        let activeEl = null;

        primaryNavLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
                activeEl = link;
            } else {
                link.removeAttribute('aria-current');
            }
        });

        dropdownLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (navDropdownBtn) {
            const isSubActive = subNavIds.includes(id);
            navDropdownBtn.classList.toggle('active', isSubActive);
            if (isSubActive) {
                activeEl = navDropdownBtn;
            }
        }

        mobileNavLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (activeEl) {
            updateDroplet(activeEl);
        }
    };

    primaryNavLinks.forEach((link) => {
        link.addEventListener('click', () => {
            updateDroplet(link);
            trackEvent('navigation_click', { destination: link.getAttribute('href') || '' });
        });
    });

    if (navDropdownBtn) {
        navDropdownBtn.addEventListener('click', () => {
            updateDroplet(navDropdownBtn);
        });
    }

    window.addEventListener('resize', () => {
        if (currentDropletTarget) {
            updateDroplet(currentDropletTarget, true);
        }
    }, { passive: true });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            if (currentDropletTarget) {
                updateDroplet(currentDropletTarget, true);
            }
        });
    }

    if ('IntersectionObserver' in window && sections.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveLink(entry.target.id);
                }
            });
        }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

        sections.forEach((section) => sectionObserver.observe(section));
    }

    const initialTarget = primaryNavLinks.find((link) => link.classList.contains('active')) || primaryNavLinks[0];
    if (initialTarget) {
        requestAnimationFrame(() => {
            updateDroplet(initialTarget, true);
        });
    }

    // -------------------------------------------------------------------------
    // 6. ANIMACIONES DE REVELADO (SCROLL REVEAL)
    // -------------------------------------------------------------------------
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionPreference.matches;
    const revealElements = document.querySelectorAll('.reveal');
    let revealObserver = null;
    const revealAll = () => {
        revealObserver?.disconnect();
        revealElements.forEach((el) => el.classList.add('visible'));
    };

    if (prefersReducedMotion) {
        revealAll();
    } else if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

        document.documentElement.classList.add('reveal-ready');
        revealElements.forEach((el) => revealObserver.observe(el));
    } else {
        revealAll();
    }
    observeMedia(motionPreference, (event) => {
        prefersReducedMotion = event.matches;
        if (prefersReducedMotion) revealAll();
    });

    // -------------------------------------------------------------------------
    // 7. CIFRAS INMEDIATAS BASADAS EN EL CONTENIDO DOCUMENTADO
    // -------------------------------------------------------------------------
    const projectCards = [...document.querySelectorAll('.projects-grid .project-card')];
    const certificationCards = [...document.querySelectorAll('#certifications .certificate-card')];

    // Contar herramientas y tecnologías, sin categorías ni conceptos de programación.
    const techSet = new Set();
    const technologyAliases = { HTML: 'HTML5', CSS: 'CSS3' };
    document.querySelectorAll('#technologies .technology-card strong, #technologies img.ai-logo, .project-card .project-tags span').forEach((element) => {
        const text = (element.tagName === 'IMG' ? element.alt : element.textContent).trim();
        if (!text || ['AI / ML', 'AI / ML Stack', 'POO'].includes(text)) return;
        techSet.add(technologyAliases[text] || text);
    });

    const stats = {
        projects: projectCards.length,
        technologies: techSet.size,
        certifications: certificationCards.length
    };

    const projectCountEl = document.querySelector('[data-project-count]');
    if (projectCountEl) {
        projectCountEl.textContent = stats.projects;
    }

    Object.entries(stats).forEach(([name, value]) => {
        document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
            element.textContent = value;
        });
    });

    // -------------------------------------------------------------------------
    // 8. FILTRADO ACCESIBLE DE PROYECTOS (BENTO TABS)
    // -------------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;

            trackEvent('filter_projects', { filter_category: filter });

            // Actualizar botones y estados ARIA
            filterButtons.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });

            // Filtrar tarjetas
            let visibleCount = 0;
            projectCards.forEach((card) => {
                const shouldShow = filter === 'all' || card.dataset.type === filter;
                card.classList.toggle('hidden', !shouldShow);
                if (shouldShow) visibleCount++;
            });

            // Actualizar contador
            if (projectCountEl) {
                projectCountEl.textContent = visibleCount;
            }
        });
    });

    // -------------------------------------------------------------------------
    // 9. VALIDACIÓN DEL FORMULARIO DE CONTACTO Y PRIVACIDAD
    // -------------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm && formStatus) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const privacyCheckbox = document.getElementById('privacyConsent');

        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const messageError = document.getElementById('messageError');
        const privacyError = document.getElementById('privacyError');

        const clearErrors = () => {
            [nameInput, emailInput, messageInput, privacyCheckbox].forEach((input) => {
                input?.classList.remove('field-invalid');
                input?.removeAttribute('aria-invalid');
            });
            [nameError, emailError, messageError, privacyError].forEach((el) => {
                if (el) el.textContent = '';
            });
            formStatus.textContent = '';
            formStatus.className = 'form-status';
        };

        const validateEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        // Limpiar errores en tiempo real al escribir
        [[nameInput, nameError], [emailInput, emailError], [messageInput, messageError]].forEach(([input, error]) => {
            input?.addEventListener('input', () => {
                input.classList.remove('field-invalid');
                input.removeAttribute('aria-invalid');
                if (error) error.textContent = '';
            });
        });

        privacyCheckbox?.addEventListener('change', () => {
            privacyCheckbox.classList.remove('field-invalid');
            privacyCheckbox.removeAttribute('aria-invalid');
            if (privacyError) privacyError.textContent = '';
        });

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearErrors();

            let isValid = true;
            let firstInvalidField = null;

            // Validación Nombre
            const nameVal = nameInput ? nameInput.value.trim() : '';
            if (!nameVal || nameVal.length < 2) {
                isValid = false;
                nameInput?.classList.add('field-invalid');
                nameInput?.setAttribute('aria-invalid', 'true');
                if (nameError) nameError.textContent = 'Por favor, ingresa tu nombre (mínimo 2 caracteres).';
                if (!firstInvalidField) firstInvalidField = nameInput;
            }

            // Validación Correo
            const emailVal = emailInput ? emailInput.value.trim() : '';
            if (!emailVal || !validateEmail(emailVal)) {
                isValid = false;
                emailInput?.classList.add('field-invalid');
                emailInput?.setAttribute('aria-invalid', 'true');
                if (emailError) emailError.textContent = 'Por favor, ingresa un correo electrónico válido.';
                if (!firstInvalidField) firstInvalidField = emailInput;
            }

            // Validación Mensaje
            const messageVal = messageInput ? messageInput.value.trim() : '';
            if (!messageVal || messageVal.length < 5) {
                isValid = false;
                messageInput?.classList.add('field-invalid');
                messageInput?.setAttribute('aria-invalid', 'true');
                if (messageError) messageError.textContent = 'Por favor, describe brevemente tu consulta (mínimo 5 caracteres).';
                if (!firstInvalidField) firstInvalidField = messageInput;
            }

            // Validación Consentimiento de Privacidad (OBLIGATORIO)
            if (!privacyCheckbox || !privacyCheckbox.checked) {
                isValid = false;
                privacyCheckbox?.classList.add('field-invalid');
                privacyCheckbox?.setAttribute('aria-invalid', 'true');
                if (privacyError) privacyError.textContent = 'Debes aceptar la Política de Privacidad para continuar.';
                if (!firstInvalidField) firstInvalidField = privacyCheckbox;
            }

            if (!isValid) {
                formStatus.textContent = 'Por favor, revisa los campos señalados antes de enviar.';
                formStatus.className = 'form-status error';
                firstInvalidField?.focus();
                return;
            }

            // Generar correo mediante mailto seguro
            const subject = `Contacto desde jrcholan.lat: ${nameVal}`;
            const body = `Hola Jheferson,\n\nMi nombre es: ${nameVal}\nCorreo de contacto: ${emailVal}\n\nMensaje:\n${messageVal}\n\n---\nHe aceptado los términos y la política de privacidad de jrcholan.lat`;
            const mailtoUri = `mailto:jheferson6666@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            formStatus.textContent = 'Abriendo tu cliente de correo para completar el envío...';
            formStatus.className = 'form-status success';

            window.location.href = mailtoUri;
        });
    }

    // -------------------------------------------------------------------------
    // 10. MODAL DE PROYECTOS ACCESIBLE (WCAG 2.2 COMPLIANT)
    // -------------------------------------------------------------------------
    const projectData = {
        library: {
            title: 'Sistema de Gestión de Biblioteca',
            type: 'Software · Desktop',
            year: '2024',
            status: 'Completado',
            summary: 'Aplicación de escritorio para registrar, buscar, modificar y eliminar libros, autores y disponibilidad de ejemplares.',
            problem: 'Centralizar y agilizar el registro, control de inventario y consulta de libros, autores y disponibilidad en una interfaz de escritorio intuitiva.',
            solution: 'Desarrollo de aplicación de escritorio basada en Java Swing aplicando principios de POO, arquitectura por capas y persistencia relacional con MySQL.',
            technologies: 'Java Swing · NetBeans · MySQL · POO',
            images: [
                ['assets/images/biblioteca-dashboard.webp', 'Dashboard principal del sistema de biblioteca'],
                ['assets/images/biblioteca-libros.webp', 'Módulo de listado y consulta de libros'],
                ['assets/images/biblioteca-formulario.webp', 'Formulario para registro y edición de ejemplares']
            ]
        },
        atm: {
            title: 'Sistema de Cajero Automático',
            type: 'Software · Desktop',
            year: '2024',
            status: 'Completado',
            summary: 'Simulador bancario con operaciones de depósito, retiro y consulta de saldo, con validación de seguridad e interfaz gráfica.',
            problem: 'Modelar de forma robusta las transacciones financieras esenciales de un cajero con validación de credenciales, límites y saldos disponibles.',
            solution: 'Simulador desarrollado con Java Swing y POO estructurado con control de excepciones, validación estricta de cuentas y persistencia.',
            technologies: 'Java Swing · POO · NetBeans',
            images: [
                ['assets/images/cajero-login.webp', 'Pantalla de acceso y autenticación'],
                ['assets/images/cajero-menu.webp', 'Menú principal de selección de operaciones'],
                ['assets/images/cajero-operacion.webp', 'Pantalla de ejecución y confirmación de operación']
            ]
        },
        votacion: {
            title: 'Sistema de Votación',
            type: 'Sistemas · Web',
            year: '2025',
            status: 'Documentado',
            summary: 'Plataforma web con pantallas reales de inicio, selección de candidatos y emisión de resultados en tiempo real.',
            problem: 'Digitalizar y ordenar el flujo de votación estudiantil o institucional evitando inconsistencias y duplicidad en los votos.',
            solution: 'Sistema web interactivo desarrollado con HTML, CSS, JavaScript y PHP que organiza de forma clara las fases de votación y cómputo.',
            technologies: 'HTML · CSS · JavaScript · PHP',
            images: [
                ['assets/images/votacion-inicio.webp', 'Pantalla de bienvenida y verificación'],
                ['assets/images/votacion-eleccion.webp', 'Módulo de selección de lista o candidato'],
                ['assets/images/votacion-resultado.webp', 'Panel de resumen y resultados de la votación']
            ]
        },
        tasks: {
            title: 'Task Manager / Sistema de Gestión de Tareas',
            type: 'Web · Productividad',
            year: '2025',
            status: 'Documentado',
            summary: 'Interfaz de gestión de tareas con panel de control (dashboard), listado detallado y módulo de creación de actividades.',
            problem: 'Proporcionar una forma limpia y ágil de organizar pendientes personales o de proyectos categorizados por estado y prioridad.',
            solution: 'Aplicación web interactiva con arquitectura frontend moderna que permite crear, filtrar y gestionar tareas eficientemente.',
            technologies: 'HTML · CSS · JavaScript',
            images: [
                ['assets/images/taskmanager-dashboard.webp', 'Dashboard de resumen de tareas y métricas'],
                ['assets/images/taskmanager-tareas.webp', 'Vista de lista con filtros de estado'],
                ['assets/images/taskmanager-formulario.webp', 'Formulario para agregar y editar actividades']
            ]
        },
        ecommerce: {
            title: 'CALZATURE D’VIDALE',
            type: 'Web · E-commerce',
            year: '2025',
            status: 'En desarrollo',
            summary: 'Tienda virtual con gestión de usuarios, catálogo por categorías, carrito de compras y módulo de pagos.',
            problem: 'Brindar a un negocio local de calzado una vitrina digital moderna con catálogo navegable y flujo de compra automatizado.',
            solution: 'Plataforma web desarrollada en PHP, MySQL, JavaScript y estilos personalizados con navegación de productos y pedidos.',
            technologies: 'HTML · CSS · JavaScript · PHP · MySQL',
            images: [
                ['assets/images/ecommerce-home.webp', 'Página de inicio con vitrina destacada'],
                ['assets/images/ecommerce-productos.webp', 'Catálogo de calzado con filtros'],
                ['assets/images/ecommerce-login.webp', 'Módulo de inicio de sesión de clientes']
            ]
        },
        ml: {
            title: 'Proyecto de Machine Learning',
            type: 'IA · Machine Learning',
            year: '2025',
            status: 'Completado',
            summary: 'Análisis, depuración y modelado predictivo sobre datasets reales utilizando librerías científicas de Python.',
            problem: 'Identificar patrones y predecir comportamientos a partir de datasets multidimensionales mediante algoritmos de aprendizaje supervisado.',
            solution: 'Pipeline integral en Python con limpieza en Pandas/NumPy, visualización de matrices y entrenamiento de clasificadores en Scikit-learn.',
            technologies: 'Python · Pandas · NumPy · Scikit-learn',
            images: [
                ['assets/images/ml-dataset.webp', 'Estructura e inspección del dataset de trabajo'],
                ['assets/images/ml-grafico.webp', 'Visualización de correlaciones y gráficos del modelo'],
                ['assets/images/ml-resultado.webp', 'Métricas de evaluación y matriz de confusión']
            ]
        },
        yolo: {
            title: 'Computer Vision con YOLO',
            type: 'AI · Computer Vision',
            year: '2025',
            status: 'Documentado',
            summary: 'Detección e inferencia de objetos en tiempo real empleando la arquitectura YOLO y OpenCV.',
            problem: 'Procesar flujos de imagen para reconocer y clasificar múltiples objetos con alta velocidad y precisión.',
            solution: 'Implementación con Python, OpenCV y modelos pre-entrenados YOLO para detección visual con bounding boxes y etiquetas.',
            technologies: 'Python · OpenCV · YOLO',
            images: [
                ['assets/images/ia-yolo.webp', 'Inferencia visual en tiempo real con YOLO']
            ]
        }
    };

    const dialog = document.getElementById('projectDialog');
    const dialogClose = document.getElementById('dialogClose');
    const dialogContent = document.getElementById('dialogContent');

    if (dialog && dialogClose && dialogContent) {
        let activeProjectKey = null;
        let activeImageIndex = 0;
        let lastFocusedElement = null;
        let backdropPointerDown = false;

        const closeDialog = () => {
            if (dialog.open) dialog.close();
        };

        dialog.addEventListener('close', () => {
            activeProjectKey = null;
            activeImageIndex = 0;
            // Devolver foco al elemento disparador
            if (lastFocusedElement?.isConnected) {
                lastFocusedElement.focus({ preventScroll: true });
            }
            lastFocusedElement = null;
        });

        dialogClose.addEventListener('click', closeDialog);

        // Cerrar al hacer clic en el backdrop
        dialog.addEventListener('pointerdown', (event) => {
            backdropPointerDown = event.target === dialog;
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog && backdropPointerDown) {
                closeDialog();
            }
            backdropPointerDown = false;
        });

        // Escape usa el evento nativo cancel; close limpia también ese camino.

        const renderProject = () => {
            const project = projectData[activeProjectKey];
            if (!project) return;

            const [src, alt] = project.images[activeImageIndex] || project.images[0];

            dialogContent.innerHTML = `
                <div class="dialog-heading">
                    <span class="project-label">${project.type}</span>
                    <h2 id="dialogTitle">${project.title}</h2>
                    <p>${project.summary}</p>
                </div>

                <div class="dialog-facts">
                    <div class="dialog-fact">
                        <span>Año</span>
                        <strong>${project.year}</strong>
                    </div>
                    <div class="dialog-fact">
                        <span>Estado</span>
                        <strong>${project.status}</strong>
                    </div>
                    <div class="dialog-fact">
                        <span>Tecnologías</span>
                        <strong>${project.technologies}</strong>
                    </div>
                    <div class="dialog-fact">
                        <span>Capturas</span>
                        <strong>${project.images.length}</strong>
                    </div>
                </div>

                <h3 class="dialog-section-title">Solución técnica</h3>
                <p>${project.solution}</p>

                <h3 class="dialog-section-title">Problema abordado</h3>
                <p>${project.problem}</p>

                <h3 class="dialog-section-title">Capturas del proyecto</h3>
                <div class="dialog-main-image">
                    <img src="${src}" alt="${alt}" loading="lazy">
                    <span aria-live="polite" aria-atomic="true">${activeImageIndex + 1} / ${project.images.length}</span>
                </div>

                ${project.images.length > 1 ? `
                    <div class="dialog-gallery">
                        ${project.images.map(([imageSrc, imageAlt], index) => `
                            <button class="dialog-thumb${index === activeImageIndex ? ' active' : ''}" type="button" data-image-index="${index}" aria-pressed="${index === activeImageIndex}" aria-label="Ver imagen ${index + 1}: ${imageAlt}">
                                <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
                            </button>
                        `).join('')}
                    </div>
                    <div class="dialog-gallery-controls">
                        <button type="button" class="button button-glass button-pill" data-gallery-action="previous" aria-label="Ver imagen anterior">
                            <i data-lucide="arrow-left" aria-hidden="true"></i>
                            <span>Anterior</span>
                        </button>
                        <button type="button" class="button button-glass button-pill" data-gallery-action="next" aria-label="Ver imagen siguiente">
                            <span>Siguiente</span>
                            <i data-lucide="arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                ` : ''}
            `;

            refreshIcons();
        };

        // Conservar los controles evita perder el foco y la posición al cambiar de captura.
        const updateGallery = () => {
            const project = projectData[activeProjectKey];
            if (!project) return;
            const [src, alt] = project.images[activeImageIndex];
            const image = dialogContent.querySelector('.dialog-main-image img');
            image.src = src;
            image.alt = alt;
            dialogContent.querySelector('.dialog-main-image > span').textContent = `${activeImageIndex + 1} / ${project.images.length}`;
            dialogContent.querySelectorAll('[data-image-index]').forEach((button) => {
                const isActive = Number(button.dataset.imageIndex) === activeImageIndex;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        };

        dialogContent.addEventListener('click', (event) => {
            const project = projectData[activeProjectKey];
            const button = event.target.closest('button');
            if (!project || !button) return;
            if (button.hasAttribute('data-image-index')) {
                activeImageIndex = Number(button.dataset.imageIndex);
            } else if (button.dataset.galleryAction === 'previous') {
                activeImageIndex = (activeImageIndex - 1 + project.images.length) % project.images.length;
            } else if (button.dataset.galleryAction === 'next') {
                activeImageIndex = (activeImageIndex + 1) % project.images.length;
            } else return;
            updateGallery();
        });

        // Disparadores de apertura del modal
        document.querySelectorAll('.project-detail').forEach((button) => {
            button.addEventListener('click', () => {
                const key = button.dataset.project;
                if (!projectData[key]) return;

                lastFocusedElement = button;
                activeProjectKey = key;
                trackEvent('select_content', { content_type: 'project', item_id: key });
                activeImageIndex = 0;
                renderProject();

                if (typeof dialog.showModal === 'function') {
                    dialog.showModal();
                    dialogClose.focus();
                }
            });
        });

        // Navegación por teclado dentro del modal (Flechas izquierda / derecha)
        dialog.addEventListener('keydown', (event) => {
            if (!activeProjectKey) return;
            const project = projectData[activeProjectKey];
            if (!project || project.images.length < 2) return;

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                activeImageIndex = (activeImageIndex + 1) % project.images.length;
                updateGallery();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                activeImageIndex = (activeImageIndex - 1 + project.images.length) % project.images.length;
                updateGallery();
            }
        });

        // Trap de foco accesible (Tab key cycling)
        dialog.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // 13. GOOGLE ANALYTICS 4 DOWNLOADS & CONSENT MODE MANAGER
    // -------------------------------------------------------------------------
    // Seguimiento de descargas de CV y certificados
    document.querySelectorAll('a[href$=".pdf"]').forEach((link) => {
        link.addEventListener('click', () => {
            const href = link.getAttribute('href') || '';
            const fileName = href.split('/').pop() || 'document.pdf';
            const isCV = href.toLowerCase().includes('cv');
            trackEvent('file_download', {
                file_name: fileName,
                file_extension: 'pdf',
                link_text: isCV ? 'CV' : (link.textContent ? link.textContent.trim() : 'Certificado')
            });
        });
    });

    const initCookieConsent = () => {
        const statusLabel = document.getElementById('consentStatusLabel');
        const legalAcceptBtn = document.getElementById('legalConsentAcceptBtn');
        const legalRejectBtn = document.getElementById('legalConsentRejectBtn');

        const updateStatusUI = (status) => {
            if (!statusLabel) return;
            if (status === 'granted') {
                statusLabel.innerHTML = '<span style="color: #30D158;">Concedido (Métricas activas)</span>';
            } else if (status === 'denied') {
                statusLabel.innerHTML = '<span style="color: #FF9F0A;">Rechazado (Solo cookies técnicas)</span>';
            } else {
                statusLabel.innerHTML = '<span>Sin configurar (Por defecto denegado)</span>';
            }
        };

        const currentConsent = (() => {
            try { return localStorage.getItem('analytics_consent'); } catch (e) { return null; }
        })();

        updateStatusUI(currentConsent);

        const setConsent = (granted) => {
            const val = granted ? 'granted' : 'denied';
            try { localStorage.setItem('analytics_consent', val); } catch (e) {}
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', { 'analytics_storage': val });
            }
            if (granted) {
                trackEvent('consent_update', { status: 'granted' });
            } else {
                clearAnalyticsCookies();
            }
            updateStatusUI(val);
        };

        legalAcceptBtn?.addEventListener('click', () => setConsent(true));
        legalRejectBtn?.addEventListener('click', () => setConsent(false));

        // Mostrar banner flotante Liquid Glass si el usuario aún no ha seleccionado preferencia
        if (currentConsent === null) {
            setTimeout(() => {
                if (document.getElementById('cookieBanner')) return;
                const banner = document.createElement('aside');
                banner.id = 'cookieBanner';
                banner.className = 'cookie-banner';
                banner.setAttribute('role', 'region');
                banner.setAttribute('aria-label', 'Consentimiento de cookies y privacidad');
                banner.innerHTML = `
                    <div class="cookie-banner-glass">
                        <div class="cookie-banner-content">
                            <div class="cookie-banner-icon" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                                    <path d="M8.5 8.5v.01"></path>
                                    <path d="M16 15.5v.01"></path>
                                    <path d="M12 12v.01"></path>
                                    <path d="M11 17v.01"></path>
                                    <path d="M7 13v.01"></path>
                                </svg>
                            </div>
                            <div class="cookie-banner-text">
                                <p><strong>Privacidad y Métricas:</strong> Utilizamos Google Analytics 4 de forma anónima para medir visitas y optimizar el portafolio. No recopilamos datos personales. Consulta la <a href="/privacidad.html" class="cookie-banner-link">Política de Privacidad</a>.</p>
                            </div>
                        </div>
                        <div class="cookie-banner-actions">
                            <button type="button" class="cookie-btn cookie-btn-reject" id="cookieRejectBtn">Solo necesarias</button>
                            <button type="button" class="cookie-btn cookie-btn-accept" id="cookieAcceptBtn">Aceptar analítica</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(banner);

                const acceptBtn = banner.querySelector('#cookieAcceptBtn');
                const rejectBtn = banner.querySelector('#cookieRejectBtn');

                const dismiss = () => {
                    banner.classList.remove('is-visible');
                    setTimeout(() => banner.remove(), 400);
                };

                acceptBtn?.addEventListener('click', () => {
                    setConsent(true);
                    dismiss();
                });

                rejectBtn?.addEventListener('click', () => {
                    setConsent(false);
                    dismiss();
                });

                requestAnimationFrame(() => banner.classList.add('is-visible'));
            }, 800);
        }
    };

    initCookieConsent();
});
