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
- `assets/js/main.js` – Lógica de navegación, temas, filtros, validación y modal accesible
- `script.js` – Entrada de compatibilidad que carga el módulo principal
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

Las páginas cargan `styles.css`, `assets/css/premium.css` y el único módulo de
interacción `assets/js/main.js`. Las entradas antiguas se conservan como adaptadores
de compatibilidad, sin duplicar la implementación. La tipografía de las páginas
principales, legales y casos de estudio comparte Inter y fuentes del sistema.

Los recursos y enlaces internos de `404.html` parten de la raíz del dominio para
que la recuperación también funcione al visitar una ruta inexistente anidada.

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
enlace para ir directamente a los proyectos y no intercepta el desplazamiento.

La composición V3 mantiene la fotografía original, los ocho proyectos y las cuatro
certificaciones. El vidrio se concentra en navegación y controles; las áreas de
lectura usan superficies sólidas. En móvil la ilustración pasa al flujo normal
para mantener todos los capítulos libres de superposiciones. Su observer pausa
el dibujo al salir la ilustración de pantalla, incluso si el texto sigue visible.

Las dos imágenes PNG de IA se sirven ahora como WebP (~249 KB en conjunto frente
a ~3,18 MB), con las dimensiones originales. Los PNG se conservan.

## Comprobaciones locales

Con el servidor del puerto 8000 activo:

```bash
node --check assets/js/main.js
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

## IndexNow

La clave pública existente se sirve en
[`653b8ac8c5854295beb8ba981bedf938.txt`](https://jrcholan.lat/653b8ac8c5854295beb8ba981bedf938.txt).
No es una credencial privada: este archivo permite verificar el dominio.

`.github/workflows/indexnow.yml` se ejecuta al finalizar correctamente el workflow
administrado de Pages y también admite ejecución manual en `main`. El despliegue
existente permanece independiente. `scripts/indexnow.py` usa Python 3 y su
biblioteca estándar; no añade código ni peticiones al navegador del visitante.

Antes del POST JSON a `https://api.indexnow.org/indexnow`, comprueba el commit
publicado mediante la API de Pages, el HEAD actual de `main`, la clave pública,
robots y los bytes de los HTML publicados. La primera ejecución toma las URL
canónicas e indexables del sitemap. Las posteriores comparan los HTML con el
último run exitoso de IndexNow: detectan altas, modificaciones y eliminaciones,
incluidos cambios de canonical, noindex y robots. Se excluyen recursos, páginas
de verificación, aliases y `404.html`. Las páginas eliminadas deben devolver
404/410; un cambio de directivas de indexación puede seguir devolviendo 200.
La comparación del HTML normaliza las transformaciones actuales de Cloudflare
(protección de correo e inserción del beacon) y espacios entre etiquetas, sin
cambiar la configuración de Cloudflare ni el contenido del sitio.

Los runs exitosos conservan el checkpoint sin caches, archivos de estado ni
commits automáticos. **Conservar el historial de Actions**: eliminar los runs
exitosos reinicia el checkpoint y provoca un nuevo envío inicial del sitemap.
El workflow serializa ejecuciones y no reintenta el POST automáticamente.
HTTP 200 confirma recepción; HTTP 202 indica validación de clave pendiente.
Otros códigos hacen fallar únicamente la notificación, conservan el checkpoint
anterior y aparecen en los logs y el resumen de Actions. Se puede reejecutar
manualmente tras resolver el problema; el siguiente despliegue también recupera
los cambios pendientes. La aceptación no garantiza indexación.

```bash
python -B -m unittest discover -s scripts -p 'test_indexnow.py' -v
python -B scripts/indexnow.py --dry-run
python -B scripts/indexnow.py --dry-run --base HEAD
gh workflow run indexnow.yml --ref main
```

Las simulaciones son locales, sin red ni envíos. Los envíos reales solo se
permiten dentro de Actions, después de comprobar la publicación en producción.
Protocolo: [documentación oficial de IndexNow](https://www.indexnow.org/documentation).

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
