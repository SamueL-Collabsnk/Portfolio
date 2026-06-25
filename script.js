/* =============================================
   TEXT ROTATOR
   ============================================= */
(() => {
  const words = [
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Engineer',
  ];
  let i = 0;
  const span = document.querySelector('.text-animation span');
  if (!span) return;

  span.textContent = words[0];

  setInterval(() => {
    i = (i + 1) % words.length;
    span.textContent = words[i];
  }, 2500);
})();


/* =============================================
   MOBILE MENU TOGGLE
   ============================================= */
const menuIcon = document.getElementById('menu-icon');
const navbar = document.querySelector('.navbar');

if (menuIcon && navbar) {
  menuIcon.addEventListener('click', () => {
    navbar.classList.toggle('active');
    menuIcon.classList.toggle('bx-x'); // switches to X icon when open
  });

  // Close menu when a nav link is clicked
  navbar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('active');
      menuIcon.classList.remove('bx-x');
    });
  });
}


/* =============================================
   ACTIVE NAV LINK ON SCROLL
   ============================================= */
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.navbar a');
  const scrollY = window.scrollY;

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.navbar a[href="#${sectionId}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
});


/* =============================================
   CONTACT FORM – VALIDATION & SUBMISSION
   ============================================= */
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (field) field.classList.add('error');
  if (errorEl) errorEl.textContent = message;
}

function clearErrors() {
  ['name', 'email', 'subject', 'message'].forEach(id => {
    const field = document.getElementById(id);
    const errorEl = document.getElementById(`${id}-error`);
    if (field) field.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  });
  formStatus.className = 'form-status';
  formStatus.textContent = '';
}

function validateForm(data) {
  let valid = true;

  if (!data.name.trim()) {
    showError('name', 'Full name is required.');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    showError('email', 'Email address is required.');
    valid = false;
  } else if (!emailRegex.test(data.email)) {
    showError('email', 'Please enter a valid email address.');
    valid = false;
  }

  if (!data.subject.trim()) {
    showError('subject', 'Subject is required.');
    valid = false;
  }

  if (!data.message.trim()) {
    showError('message', 'Message cannot be empty.');
    valid = false;
  } else if (data.message.trim().length < 10) {
    showError('message', 'Message should be at least 10 characters.');
    valid = false;
  }

  return valid;
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value,
    };

    if (!validateForm(formData)) return;

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    btnIcon.className = 'bx bx-loader-alt bx-spin';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        formStatus.className = 'form-status success';
        formStatus.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
        form.reset();
      } else {
        throw new Error(result.message || 'Server error. Please try again.');
      }
    } catch (err) {
      formStatus.className = 'form-status error';
      formStatus.textContent = `✗ ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Send Message';
      btnIcon.className = 'bx bx-send';
    }
  });
}
