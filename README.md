# Jheferson Cholan Portfolio

Portfolio personal de Jheferson Cholan (JRCHOLAN) con enfoque en Ingeniería de Software e Inteligencia Artificial.

Sitio en producción: [https://jrcholan.lat/](https://jrcholan.lat/)

## Descripción

Sitio web estático profesional y accesible diseñado para presentar:
- Perfil profesional y biografía técnica
- Habilidades y áreas de especialización
- Ecosistema tecnológico documentado
- Proyectos reales de software, web e IA (con modal interactivo de detalles y capturas)
- Inteligencia Artificial y Machine Learning
- Experiencia laboral y formación académica (SENATI)
- Certificaciones acreditadas por Cisco Networking Academy
- Formulario de contacto con validación y consentimiento de privacidad
- Política de Privacidad conforme a normativa peruana (Ley N.º 29733)
- Términos de Uso y Aviso Legal con atribución de marcas

## Tecnologías y Estándares

- **HTML5 Semántico**: Estructura accesible con landmarks, atributos ARIA y jerarquía heading WCAG 2.2.
- **CSS3 Moderno**: Variables personalizadas, layout CSS Grid y Flexbox, responsive design, modo `prefers-reduced-motion`.
- **JavaScript Vanilla**: Modular, sin dependencias pesadas, cálculo dinámico de estadísticas y control de foco accesible.
- **Iconografía**: Devicon para tecnologías y Lucide Icons para interfaz.
- **Despliegue**: GitHub Pages con dominio personalizado en `jrcholan.lat` y certificado SSL/TLS.

## Estructura principal

- `index.html` – Contenido y estructura principal del sitio
- `privacidad.html` – Política de Privacidad y protección de datos personales
- `terminos.html` – Términos de Uso, aviso legal y atribución de marcas
- `styles.css` – Sistema visual, tipografía, variables y responsive
- `script.js` – Lógica de filtros, contadores dinámicos, validación y modal accesible
- `assets/css/premium.css` – Dirección visual premium y adaptación responsive
- `assets/js/scroll-world.js` – Motor local de cámara continua controlada por scroll
- `scripts/verify-scroll-world.cjs` – Verificaciones del ciclo de vida del motor, sin navegador
- `scripts/verify-site.py` – Auditoría de documentos, enlaces, SEO y recursos HTTP locales
- `robots.txt` – Configuración para motores de búsqueda
- `sitemap.xml` – Mapa del sitio indexable
- `CNAME` – Configuración de dominio personalizado para GitHub Pages
- `assets/docs/` – CV y certificados descargables
- `assets/images/` – Retrato, capturas reales, imágenes sociales y credenciales
- `work/` – Casos de estudio de Machine Learning, CALZATURE y Biblioteca

Las páginas cargan `styles.css` y `script.js` de la raíz, más `premium.css`. Las copias
anteriores de CSS/JS en `assets/` se conservan por compatibilidad; `assets/js/main.js`
permanece sincronizado con `script.js`.

## Scroll World local

Integración basada en la skill global **scroll-world**, con avance continuo y suave.
En ausencia de videos, una cámara Canvas recorre tres zonas procedurales conectadas:
software, datos y visión artificial. Es un prototipo sin videos generados,
servicios de render, conexiones a Monid/Higgsfield ni consumo de créditos.

Se adaptaron los segmentos ponderados, el mapeo monotónico de permanencia y el
suavizado por `requestAnimationFrame` del motor de la skill. El texto permanece
en HTML, separado del elemento decorativo. El motor pausa fuera de pantalla,
deja de pedir frames al estabilizarse, limita la densidad de píxeles en móvil y
responde a cambios de `prefers-reduced-motion`. Sin Canvas se conserva una escena
CSS estática; sin JavaScript siguen disponibles contenido y enlaces.

`window.portfolioWorld.getState()` permite inspeccionar el estado en desarrollo;
`destroy()` limpia eventos, observer y frames pendientes. El recorrido tiene un
enlace para continuar directamente al perfil y no intercepta el desplazamiento.

Las dos imágenes PNG de IA se sirven ahora como WebP (~249 KB en conjunto frente
a ~3,18 MB), con las dimensiones originales. Los PNG se conservan.

## Comprobaciones locales

Con el servidor del puerto 8000 activo:

```bash
node --check script.js
node --check assets/js/scroll-world.js
node scripts/verify-scroll-world.cjs
python scripts/verify-site.py --http
git diff --check
```

Las pruebas del motor usan un DOM simulado y no sustituyen la revisión visual.
Revisar en navegador escritorio, móvil vertical/horizontal, ambos temas y movimiento
reducido; comprobar filtros, galerías, menú con teclado y formulario (abre el cliente
de correo mediante `mailto:`, no envía mensajes por un backend).

La web se publica desde la rama `main` de GitHub Pages en `jrcholan.lat`.

## Ejecutar localmente

```bash
# Con Python
python -m http.server 8000

# O con Node.js
npx serve .
```

Luego abrir en el navegador:

```text
http://localhost:8000/
```

## Autor

**Jheferson Rafael Cholan Fernández**  
Estudiante de Ingeniería de Software con Inteligencia Artificial  
SENATI · Cajamarca, Perú  
Contacto: [jheferson6666@gmail.com](mailto:jheferson6666@gmail.com)
