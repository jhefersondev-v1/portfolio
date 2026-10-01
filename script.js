/**
 * PORTAFOLIO PROFESIONAL - JRCHOLAN (Jheferson Cholan)
 * https://jrcholan.lat/
 * Script principal: interacciones, animaciones accesibles, filtros y modal
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de iconos Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    // 2. Control de navegación y menú móvil accesible
    const header = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = [...document.querySelectorAll('.nav-link')];

    // Sombra del header al hacer scroll
    const handleScrollHeader = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScrollHeader, { passive: true });
    handleScrollHeader();

    const closeMenu = () => {
        if (!navToggle || !navLinks) return;
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        navLinks.classList.remove('open');
    };

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        });

        // Cerrar al hacer clic en enlaces
        links.forEach((link) => link.addEventListener('click', closeMenu));

        // Cerrar al hacer clic fuera del menú
        document.addEventListener('click', (event) => {
            if (navLinks.classList.contains('open') && !header.contains(event.target)) {
                closeMenu();
            }
        });

        // Cerrar con tecla Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinks.classList.contains('open')) {
                closeMenu();
                navToggle.focus();
            }
        });
    }

    // 3. Resaltado de enlace activo mediante IntersectionObserver
    const sections = [...document.querySelectorAll('.section-anchor')];
    const setActiveLink = (id) => {
        links.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    if ('IntersectionObserver' in window && sections.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveLink(entry.target.id);
                }
            });
        }, { rootMargin: '-30% 0px -50% 0px', threshold: 0 });

        sections.forEach((section) => sectionObserver.observe(section));
    }

    // 4. Animaciones de revelado (Scroll Reveal) respetando prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
        revealElements.forEach((element) => element.classList.add('visible'));
    } else if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px' });

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('visible'));
    }

    // 5. Cálculo dinámico y animación robusta de contadores (Stat Counters)
    const projectCards = [...document.querySelectorAll('.projects-grid .project-card')];
    const certificationCards = [...document.querySelectorAll('#certifications .certificate-card')];

    // Extracción dinámica de tecnologías únicas presentes en el DOM
    const techSet = new Set();
    document.querySelectorAll('#technologies .technology-card strong').forEach((el) => {
        const text = el.textContent.trim();
        if (text && text !== 'AI / ML') techSet.add(text);
    });

    document.querySelectorAll('#technologies .technology-card span').forEach((el) => {
        const text = el.textContent.trim();
        if (text.includes('·')) {
            text.split('·').forEach((item) => {
                const cleaned = item.trim();
                if (cleaned) techSet.add(cleaned);
            });
        }
    });

    document.querySelectorAll('.project-tags span').forEach((el) => {
        const text = el.textContent.trim();
        if (text) techSet.add(text);
    });

    const stats = {
        projects: projectCards.length || 8,
        technologies: techSet.size > 0 ? techSet.size : 15,
        certifications: certificationCards.length || 4
    };

    // Actualizar indicador de cantidad de proyectos
    const projectCountEl = document.querySelector('[data-project-count]');
    if (projectCountEl) {
        projectCountEl.textContent = stats.projects;
    }

    const animateCounter = (element, targetValue, isPlus = false) => {
        if (prefersReducedMotion || targetValue <= 0) {
            element.textContent = isPlus ? `${targetValue}+` : targetValue;
            return;
        }

        const duration = 1100;
        const start = performance.now();
        const startValue = 0;

        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Función de suavizado cubic ease-out
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (targetValue - startValue) * easeOutProgress);

            element.textContent = (isPlus && progress >= 1) ? `${current}+` : current;

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            }
        };

        window.requestAnimationFrame(tick);
    };

    const proofStrip = document.querySelector('.proof-strip');
    let countersAnimated = false;

    const triggerCounters = () => {
        if (countersAnimated) return;
        countersAnimated = true;

        Object.entries(stats).forEach(([name, value]) => {
            document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
                const hasPlus = name === 'technologies';
                animateCounter(element, value, hasPlus);
            });
        });
    };

    if ('IntersectionObserver' in window && proofStrip) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    triggerCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        counterObserver.observe(proofStrip);
    } else {
        triggerCounters();
    }

    // 6. Filtrado de proyectos accesible
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;

            // Actualizar botones y estados ARIA
            filterButtons.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });

            // Filtrar cards
            let visibleCount = 0;
            projectCards.forEach((card) => {
                const shouldShow = filter === 'all' || card.dataset.type === filter;
                card.classList.toggle('hidden', !shouldShow);
                if (shouldShow) visibleCount++;
            });

            // Actualizar texto del contador con feedback accesible
            if (projectCountEl) {
                projectCountEl.textContent = visibleCount;
            }
        });
    });

    // 7. Validación profesional del formulario de contacto y consentimiento de privacidad
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
            [nameInput, emailInput, messageInput].forEach((input) => {
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
        [nameInput, emailInput, messageInput].forEach((input) => {
            input?.addEventListener('input', () => {
                input.classList.remove('field-invalid');
                input.removeAttribute('aria-invalid');
            });
        });

        privacyCheckbox?.addEventListener('change', () => {
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
                if (privacyError) privacyError.textContent = 'Debes aceptar la Política de Privacidad para continuar.';
                if (!firstInvalidField) firstInvalidField = privacyCheckbox;
            }

            if (!isValid) {
                formStatus.textContent = 'Por favor, revisa los campos señalados antes de enviar.';
                formStatus.className = 'form-status error';
                firstInvalidField?.focus();
                return;
            }

            // Envío seguro mediante cliente de correo con codificación URI
            const subject = `Contacto desde jrcholan.lat: ${nameVal}`;
            const body = `Hola Jheferson,\n\nMi nombre es: ${nameVal}\nCorreo de contacto: ${emailVal}\n\nMensaje:\n${messageVal}\n\n---\nHe aceptado los términos y la política de privacidad de jrcholan.lat`;

            const mailtoUri = `mailto:jheferson6666@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            formStatus.textContent = 'Abriendo tu cliente de correo para completar el envío...';
            formStatus.className = 'form-status success';

            window.location.href = mailtoUri;
        });
    }

    // 8. Modal de detalles de proyectos accesible (WCAG 2.2 Compliant)
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

        const closeDialog = () => {
            dialog.close();
            activeProjectKey = null;
            activeImageIndex = 0;
            // Devolver foco al elemento disparador para accesibilidad WCAG
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };

        dialogClose.addEventListener('click', closeDialog);

        // Cerrar al hacer clic en el backdrop
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) {
                closeDialog();
            }
        });

        // Cerrar con Escape
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDialog();
            }
        });

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
                    <span>${activeImageIndex + 1} / ${project.images.length}</span>
                </div>

                ${project.images.length > 1 ? `
                    <div class="dialog-gallery">
                        ${project.images.map(([imageSrc, imageAlt], index) => `
                            <button class="dialog-thumb${index === activeImageIndex ? ' active' : ''}" type="button" data-image-index="${index}" aria-label="Ver imagen ${index + 1}: ${imageAlt}">
                                <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
                            </button>
                        `).join('')}
                    </div>
                    <div class="dialog-gallery-controls">
                        <button type="button" class="button button-outline" data-gallery-action="previous" aria-label="Ver imagen anterior">
                            <i data-lucide="arrow-left" aria-hidden="true"></i>
                            <span>Anterior</span>
                        </button>
                        <button type="button" class="button button-outline" data-gallery-action="next" aria-label="Ver imagen siguiente">
                            <span>Siguiente</span>
                            <i data-lucide="arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                ` : ''}
            `;

            // Refrescar iconos en el contenido dinámico
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }

            // Eventos de miniaturas
            dialogContent.querySelectorAll('[data-image-index]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    activeImageIndex = Number(btn.dataset.imageIndex);
                    renderProject();
                });
            });

            // Controles Anterior / Siguiente
            dialogContent.querySelector('[data-gallery-action="previous"]')?.addEventListener('click', () => {
                activeImageIndex = (activeImageIndex - 1 + project.images.length) % project.images.length;
                renderProject();
            });

            dialogContent.querySelector('[data-gallery-action="next"]')?.addEventListener('click', () => {
                activeImageIndex = (activeImageIndex + 1) % project.images.length;
                renderProject();
            });
        };

        // Disparadores de apertura del modal
        document.querySelectorAll('.project-detail').forEach((button) => {
            button.addEventListener('click', () => {
                const key = button.dataset.project;
                if (!projectData[key]) return;

                lastFocusedElement = button;
                activeProjectKey = key;
                activeImageIndex = 0;
                renderProject();

                if (typeof dialog.showModal === 'function') {
                    dialog.showModal();
                    // Colocar foco accesible en el botón de cerrar
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
                activeImageIndex = (activeImageIndex + 1) % project.images.length;
                renderProject();
            } else if (event.key === 'ArrowLeft') {
                activeImageIndex = (activeImageIndex - 1 + project.images.length) % project.images.length;
                renderProject();
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
});
