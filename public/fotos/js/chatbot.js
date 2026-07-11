// Widget de Chat Flotante - Asistente Ava
document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatToggle || !chatWindow) return;

    // Abrir / Cerrar Chat
    chatToggle.addEventListener('click', () => chatWindow.classList.toggle('active'));
    closeChat.addEventListener('click', () => chatWindow.classList.remove('active'));

    // Enviar mensaje
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Agregar mensaje del usuario a la pantalla
        appendMessage('user', message);
        chatInput.value = '';

        // Indicador de "escribiendo..."
        const typingId = appendMessage('bot', 'Ava está escribiendo...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            
            // Remover indicador y poner respuesta real
            document.getElementById(typingId)?.remove();
            appendMessage('bot', data.reply || 'Lo siento, tuve un problema al procesar tu mensaje.');
        } catch (error) {
            document.getElementById(typingId)?.remove();
            appendMessage('bot', 'Error de conexión. Por favor intenta de nuevo.');
        }
    });

    function appendMessage(sender, text) {
        const id = 'msg-' + Math.random().toString(36).substr(2, 9);
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = `message ${sender}-message`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }
});