// =====================================================
// GLOBAL-SEARCH.JS
// Búsqueda unificada en todas las páginas (productos, servicios, equipos)
// =====================================================
const API_URL = 'https://script.google.com/macros/s/AKfycby6e-Iv1k2qWBO6G4NJ83uZ5VFRuB2V6gOmgrVpADZBgxO0F9b7DXegeu6fo5Fa3rLugQ/exec';

let searchData = [];
let searchDropdown = null;
let searchInput = null;

// Mapeo de tipos a páginas y secciones (útil para futuras referencias)
const typeToPage = {
    producto: { page: 'products.html', section: null },
    servicio: { page: 'services.html', section: 'precios-seccion' },
    pack:     { page: 'services.html', section: 'packs-seccion' },
    equipo:   { page: 'services.html', section: 'equipos-seccion' }
};

/**
 * Carga todos los datos desde la API y los unifica en searchData.
 */
async function loadSearchData() {
    try {
        const resp = await fetch(`${API_URL}?_=${Date.now()}`);
        const data = await resp.json();
        if (!data.success) return;
        
        searchData = [];
        // Productos
        (data.products || []).forEach(p => {
            searchData.push({
                type: 'producto',
                name: p.name,
                description: p.category || '',
                link: `products.html?search=${encodeURIComponent(p.name)}`
            });
        });
        // Servicios (precios por unidad)
        (data.precios || []).forEach(s => {
            searchData.push({
                type: 'servicio',
                name: s.servicio,
                description: s.categoria || '',
                link: 'services.html#precios-seccion'
            });
        });
        // Packs
        (data.packs || []).forEach(pk => {
            searchData.push({
                type: 'pack',
                name: pk.nombre,
                description: pk.categoria || '',
                link: 'services.html#packs-seccion'
            });
        });
        // Equipos
        (data.equipos || []).forEach(eq => {
            searchData.push({
                type: 'equipo',
                name: eq.marca,
                description: eq.procesador || '',
                link: 'services.html#equipos-seccion'
            });
        });
    } catch (err) {
        console.error('Error cargando datos de búsqueda:', err);
    }
}

/**
 * Crea el dropdown de búsqueda y lo inyecta en el DOM.
 */
function createSearchDropdown() {
    if (searchDropdown) return;
    searchDropdown = document.createElement('div');
    searchDropdown.id = 'searchDropdown';
    searchDropdown.className = 'search-dropdown';
    searchDropdown.innerHTML = '<div class="search-dropdown-inner"></div>';
    document.body.appendChild(searchDropdown);
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchDropdown.contains(e.target) && e.target !== searchInput) {
            searchDropdown.classList.remove('active');
        }
    });
}

/**
 * Muestra los resultados que coincidan con el término en el dropdown.
 */
function showResults(term) {
    if (!searchDropdown) createSearchDropdown();
    const inner = searchDropdown.querySelector('.search-dropdown-inner');
    if (!term || term.length < 2) {
        searchDropdown.classList.remove('active');
        return;
    }
    
    const t = term.toLowerCase();
    const matches = searchData.filter(item => 
        item.name.toLowerCase().includes(t) || 
        item.description.toLowerCase().includes(t)
    );
    
    if (matches.length === 0) {
        inner.innerHTML = '<div class="search-no-results">Sin resultados</div>';
        searchDropdown.classList.add('active');
        return;
    }
    
    inner.innerHTML = matches.slice(0, 10).map(item => `
        <div class="search-result-item" data-link="${item.link}">
            <span class="search-result-type type-${item.type}">${item.type}</span>
            <span class="search-result-name">${item.name}</span>
            <span class="search-result-desc">${item.description}</span>
        </div>
    `).join('');
    
    // Agregar evento clic a cada resultado
    inner.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            window.location.href = link;
        });
    });
    
    searchDropdown.classList.add('active');
}

/**
 * Inicializa la búsqueda global: asigna eventos al input.
 */
function initGlobalSearch() {
    searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;
    
    // Cargar datos una sola vez
    if (searchData.length === 0) {
        loadSearchData().then(() => {
            // Si ya hay texto escrito, mostrar resultados
            if (searchInput.value.trim().length >= 2) {
                showResults(searchInput.value.trim());
            }
        });
    }
    
    // Evento 'input' para búsqueda en tiempo real
    searchInput.addEventListener('input', function() {
        showResults(this.value.trim());
    });
    
    // Evento 'focus' para mostrar resultados si hay datos
    searchInput.addEventListener('focus', function() {
        if (searchData.length > 0 && this.value.trim().length >= 2) {
            showResults(this.value.trim());
        }
    });

    // Evento 'keypress' para manejar la tecla Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const term = this.value.trim();
            if (term.length >= 2 && searchData.length > 0) {
                const t = term.toLowerCase();
                const matches = searchData.filter(item => 
                    item.name.toLowerCase().includes(t) || 
                    item.description.toLowerCase().includes(t)
                );
                if (matches.length === 1) {
                    window.location.href = matches[0].link;
                } else if (matches.length > 1) {
                    showResults(term);  // Muestra el dropdown si hay varias coincidencias
                }
            }
        }
    });
}

// Inicializar la búsqueda cuando el header esté listo
function startSearchWhenReady() {
    if (window.headerReady) {
        initGlobalSearch();
    } else {
        window.addEventListener('headerReady', initGlobalSearch, { once: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSearchWhenReady);
} else {
    startSearchWhenReady();
}