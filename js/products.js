// =====================================================
// PRODUCTS.JS
// Carga productos desde Google Sheets, renderiza tarjetas,
// lightbox, búsqueda global y enlace a WhatsApp.
// =====================================================
const API_URL = 'https://script.google.com/macros/s/AKfycby6e-Iv1k2qWBO6G4NJ83uZ5VFRuB2V6gOmgrVpADZBgxO0F9b7DXegeu6fo5Fa3rLugQ/exec';
let allProducts = [];

/**
 * Genera enlace de WhatsApp con saludo y producto.
 */
function getWhatsAppLink(productName, imageUrl) {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour >= 6 && hour < 12) greeting = '¡Buenos días!';
    else if (hour >= 12 && hour < 19) greeting = '¡Buenas tardes!';
    else greeting = '¡Buenas noches!';
    const message = `${greeting} quiero cotizar este producto: ${productName}. Imagen: ${encodeURIComponent(imageUrl)}`;
    return `https://api.whatsapp.com/send?phone=573188495934&text=${message}`;
}

/**
 * Obtiene URL de imagen a través de Google Drive thumbnail.
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
 * Formatea un valor a moneda colombiana.
 */
function formatPrice(price) {
    let num = parseFloat(price);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

/**
 * Escapa caracteres HTML para evitar XSS.
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function isSoldOut(product) {
    // Si el precio principal es 0 y también los otros dos precios base son 0,
    // o el nombre contiene "agotado"/"vendido", se considera agotado.
    const mainPrice = parseFloat(product.price) || 0;
    const dtfPrice = parseFloat(product.priceDTF) || 0;
    const sinPrice = parseFloat(product.priceSin) || 0;
    const allZero = mainPrice === 0 && dtfPrice === 0 && sinPrice === 0;
    const nameSold = (product.name || '').toLowerCase().includes('agotado') || 
                     (product.name || '').toLowerCase().includes('vendido');
    return allZero || nameSold;
}

/**
 * Renderiza la cuadrícula de productos.
 */
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (!products.length) { grid.innerHTML = '<p>No hay productos disponibles.</p>'; return; }
    grid.innerHTML = '';
    products.forEach(prod => {
        const imageUrl = getProxiedImageUrl(prod.image);
        const soldOut = isSoldOut(prod);
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let priceHtml = '';
        // Construcción de priceHtml según agotado
        if (!soldOut) {
            priceHtml = `
                <div class="product-price-main">${formatPrice(prod.price)} COP <span class="price-label">(Unidad con diseño)</span></div>
                <details class="price-details">
                    <summary>Ver todas las opciones de precio</summary>
                    <div class="price-tables">
                        <!-- ... (tus tablas de precios, las dejo resumidas) -->
                        <div class="price-table"><h4>Con diseño</h4>
                            <table>
                                <tr><th>Unidad</th><td>${formatPrice(prod.price)}</td></tr>
                                <tr><th>6+1 (10% dto)</th><td>${formatPrice(prod.price2)}</td></tr>
                                <tr><th>12+1 (12% dto)</th><td>${formatPrice(prod.price3)}</td></tr>
                                <tr><th>+12 und (14% dto)</th><td>${formatPrice(prod.price4)}</td></tr>
                            </table>
                        </div>
                        <div class="price-table"><h4>Con diseño + DTF</h4>
                            <table>
                                <tr><th>Unidad</th><td>${formatPrice(prod.priceDTF)}</td></tr>
                                <tr><th>6+1 (10% dto)</th><td>${formatPrice(prod.priceDTF2)}</td></tr>
                                <tr><th>12+1 (12% dto)</th><td>${formatPrice(prod.priceDTF3)}</td></tr>
                                <tr><th>+12 und (14% dto)</th><td>${formatPrice(prod.priceDTF4)}</td></tr>
                            </table>
                        </div>
                        <div class="price-table"><h4>Sin diseño</h4>
                            <table>
                                <tr><th>Unidad</th><td>${formatPrice(prod.priceSin)}</td></tr>
                                <tr><th>6+1 (10% dto)</th><td>${formatPrice(prod.priceSin2)}</td></tr>
                                <tr><th>12+1 (12% dto)</th><td>${formatPrice(prod.priceSin3)}</td></tr>
                                <tr><th>+12 und (14% dto)</th><td>${formatPrice(prod.priceSin4)}</td></tr>
                            </table>
                        </div>
                    </div>
                </details>
                <a href="${getWhatsAppLink(prod.name, imageUrl)}" target="_blank" class="btn cotizar-btn">Cotizar</a>
            `;
        } else {
            // Solo el badge de agotado, sin precios ni botón
            priceHtml = `<div class="product-soldout">Agotado</div>`;
        }
        
        card.innerHTML = `
            <div class="product-header">
                <h3 class="product-title">${escapeHtml(prod.name)}</h3>
                <span class="product-category">${escapeHtml(prod.category)}</span>
            </div>
            <img src="${imageUrl}" alt="${escapeHtml(prod.name)}" loading="lazy" class="product-img-clickable" data-img-src="${imageUrl}">
            ${priceHtml}
        `;
        grid.appendChild(card);
    });
    initProductLightbox();
}

/**
 * Asigna evento click para abrir lightbox en imágenes de producto.
 */
function initProductLightbox() {
    document.querySelectorAll('.product-img-clickable').forEach(img => {
        img.removeEventListener('click', productLightboxHandler);
        img.addEventListener('click', productLightboxHandler);
    });
}
function productLightboxHandler(e) {
    const src = e.target.getAttribute('data-img-src') || e.target.src;
    openLightbox(src);
}

/**
 * Muestra una imagen en pantalla completa (lightbox).
 */
function openLightbox(imgSrc) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    const img = document.createElement('img');
    img.src = imgSrc;
    lb.appendChild(img);
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
}

/**
 * Configura búsqueda global en el header.
 */
function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allProducts.filter(prod => 
            prod.name.toLowerCase().includes(term) || 
            (prod.category && prod.category.toLowerCase().includes(term))
        );
        displayProducts(filtered);
    });
}

/**
 * Carga los productos desde la API y los muestra.
 */
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;">🔄 Cargando productos...</div>';
    try {
        const response = await fetch(`${API_URL}?_=${Date.now()}`);
        const data = await response.json();
        if (!data.success) throw new Error('Error en API');
        allProducts = data.products || [];
        displayProducts(allProducts);
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div style="text-align:center;">❌ Error al cargar productos.<br><button onclick="location.reload()">Reintentar</button></div>';
    }
}

// Iniciar carga
loadProducts();
/* setTimeout(initGlobalSearch, 500); */