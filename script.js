document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const formMessage = document.getElementById('formMessage');
    if (name && email && message) {
        try {
            const res = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            if (res.ok) {
                formMessage.textContent = 'Thank you for contacting me, ' + name + '! Message sent successfully.';
                formMessage.style.color = 'green';
                this.reset();
            } else {
                formMessage.textContent = 'Failed to send message.';
                formMessage.style.color = 'red';
            }
        } catch {
            formMessage.textContent = 'Error sending message.';
            formMessage.style.color = 'red';
        }
    } else {
        formMessage.textContent = 'Please fill in all fields.';
        formMessage.style.color = 'red';
    }
});
