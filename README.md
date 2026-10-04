# Goodreads a Lectulandia (Extensión para Chrome) 📚

Una extensión para Chrome (Manifest V3) que integra de forma invisible un botón de descarga directa a Lectulandia desde cualquier ficha de libro en Goodreads.

## Características Principales
- **Integración Nativa:** Inyecta un botón de descarga que imita a la perfección los componentes y el diseño de la interfaz de React de Goodreads.
- **Scraping Inteligente:** Elude la carga diferida (*lazy loading*) de React para extraer el `workId` oculto y conseguir el título oficial traducido al español directamente desde la base de datos de ediciones de Goodreads.
- **Búsqueda Dinámica y Segura:** Implementa una cadena de reintentos automática (Búsqueda Exacta -> Edición Traducida -> Búsqueda por Autor) para garantizar siempre el mejor resultado posible.
- **Red Resiliente:** Utiliza `Promise.any()` lanzando peticiones a múltiples dominios espejo (*mirrors*) de Lectulandia simultáneamente, sorteando así bloqueos de DNS de las operadoras de forma automática.

## Cómo instalar (Modo Desarrollador)
1. Descarga el código en un `.zip` desde el apartado de **Releases** (o clona este repositorio) y extráelo en una carpeta.
2. Abre Google Chrome y ve a `chrome://extensions/`.
3. Activa el **Modo Desarrollador** (es un interruptor en la esquina superior derecha).
4. Haz clic en el botón **Cargar descomprimida** (*Load unpacked*) y selecciona la carpeta que contiene los archivos de la extensión.
5. ¡Entra a cualquier página de un libro en Goodreads y a disfrutar!

## Tecnologías Utilizadas
- Service Workers (Manifest V3)
- Web Scraping & DOMParser
- API MutationObserver
- JavaScript Asíncrono (Promises, Fetch API)
