// =====================================================
// SERVICES.JS
// Carga servicios, packs y equipos desde Google Sheets.
// Renderiza tarjetas y aplica filtros.
// Incluye lightbox con carrusel (Swiper) para ampliar
// las imágenes de los equipos y deslizarlas.
// =====================================================
const API_URL = 'https://script.google.com/macros/s/AKfycby6e-Iv1k2qWBO6G4NJ83uZ5VFRuB2V6gOmgrVpADZBgxO0F9b7DXegeu6fo5Fa3rLugQ/exec';

let allPrecios = [];
let allPacks = [];
let allEquipos = [];

// ---------- FUNCIONES AUXILIARES ----------
function getString(v) { return (v === undefined || v === null) ? '' : String(v); }
function esc(s) { return getString(s).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); }
function fmtPrice(p) {
    let s = getString(p);
    if (!s || s === '0') return '$0';
    let num = parseFloat(s);
    return isNaN(num) ? '$0' : '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}
function fmtDesc(d) { return getString(d).replace(/\n/g, '<br>'); }

/**
 * Obtiene URL de miniatura de Google Drive (800x800) para mejor calidad.
 */
function getProxiedImageUrl(originalUrl) {
    if (!originalUrl || originalUrl === '') return 'https://placehold.co/400x400?text=Sin+Imagen';
    let id = null;
    let match = originalUrl.match(/[?&]id=([^&]+)/);
    if (match) id = match[1];
    if (!id) {
        match = originalUrl.match(/\/d\/([^\/]+)/);
        if (match) id = match[1];
    }
    if (!id) {
        match = originalUrl.match(/([a-zA-Z0-9_-]{25,})/);
        if (match) id = match[1];
    }
    if (id) return `https://drive.google.com/thumbnail?id=${id.trim()}&sz=w800-h800`;
    return 'https://placehold.co/400x400?text=Error+ID';
}

/**
 * Abre un lightbox con Swiper para navegar entre imágenes.
 * @param {string[]} images - URLs de imágenes (ya procesadas).
 * @param {number} startIndex - Índice desde el que empezar.
 */
function openSwiperLightbox(images, startIndex = 0) {
    const old = document.querySelector('.lightbox');
    if (old) old.remove();

    const lb = document.createElement('div');
    lb.className = 'lightbox';

    const swiperDiv = document.createElement('div');
    swiperDiv.className = 'swiper lightbox-swiper';

    let slidesHtml = '';
    images.forEach(url => {
        slidesHtml += `<div class="swiper-slide"><img src="${url}" alt="Imagen ampliada"></div>`;
    });
    swiperDiv.innerHTML = `
        <div class="swiper-wrapper">${slidesHtml}</div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-pagination"></div>
    `;
    lb.appendChild(swiperDiv);
    document.body.appendChild(lb);

    const lightboxSwiper = new Swiper(swiperDiv, {
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: { el: '.swiper-pagination', clickable: true },
        loop: false,
        initialSlide: startIndex,
    });

    lb.addEventListener('click', function(e) {
        if (e.target === lb) {
            lightboxSwiper.destroy();
            lb.remove();
        }
    });
}

// ---------- RENDERIZADO DE PRECIOS ----------
function renderPrecios(items) {
    const grid = document.getElementById('precios-grid');
    if (!grid) return;
    if (!items.length) { grid.innerHTML = '<p>No hay servicios disponibles.</p>'; return; }
    grid.innerHTML = '';
    items.forEach(i => {
        const card = document.createElement('div');
        card.className = 'servicio-card';
        card.innerHTML = `
            <div class="servicio-header"><h4 class="servicio-titulo">${esc(i.servicio)}</h4></div>
            <div class="servicio-detalle">
                <div class="servicio-detalle-item"><span class="detalle-etiqueta">Categoría</span><span class="detalle-valor">${esc(i.categoria)}</span></div>
                <div class="servicio-detalle-item"><span class="detalle-etiqueta">Unidad</span><span class="detalle-valor">${esc(i.unidad)}</span></div>
                <div class="servicio-detalle-item precio-item"><span class="detalle-etiqueta">Precio</span><span class="detalle-valor precio-valor">${fmtPrice(i.precio)}</span></div>
            </div>
            <div class="servicio-descripcion">${fmtDesc(i.descripcion)}</div>
            <a href="https://api.whatsapp.com/send?phone=573188495934&text=Hola,%20quiero%20cotizar%20${encodeURIComponent(i.servicio)}" target="_blank" class="btn cotizar-btn">Cotizar</a>
        `;
        grid.appendChild(card);
    });
}

// ---------- RENDERIZADO DE PACKS ----------
function renderPacks(items) {
    const grid = document.getElementById('packs-grid');
    if (!grid) return;
    if (!items.length) { grid.innerHTML = '<p>No hay packs disponibles.</p>'; return; }
    grid.innerHTML = '';
    items.forEach(p => {
        let descuentoNum = parseFloat(p.descuento);
        let porcentaje = isNaN(descuentoNum) ? 0 : Math.round(descuentoNum * 100);
        const card = document.createElement('div');
        card.className = 'pack-card';
        card.innerHTML = `
            <div class="pack-header">
                <h4 class="pack-titulo">${esc(p.nombre)}</h4>
                <span class="pack-descuento-badge">-${porcentaje}%</span>
            </div>
            <div class="pack-detalle">
                <div class="pack-detalle-item"><span class="detalle-etiqueta">Categoría</span><span class="detalle-valor">${esc(p.categoria)}</span></div>
                <div class="pack-detalle-item precio-item"><span class="detalle-etiqueta">Plan Full</span><span class="detalle-valor pack-precio-full">${fmtPrice(p.precioFull)}</span></div>
                <div class="pack-detalle-item precio-item"><span class="detalle-etiqueta">Plan con Dto.</span><span class="detalle-valor pack-precio-descuento">${fmtPrice(p.precioDto)}</span></div>
            </div>
            <div class="pack-descripcion">${fmtDesc(p.descripcion)}</div>
            <a href="https://api.whatsapp.com/send?phone=573188495934&text=Hola,%20quiero%20cotizar%20${encodeURIComponent(p.nombre)}" target="_blank" class="btn cotizar-btn">Cotizar</a>
        `;
        grid.appendChild(card);
    });
}

// ---------- RENDERIZADO DE EQUIPOS (CON CARRUSEL NORMAL Y LIGHTBOX) ----------
function renderEquipos(items) {
    const grid = document.getElementById('equipos-grid');
    if (!grid) return;
    if (!items.length) { grid.innerHTML = '<p>No hay equipos disponibles.</p>'; return; }
    grid.innerHTML = '';

    items.forEach((eq, idx) => {
        const vendido = (eq.precioVenta === 0 && eq.precioDescuento === 0);
        let slides = '';
        const imagenesProcesadas = [];   // URLs de miniaturas para el lightbox

        if (eq.imagenes && eq.imagenes.length) {
            eq.imagenes.forEach(imgUrl => {
                if (imgUrl && imgUrl.trim()) {
                    const proxied = getProxiedImageUrl(imgUrl);
                    imagenesProcesadas.push(proxied);
                    slides += `<div class="swiper-slide"><img src="${proxied}" alt="${esc(eq.marca)}" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=Error'"></div>`;
                }
            });
        }
        if (!slides) {
            slides = `<div class="swiper-slide"><img src="https://placehold.co/400x400?text=Sin+Imagen" alt="Sin imagen"></div>`;
        }

        const swiperId = `equipo-swiper-${idx}`;
        const card = document.createElement('div');
        card.className = 'equipo-card';
        card.innerHTML = `
            <div class="equipo-header">
                <h4 class="equipo-titulo">${esc(eq.marca)}</h4>
                <span class="equipo-categoria">${esc(eq.categoria)}</span>
            </div>
            <div class="equipo-carrusel swiper ${swiperId}">
                <div class="swiper-wrapper">${slides}</div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-pagination"></div>
            </div>
            <div class="equipo-precios">
                ${vendido ? 
                    '<div class="precio-vendido">Vendido</div>' :
                    `<div class="precio-venta">Precio venta: ${fmtPrice(eq.precioVenta)}</div>
                     <div class="precio-descuento">Con descuento: ${fmtPrice(eq.precioDescuento)}</div>`
                }
            </div>
            <div class="equipo-detalles">
                <div><strong>Procesador:</strong> ${esc(eq.procesador)}</div>
                <div><strong>RAM:</strong> ${esc(eq.ram)}</div>
                <div><strong>Almacenamiento:</strong> ${esc(eq.almacenamiento)}</div>
                <div><strong>Sistema Operativo:</strong> ${esc(eq.so)}</div>
                <div><strong>Pantalla:</strong> ${esc(eq.pantalla)}</div>
                <div><strong>Otros:</strong> ${fmtDesc(eq.otros)}</div>
            </div>
            <a href="https://api.whatsapp.com/send?phone=573188495934&text=Hola,%20quiero%20cotizar%20${encodeURIComponent(eq.marca)}" target="_blank" class="btn cotizar-btn" ${vendido ? 'style="display:none;"' : ''}>Cotizar</a>
        `;
        grid.appendChild(card);

        // Inicializar Swiper de la tarjeta
        setTimeout(() => {
            const swiperContainer = document.querySelector(`.${swiperId}`);
            if (swiperContainer && swiperContainer.querySelectorAll('.swiper-slide').length > 1) {
                new Swiper(swiperContainer, {
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                    pagination: { el: '.swiper-pagination', clickable: true },
                    loop: true,
                    autoplay: { delay: 4000, disableOnInteraction: false }
                });
            }
        }, 100);

        // Lightbox con carrusel al hacer clic en cualquier imagen
        setTimeout(() => {
            const carruselCont = document.querySelector(`.${swiperId}`);
            if (carruselCont && imagenesProcesadas.length > 0) {
                carruselCont.addEventListener('click', function(e) {
                    const img = e.target.closest('img');
                    if (!img) return;
                    e.stopPropagation();
                    const imgSrc = img.src;
                    let startIdx = imagenesProcesadas.indexOf(imgSrc);
                    if (startIdx === -1) startIdx = 0;
                    openSwiperLightbox(imagenesProcesadas, startIdx);
                });
            }
        }, 300);
    });
}

// ---------- CARGA PRINCIPAL ----------
async function loadData() {
    const preDiv = document.getElementById('precios-grid');
    const packDiv = document.getElementById('packs-grid');
    const eqDiv = document.getElementById('equipos-grid');
    if (preDiv) preDiv.innerHTML = '<p>🔄 Cargando servicios...</p>';
    if (packDiv) packDiv.innerHTML = '<p>🔄 Cargando packs...</p>';
    if (eqDiv) eqDiv.innerHTML = '<p>🔄 Cargando equipos...</p>';

    try {
        const response = await fetch(API_URL + '?_=' + Date.now());
        const data = await response.json();
        console.log('📦 Datos recibidos:', data);
        if (!data.success) throw new Error('API error');
        allPrecios = data.precios || [];
        allPacks = data.packs || [];
        allEquipos = data.equipos || [];
        renderPrecios(allPrecios);
        renderPacks(allPacks);
        renderEquipos(allEquipos);
        setupFilters();
    } catch (err) {
        console.error('Error en loadData:', err);
        if (eqDiv) eqDiv.innerHTML = '<p>❌ Error al cargar datos. <button onclick="location.reload()">Reintentar</button></p>';
    }
}

// ---------- FILTROS ----------
function setupFilters() {
    const searchPrecios = document.getElementById('searchPrecios');
    const searchPacks = document.getElementById('searchPacks');
    const searchEquipos = document.getElementById('searchEquipos');
    if (searchPrecios) {
        searchPrecios.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allPrecios.filter(i => i.servicio.toLowerCase().includes(term) || i.categoria.toLowerCase().includes(term) || i.unidad.toLowerCase().includes(term));
            renderPrecios(filtered);
        });
    }
    if (searchPacks) {
        searchPacks.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allPacks.filter(p => p.nombre.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term));
            renderPacks(filtered);
        });
    }
    if (searchEquipos) {
        searchEquipos.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allEquipos.filter(eq => eq.marca.toLowerCase().includes(term) || eq.procesador.toLowerCase().includes(term));
            renderEquipos(filtered);
        });
    }
}

loadData();