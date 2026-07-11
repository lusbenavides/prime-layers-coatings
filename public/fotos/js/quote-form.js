// Gestión del Formulario de Cotizaciones Inteligentes
document.addEventListener('DOMContentLoaded', () => {
    const quoteForm = document.getElementById('quote-form');
    const formResponse = document.getElementById('form-response');

    if (!quoteForm) return;

    quoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Animación de carga
        const submitBtn = quoteForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando cotización...';

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            projectType: document.getElementById('project-type').value,
            description: document.getElementById('description').value
        };

        try {
            const response = await fetch('/api/submit-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                formResponse.className = 'response-message success';
                formResponse.innerText = '¡Cotización recibida con éxito! Nuestro sistema inteligente la está procesando.';
                quoteForm.reset();
            } else {
                throw new Array(data.message || 'Error al procesar el formulario.');
            }
        } catch (error) {
            formResponse.className = 'response-message error';
            formResponse.innerText = `Hubo un inconveniente: ${error.message || 'Inténtalo más tarde.'}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
});