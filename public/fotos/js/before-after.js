// Manejador del deslizador de fotos Antes/Después
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.before-after-container');
    
    containers.forEach(container => {
        const slider = container.querySelector('.slider-bar');
        const beforeImage = container.querySelector('.before-image');
        
        if (!slider || !beforeImage) return;

        const moveSlider = (e) => {
            const rect = container.getBoundingClientRect();
            let x = (e.clientX || e.touches[0].clientX) - rect.left;
            
            // Forzar límites dentro del contenedor
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            
            const percentage = (x / rect.width) * 100;
            slider.style.left = `${percentage}%`;
            beforeImage.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100, 0 100)`;
        };

        // Eventos para Mouse y Pantallas Táctiles
        slider.addEventListener('mousedown', () => {
            window.addEventListener('mousemove', moveSlider);
        });
        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', moveSlider);
        });
        slider.addEventListener('touchstart', () => {
            window.addEventListener('touchmove', moveSlider);
        });
        window.addEventListener('touchend', () => {
            window.removeEventListener('touchmove', moveSlider);
        });
    });
});