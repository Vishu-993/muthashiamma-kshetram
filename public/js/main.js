document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add('js-ready');

    // Mobile Burger Menu Toggle
    const burgerBtn = document.getElementById('burgerBtn');
    const navlinks = document.getElementById('navlinks');
    
    const overlay = document.createElement('div');
    overlay.classList.add('nav-overlay');
    document.body.appendChild(overlay);

    function toggleMenu() {
        const isOpen = navlinks.classList.toggle('open');
        burgerBtn.classList.toggle('active', isOpen);
        overlay.classList.toggle('show', isOpen);
        burgerBtn.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (burgerBtn && navlinks) {
        burgerBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        navlinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navlinks.classList.contains('open')) toggleMenu();
            });
        });
    }

    // Scroll Progress & Top Button
    const progressBar = document.getElementById('progressBar');
    const topFloat = document.getElementById('topFloat');

    window.addEventListener('scroll', () => {
        let scrollTop = window.scrollY;
        let docHeight = document.documentElement.scrollHeight;
        let winHeight = window.innerHeight;
        
        if (progressBar) {
            let scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
            progressBar.style.width = scrollPercent + '%';
        }
        if (topFloat) {
            if (scrollTop > 400) { topFloat.classList.add('show'); } 
            else { topFloat.classList.remove('show'); }
        }
    });

    if (topFloat) {
        topFloat.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Animations & Scroll Spy
    const revealElements = document.querySelectorAll('.reveal, .stagger');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    revealElements.forEach(el => revealObserver.observe(el));

    const sections = document.querySelectorAll('section');
    const pills = document.querySelectorAll('.pill');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let currentId = entry.target.getAttribute('id');
                pills.forEach(pill => {
                    pill.classList.remove('active');
                    if (pill.getAttribute('href') === `#${currentId}`) {
                        pill.classList.add('active');
                        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                });
            }
        });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach(section => sectionObserver.observe(section));

    // ==========================================
    // NEW DYNAMIC DICTIONARY INJECTION SYSTEM 
    // ==========================================
    
    async function loadDynamicText() {
        let currentPage = 'index'; 
        const path = window.location.pathname;

        // Routing logic for Clean URLs (supporting both formats)
        if (path.includes('/history') || path.includes('history.html')) currentPage = 'history';
        else if (path.includes('/renovation') || path.includes('renovation.html')) currentPage = 'renovation';
        else if (path.includes('/kalari') || path.includes('kalari.html')) currentPage = 'kalari';
        else if (path.includes('/gallery') || path.includes('gallery.html')) currentPage = 'gallery';
        else if (path.includes('/contact') || path.includes('contact.html')) currentPage = 'contact';
        else currentPage = 'index'; // Defaults to root

        try {
            const res = await fetch(`/api/content/${currentPage}`);
            if (res.ok) {
                const dbData = await res.json();
                const content = dbData.data || {};

                // Ensure the content is an object (dictionary format)
                if (typeof content === 'object') {
                    // Find ALL elements on the page that have a "data-edit" attribute
                    // and replace their text with the corrected text from the Admin Panel
                    Object.keys(content).forEach(key => {
                        const el = document.querySelector(`[data-edit="${key}"]`);
                        if (el) {
                            el.innerHTML = content[key];
                        }
                    });
                }
            }
        } catch (err) {
            console.warn("Could not load dynamic text dictionary.", err);
        }
    }

    // ==========================================
    // DYNAMIC POOJAS INJECTION
    // ==========================================
    async function loadDynamicPoojas() {
        const poojaTableBody = document.getElementById('dynamic-pooja-table');
        if (poojaTableBody) {
            try {
                const res = await fetch('/api/poojas');
                if (res.ok) {
                    const poojas = await res.json();
                    if (poojas && poojas.length > 0) {
                        
                        // FIX: We use insertAdjacentHTML so we APPEND the new poojas 
                        // to the bottom of the table without deleting the original ones!
                        const dynamicRows = poojas.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.amount}</td>
                            </tr>
                        `).join('');
                        
                        poojaTableBody.insertAdjacentHTML('beforeend', dynamicRows);
                    }
                }
            } catch (err) {
                console.warn("Could not load Poojas.", err);
            }
        }
    }

    // Initialize both data fetches
    loadDynamicText();
    loadDynamicPoojas();
});
