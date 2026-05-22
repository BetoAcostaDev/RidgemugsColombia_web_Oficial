// =====================================================
// INCLUDE.JS
// Carga dinámica de header y footer, menú móvil y efectos
// =====================================================
document.addEventListener('DOMContentLoaded', function() {

    // Cargar header desde components/header.html
    fetch('components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // Marcar enlace activo según página actual
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
            // Notificar que el header está listo
                window.headerReady = true;
                document.dispatchEvent(new CustomEvent('headerReady'));
            // Inicializar menú hamburguesa DESPUÉS de insertar el header
            initMobileMenu();
        })
        .catch(error => console.error('Error cargando header:', error));

    // Cargar footer desde components/footer.html
    fetch('components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
            updateFooterYear();            // Actualizar año dinámico
            addFooterHoverEffects();      // Efectos hover en iconos
        })
        .catch(error => console.error('Error cargando footer:', error));
});

// =====================================================
// BOTÓN "VOLVER ARRIBA"
// =====================================================
const scrollBtn = document.createElement('div');
scrollBtn.id = 'scrollToTopBtn';
scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
document.body.appendChild(scrollBtn);

window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
        scrollBtn.classList.add('show');
    } else {
        scrollBtn.classList.remove('show');
    }
});

scrollBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/**
 * Configura el menú hamburguesa para móviles.
 */
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('mainNav');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
}

/**
 * Inserta el año actual en el footer.
 */
function updateFooterYear() {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.innerText = new Date().getFullYear();
}

/**
 * Añade efectos hover a los iconos sociales y al corazón.
 */
function addFooterHoverEffects() {
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
            icon.style.opacity = '0.9';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
            icon.style.opacity = '1';
        });
    });
    const heart = document.querySelector('.animated-heart');
    if (heart) {
        heart.addEventListener('mouseenter', () => {
            heart.style.transform = 'scale(1.2)';
        });
        heart.addEventListener('mouseleave', () => {
            heart.style.transform = 'scale(1)';
        });
    }
}

// =====================================================
// LIGHTBOX GLOBAL (para imágenes y videos)
// =====================================================
window.openLightbox = function(imgSrc) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    const img = document.createElement('img');
    img.src = imgSrc;
    lb.appendChild(img);
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
};

window.openVideoLightbox = function(videoSrc) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    const video = document.createElement('video');
    video.src = videoSrc;
    video.controls = true;
    video.autoplay = true;
    video.muted = false;
    video.style.maxWidth = '90%';
    video.style.maxHeight = '90%';
    lb.appendChild(video);
    lb.addEventListener('click', () => { video.pause(); lb.remove(); });
    document.body.appendChild(lb);
    video.play();
};