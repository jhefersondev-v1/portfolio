document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = [...document.querySelectorAll('.nav-link')];

    const closeMenu = () => {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
        navLinks.classList.remove('open');
    };

    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    links.forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });

    const sections = [...document.querySelectorAll('.section-anchor')];
    const setActiveLink = (id) => {
        links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

    sections.forEach((section) => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const projectCards = [...document.querySelectorAll('.project-card')];
    const technologies = new Set([...document.querySelectorAll('.chips span')].map((item) => item.textContent.trim()));
    const certifications = document.querySelectorAll('#certifications .certificate-card');
    const certificatePreviews = [
        ['certificate-iot.png', 'Certificado Introduction to IoT'],
        ['certificate-entrepreneurship.png', 'Certificado Discovering Entrepreneurship'],
        ['certificate-get-connected.png', 'Certificado Get Connected'],
        ['certificate-cybersecurity.png', 'Certificado Introduction to Cybersecurity']
    ];
    certifications.forEach((card, index) => {
        const preview = certificatePreviews[index];
        if (!preview || card.querySelector('.certificate-preview')) return;
        const image = document.createElement('img');
        image.className = 'certificate-preview';
        image.src = preview[0];
        image.alt = preview[1];
        image.loading = 'eager';
        const body = card.querySelector(':scope > div:last-child');
        card.insertBefore(image, card.firstElementChild);
        body?.classList.add('certificate-body');
    });
    const stats = {
        projects: projectCards.length,
        technologies: technologies.size,
        certifications: certifications.length
    };

    Object.entries(stats).forEach(([name, value]) => {
        document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
            element.textContent = value;
        });
    });
    document.querySelectorAll('[data-project-count]').forEach((element) => {
        element.textContent = projectCards.length;
    });

    document.querySelectorAll('.filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach((item) => item.classList.toggle('active', item === button));
            document.querySelectorAll('.project-card').forEach((card) => {
                const shouldShow = filter === 'all' || card.dataset.type === filter;
                card.classList.toggle('hidden', !shouldShow);
            });
        });
    });

    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.btn-text');
        const formData = new FormData(form);
        const subject = `Contacto desde el portafolio: ${formData.get('name')}`;
        const body = `Nombre: ${formData.get('name')}\nCorreo: ${formData.get('email')}\n\n${formData.get('message')}`;
        window.location.href = `mailto:jheferson6666@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        status.textContent = 'Se abrirá tu cliente de correo para completar el envío.';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const projectData = {
        library: { title: 'Sistema de Gestión de Biblioteca', type: 'Software · Desktop', year: '2024', status: 'Completado', summary: 'Aplicación de escritorio para registrar, buscar, modificar y eliminar libros, autores y disponibilidad de ejemplares.', problem: 'Centralizar el registro y la consulta de libros, autores y disponibilidad.', solution: 'Aplicación de escritorio con operaciones CRUD y conexión a MySQL.', technologies: 'Java Swing · NetBeans · MySQL · POO', images: [['biblioteca-dashboard.png', 'Dashboard de biblioteca'], ['biblioteca-libros.png', 'Listado de libros'], ['biblioteca-formulario.png', 'Formulario de biblioteca']] },
        atm: { title: 'Sistema de Cajero Automático', type: 'Software · Desktop', year: '2024', status: 'Completado', summary: 'Simulador con operaciones de depósito, retiro y consulta de saldo, con validación e interfaz gráfica.', problem: 'Practicar operaciones bancarias y validación desde una interfaz gráfica.', solution: 'Simulador de cajero con operaciones de depósito, retiro y consulta de saldo.', technologies: 'Java Swing · POO · NetBeans', images: [['cajero-login.png', 'Acceso del cajero'], ['cajero-menu.png', 'Menú del cajero'], ['cajero-operacion.png', 'Operación del cajero']] },
        votacion: { title: 'Sistema de Votación', type: 'Sistemas · Web', year: '2025', status: 'Documentado', summary: 'Proyecto con pantallas reales de inicio, elección y resultado.', problem: 'Organizar el flujo visual de un proceso de votación.', solution: 'Sistema presentado mediante las pantallas reales disponibles.', technologies: 'HTML · CSS · JavaScript · PHP', images: [['votacion-inicio.png', 'Inicio de votación'], ['votacion-eleccion.png', 'Elección'], ['votacion-resultado.png', 'Resultado']] },
        tasks: { title: 'Task Manager / Sistema de Gestión de Tareas', type: 'Web · Sistemas', year: '2025', status: 'Documentado', summary: 'Interfaz real de gestión de tareas con dashboard, listado y formulario.', problem: 'Organizar visualmente tareas y acciones de gestión.', solution: 'Sistema de gestión representado por sus pantallas reales.', technologies: 'HTML · CSS · JavaScript', images: [['taskmanager-dashboard.png', 'Dashboard de tareas'], ['taskmanager-tareas.png', 'Listado de tareas'], ['taskmanager-formulario.png', 'Formulario de tarea']] },
        ecommerce: { title: 'CALZATURE D’VIDALE', type: 'Web · E-commerce', year: '2025', status: 'En desarrollo', summary: 'Tienda virtual con usuarios, catálogo, carrito de compras e integración de pagos.', problem: 'Presentar un flujo de tienda virtual con catálogo y usuarios.', solution: 'Tienda virtual documentada mediante sus pantallas reales.', technologies: 'HTML · CSS · JavaScript · PHP', images: [['ecommerce-home.png', 'Página principal'], ['ecommerce-productos.png', 'Productos'], ['ecommerce-login.png', 'Inicio de sesión']] },
        ml: { title: 'Proyecto de Machine Learning', type: 'IA · Machine Learning', year: '2025', status: 'Completado', summary: 'Análisis y procesamiento de datos con modelos para clasificación y predicción usando datasets reales.', problem: 'Analizar datos y visualizar el trabajo del modelo.', solution: 'Flujo de dataset, gráficos y resultado del modelo con herramientas de Python.', technologies: 'Python · Pandas · NumPy · Scikit-learn', images: [['ml-dataset.png', 'Dataset'], ['ml-grafico.png', 'Gráfico'], ['ml-resultado.png', 'Resultado']] },
        yolo: { title: 'Computer Vision con YOLO', type: 'AI · Computer Vision', year: '2025', status: 'Documentado', summary: 'Exploración de visión por computadora con una captura real del proyecto.', problem: 'Explorar computer vision mediante una aplicación visual.', solution: 'Proyecto presentado con la captura real disponible.', technologies: 'Python · OpenCV · YOLO', images: [['ia-yolo.png', 'Computer Vision con YOLO']] }
    };
    const dialog = document.getElementById('projectDialog');
    const dialogContent = document.getElementById('dialogContent');
    if (!dialog || !dialogContent) return;
    let activeProject = null;
    let activeImage = 0;
    const closeDialog = () => dialog.close();
    document.getElementById('dialogClose').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
    const renderProject = () => {
        const project = projectData[activeProject];
        const [src, alt] = project.images[activeImage];
        dialogContent.innerHTML = `<div class="dialog-heading"><span class="project-label">${project.type}</span><h2 id="dialogTitle">${project.title}</h2><p>${project.summary}</p></div><div class="dialog-facts"><div class="dialog-fact"><span>Año</span><strong>${project.year}</strong></div><div class="dialog-fact"><span>Estado</span><strong>${project.status}</strong></div><div class="dialog-fact"><span>Tecnologías</span><strong>${project.technologies}</strong></div><div class="dialog-fact"><span>Capturas</span><strong>${project.images.length}</strong></div></div><h3 class="dialog-section-title">Solución</h3><p>${project.solution}</p><h3 class="dialog-section-title">Problema</h3><p>${project.problem}</p><h3 class="dialog-section-title">Capturas</h3><div class="dialog-main-image"><img src="${src}" alt="${alt}" loading="lazy"><span>${activeImage + 1} / ${project.images.length}</span></div><div class="dialog-gallery">${project.images.map(([imageSrc, imageAlt], index) => `<button class="dialog-thumb${index === activeImage ? ' active' : ''}" type="button" data-image-index="${index}" aria-label="Ver captura ${index + 1}"><img src="${imageSrc}" alt="${imageAlt}" loading="lazy"></button>`).join('')}</div><div class="dialog-gallery-controls"><button type="button" class="button button-outline" data-gallery-action="previous"${project.images.length < 2 ? ' disabled' : ''}>Imagen anterior</button><button type="button" class="button button-outline" data-gallery-action="next"${project.images.length < 2 ? ' disabled' : ''}>Siguiente imagen</button></div>`;
        dialogContent.querySelectorAll('[data-image-index]').forEach((button) => button.addEventListener('click', () => { activeImage = Number(button.dataset.imageIndex); renderProject(); }));
        dialogContent.querySelector('[data-gallery-action="previous"]')?.addEventListener('click', () => { activeImage = (activeImage - 1 + project.images.length) % project.images.length; renderProject(); });
        dialogContent.querySelector('[data-gallery-action="next"]')?.addEventListener('click', () => { activeImage = (activeImage + 1) % project.images.length; renderProject(); });
    };
    document.querySelectorAll('.project-detail').forEach((button) => button.addEventListener('click', () => {
        if (!projectData[button.dataset.project]) return;
        activeProject = button.dataset.project;
        activeImage = 0;
        renderProject();
        dialog.showModal();
    }));
    dialog.addEventListener('keydown', (event) => {
        if (!activeProject) return;
        if (event.key === 'ArrowRight') { activeImage = (activeImage + 1) % projectData[activeProject].images.length; renderProject(); }
        if (event.key === 'ArrowLeft') { activeImage = (activeImage - 1 + projectData[activeProject].images.length) % projectData[activeProject].images.length; renderProject(); }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dialog.open) closeDialog();
    });
});
