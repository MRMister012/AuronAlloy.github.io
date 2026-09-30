/* ---------- Menú desplegable ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const dropdownItems = document.querySelectorAll('.has-dropdown');

    dropdownItems.forEach(item => {
        const toggleBtn = item.querySelector('.dropdown-toggle');
        if (!toggleBtn) return;
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownItems.forEach(other => { if (other !== item) other.classList.remove('open'); });
            item.classList.toggle('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header')) dropdownItems.forEach(i => i.classList.remove('open'));
    });
    document.querySelectorAll('.dropdown-link').forEach(l =>
        l.addEventListener('click', () => dropdownItems.forEach(i => i.classList.remove('open'))));

    // Cada parte va aislada: si una falla, las demás siguen funcionando
    [initMiniCalendar, initQuotes, initForm].forEach(fn => {
        try { fn(); } catch (err) { console.error(`Error en ${fn.name}:`, err); }
    });
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
});

/* ---------- Calendario de muestra (portafolio) ---------- */
function initMiniCalendar() {
    const grid = document.getElementById('mini-cal');
    if (!grid) return;
    const events = [3, 9, 14, 21, 27];
    let html = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="wd">${d}</span>`).join('');
    html += '<span></span><span></span>'; // el mes empieza en miércoles
    for (let d = 1; d <= 31; d++) {
        const cls = d === 14 ? 'today' : events.includes(d) ? 'ev' : '';
        html += `<span class="${cls}">${d}</span>`;
    }
    grid.innerHTML = html;
}

/* ---------- Carrusel de opiniones ---------- */
function initQuotes() {
    const quotes = document.querySelectorAll('.quote');
    const dotsBox = document.querySelector('.dots');
    if (!quotes.length || !dotsBox) return;

    let current = 0, timer;
    const dots = [...quotes].map((_, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.type = 'button';
        b.setAttribute('aria-label', `Opinión ${i + 1}`);
        b.addEventListener('click', () => { show(i); restart(); });
        dotsBox.appendChild(b);
        return b;
    });

    function show(i) {
        current = i;
        quotes.forEach((q, n) => q.classList.toggle('active', n === i));
        dots.forEach((d, n) => d.classList.toggle('active', n === i));
    }
    function restart() {
        clearInterval(timer);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            timer = setInterval(() => show((current + 1) % quotes.length), 6000);
    }
    show(0);
    restart();
}

/* ---------- Formulario de contacto (Web3Forms) ---------- */

function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = document.getElementById('form-status');

    const rules = {
        nombre: v => v.trim() ? '' : 'Escribe tu nombre.',
        apellido: v => v.trim() ? '' : 'Escribe tu apellido.',
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Escribe un correo válido, como nombre@correo.com.',
        telefono: v => v.replace(/\D/g, '').length >= 10 ? '' : 'Escribe un número de al menos 10 dígitos.',
        tipo: v => v ? '' : 'Selecciona una opción.'
    };

    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[Contacto] Enviando formulario...');
        let valid = true;
        Object.keys(rules).forEach(name => {
            const field = form.elements[name];
            const msg = rules[name](field.value);
            field.setAttribute('aria-invalid', msg ? 'true' : 'false');
            field.closest('.form-row').querySelector('.error').textContent = msg;
            if (msg && valid) { field.focus(); valid = false; }
        });
        if (!valid) {
            status.className = 'form-status bad';
            status.textContent = 'Revisa los campos marcados en rojo.';
            return;
        }

        // Web3Forms espera un campo "name": lo armamos con nombre y apellido
        document.getElementById('full-name').value =
            `${form.elements['nombre'].value.trim()} ${form.elements['apellido'].value.trim()}`;

        const payload = Object.fromEntries(new FormData(form));
        payload.subject = `Nuevo contacto desde Aureon Alloy: ${payload.tipo}`;
        if (!payload.message.trim()) payload.message = '(Sin mensaje)';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        status.className = 'form-status';
        status.textContent = '';

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || 'Error al enviar');

            form.reset();
            status.className = 'form-status ok';
            status.textContent = 'Mensaje enviado. Te contactaremos pronto.';
        } catch (err) {
            console.error('Web3Forms:', err);
            status.className = 'form-status bad';
            status.textContent = 'No pudimos enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar';
        }
    });
}