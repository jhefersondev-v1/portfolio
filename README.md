# JRCHOLAN — Portfolio Premium V2

Rediseño completo del portafolio de Jheferson Cholan preparado para GitHub Pages y el dominio `jrcholan.lat`.

## Qué cambió

- Dirección visual editorial dark / premium.
- Navegación reducida a Work, About, Experience y Contact.
- Hero centrado en propuesta profesional, no en una lista de habilidades.
- Tres proyectos principales convertidos en case studies independientes.
- Archivo secundario de proyectos para mostrar amplitud sin saturar.
- Habilidades convertidas en capacidades y stack compacto.
- Experiencia y formación integradas en una timeline más profesional.
- Certificaciones relegadas a una sección de credenciales.
- Contacto directo por correo, LinkedIn y GitHub con botón para copiar email.
- SEO, Open Graph, Schema.org, sitemap, 404 y accesibilidad básica.
- Imágenes convertidas a WebP y reducidas drásticamente de peso.
- Sin framework ni proceso de build: compatible con GitHub Pages.

## Estructura

```text
/
├── index.html
├── 404.html
├── CNAME
├── sitemap.xml
├── robots.txt
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── images/
│   └── docs/
└── work/
    ├── machine-learning.html
    ├── calzature.html
    └── biblioteca.html
```

## Probar localmente

Desde esta carpeta:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/`.

## Publicar en GitHub Pages

Puedes reemplazar los archivos de tu repositorio actual con el contenido de esta carpeta, hacer commit y push. `CNAME` ya se conserva para `jrcholan.lat`.

## Personalización recomendada a futuro

Los textos solo usan datos presentes en el portafolio original. Si cuentas con URLs específicas de repositorios, demos online, métricas reales de los proyectos o nuevos proyectos de 2026, añádelos a cada case study: elevarán aún más la credibilidad del sitio.
