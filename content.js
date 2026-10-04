// Utilidades para normalizar texto
function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function titlesMatch(title1, title2) {
    if (!title1 || !title2) return false;
    const t1 = normalizeText(title1);
    const t2 = normalizeText(title2);
    return t1.includes(t2) || t2.includes(t1);
}

// Extrae la URL de ediciones directamente del JSON de React al instante
function getEditionsUrl() {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript) {
        const match = nextDataScript.textContent.match(/https:\/\/www\.goodreads\.com\/work\/editions\/(\d+)/);
        if (match && match[1]) {
            const workId = match[1];
            console.log(`[Extensión] Work ID cazado del JSON: ${workId}`);
            return `https://www.goodreads.com/work/editions/${workId}?utf8=%E2%9C%93&sort=num_ratings&filter_by_format=&filter_by_language=spa`;
        }
    }
    console.log("[Extensión] No se encontró la URL de ediciones en el JSON.");
    return null;
}

function injectButton() {
    if (document.getElementById('lectulandia-btn')) return;

    const titleElement = document.querySelector('h1[data-testid="bookTitle"]');
    const authorElement = document.querySelector('span[data-testid="name"]');
    // Buscamos el panel lateral donde están los botones oficiales
    const bookActions = document.querySelector('div[data-testid="book-actions"]');
    
    if (!titleElement || !authorElement || !bookActions) return;

    const originalTitle = titleElement.innerText.trim();
    const author = authorElement.innerText.trim();
    const cleanTitle = originalTitle.replace(/\s*[([].*?[)\]]/g, '').trim();

    const editionsUrl = getEditionsUrl();

    // 1. CLONAMOS LA ESTRUCTURA HTML DE LOS BOTONES DE GOODREADS
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'ButtonGroup ButtonGroup--block';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'Button__container Button__container--block';

    // Usamos las clases nativas de Goodreads (Button, Button--medium, Button--block)
    const btn = document.createElement('a');
    btn.id = 'lectulandia-btn';
    btn.className = 'Button Button--medium Button--block lectulandia-loading';
    btn.target = '_blank';
    // Goodreads envuelve el texto del botón en este span
    btn.innerHTML = `<span class="Button__labelItem">Buscando...</span>`;

    btnContainer.appendChild(btn);
    btnGroup.appendChild(btnContainer);

    // 2. INYECTAMOS JUSTO DEBAJO DEL BOTÓN DE "COMPRAR"
    // Buscamos el botón de comprar de Goodreads (suele tener la clase Button--buy)
    const buyButtonContainer = document.querySelector('.Button--buy')?.closest('.BookActions__button');
    if (buyButtonContainer && buyButtonContainer.parentNode) {
        // Lo metemos justo después del de comprar
        buyButtonContainer.parentNode.insertBefore(btnGroup, buyButtonContainer.nextSibling);
    } else {
        // Si por lo que sea el libro no tiene botón de comprar, lo añadimos al final del panel
        bookActions.appendChild(btnGroup);
    }

    // Función auxiliar para actualizar el estado del botón sin romper el diseño
    function updateBtn(url, text, statusClass) {
        btn.href = url;
        btn.innerHTML = `<span class="Button__labelItem">${text}</span>`;
        // Mantenemos las clases estructurales de Goodreads y le sumamos la nuestra de color
        btn.className = `Button Button--medium Button--block ${statusClass}`;
    }

    function searchLectulandia(searchQuery, isRetry = false) {
        chrome.runtime.sendMessage(
            { action: "fetchLectulandia", query: searchQuery },
            (response) => {
                const activeBaseUrl = response?.baseUrl || 'https://ww3.lectulandia.co';

                if (response && response.success) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.html, 'text/html');
                    
                    const firstBookLink = doc.querySelector('a.title[href^="/book/"]');
                    const firstBookTitle = firstBookLink ? firstBookLink.innerText.trim() : null;
                    
                    if (firstBookLink && titlesMatch(searchQuery, firstBookTitle)) {
                        updateBtn(activeBaseUrl + firstBookLink.getAttribute('href'), isRetry ? 'Descargar (Traducido)' : 'Descargar en Lectulandia', 'lectulandia-found');
                    } else {
                        if (!isRetry && editionsUrl) {
                            updateBtn('#', 'Buscando edición en español...', 'lectulandia-loading');
                            
                            chrome.runtime.sendMessage(
                                { action: "scrapeSpanishEdition", url: editionsUrl },
                                (transResponse) => {
                                    if (transResponse && transResponse.success && transResponse.html) {
                                        const transParser = new DOMParser();
                                        const transDoc = transParser.parseFromString(transResponse.html, 'text/html');
                                        
                                        const editionLinks = transDoc.querySelectorAll('a.bookTitle');
                                        
                                        if (editionLinks.length > 0) {
                                            const translatedTitle = editionLinks[0].innerText.trim();
                                            const newCleanTitle = translatedTitle.replace(/\s*[([].*?[)\]]/g, '').trim();
                                            searchLectulandia(newCleanTitle, true);
                                        } else {
                                            updateBtn(`${activeBaseUrl}/search/${encodeURIComponent(author)}`, 'Buscar por Autor', 'lectulandia-fallback');
                                        }
                                    } else {
                                        updateBtn(`${activeBaseUrl}/search/${encodeURIComponent(author)}`, 'Buscar por Autor', 'lectulandia-fallback');
                                    }
                                }
                            );
                        } else {
                            updateBtn(`${activeBaseUrl}/search/${encodeURIComponent(author)}`, 'Buscar por Autor', 'lectulandia-fallback');
                        }
                    }
                } else {
                    updateBtn(`${activeBaseUrl}/search/${encodeURIComponent(author)}`, 'Buscar Autor (Error)', 'lectulandia-fallback');
                }
            }
        );
    }

    searchLectulandia(cleanTitle);
}

const observer = new MutationObserver(() => {
    if (document.querySelector('h1[data-testid="bookTitle"]')) {
        injectButton();
    }
});

observer.observe(document.body, { childList: true, subtree: true });