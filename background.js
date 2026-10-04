// Lista de posibles dominios de Lectulandia
const LECTULANDIA_DOMAINS = [
    'https://ww3.lectulandia.co',
    'https://www.lectulandia.net',
    'https://www.lectulandia.to',
    'https://www.lectulandia.org',
    'https://www.lectulandia.cc'
];

let activeDomainCache = null;

// Ejecuta la carrera de peticiones para ver qué dominio está vivo
async function getActiveDomain() {
    if (activeDomainCache) return activeDomainCache;

    // Lanzamos peticiones HEAD (sin descargar el HTML, solo cabeceras para que sea ultra rápido)
    const checks = LECTULANDIA_DOMAINS.map(domain => 
        fetch(domain, { method: 'HEAD', cache: 'no-store' })
            .then(response => {
                if (response.ok) return domain;
                throw new Error('Caído');
            })
    );

    try {
        // Promise.any se resuelve en cuanto el PRIMER dominio responde correctamente
        activeDomainCache = await Promise.any(checks);
        console.log("[Background] Dominio activo detectado:", activeDomainCache);
        return activeDomainCache;
    } catch (error) {
        // Si todos fallan (ISP bloqueando todo), usamos el primero como último recurso
        console.error("[Background] Ningún dominio respondió. Usando fallback.");
        return LECTULANDIA_DOMAINS[0];
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // ACCIÓN 1: Buscar en Lectulandia
    if (request.action === "fetchLectulandia") {
        getActiveDomain().then(domain => {
            const searchQuery = encodeURIComponent(request.query);
            const searchUrl = `${domain}/search/${searchQuery}`;

            fetch(searchUrl)
                .then(response => response.text())
                .then(html => {
                    // Devolvemos el HTML y el dominio base que ha ganado la carrera
                    sendResponse({ success: true, html: html, baseUrl: domain });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message, baseUrl: domain });
                });
        });
        return true; 
    }

    // ACCIÓN 2: Hacer scraping de las ediciones en español
    if (request.action === "scrapeSpanishEdition") {
        fetch(request.url)
            .then(response => response.text())
            .then(html => {
                sendResponse({ success: true, html: html });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});