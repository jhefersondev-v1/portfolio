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
        const originalText = buttonText.textContent;

        submitButton.disabled = true;
        buttonText.textContent = 'Enviando...';
        status.textContent = '';

        window.setTimeout(() => {
            status.textContent = 'Mensaje preparado. Te responderé pronto.';
            buttonText.textContent = originalText;
            submitButton.disabled = false;
            form.reset();
        }, 700);
    });
});
