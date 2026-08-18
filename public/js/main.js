document.addEventListener("DOMContentLoaded", () => {
    // 1. Enable CSS animations
    document.body.classList.add('js-ready');

    // 2. Mobile Burger Menu Toggle & Slide-out Drawer
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

    // 3. Scroll Progress Bar & Floating Top Button
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
            if (scrollTop > 400) {
                topFloat.classList.add('show');
            } else {
                topFloat.classList.remove('show');
            }
        }
    });

    if (topFloat) {
        topFloat.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. Scroll Reveal Animations
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

    // 5. Subnav Scroll Spy
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
    // 6. DYNAMIC CONTENT INJECTION (CMS INTEGRATION)
    // ==========================================
    
    // Function to dynamically load page text from the backend
    async function loadDynamicText() {
        // Detect which page we are currently on based on the URL or the main ID
        let currentPage = 'index'; 
        if (window.location.pathname.includes('history.html')) currentPage = 'history';
        if (window.location.pathname.includes('renovation.html')) currentPage = 'renovation';

        // Check if there is a designated container for dynamic text on this HTML page
        const contentContainer = document.getElementById('dynamic-text-container');
        
        if (contentContainer) {
            try {
                const res = await fetch(`/api/content/${currentPage}`);
                if (res.ok) {
                    const dbData = await res.json();
                    if (dbData.data && dbData.data.text) {
                        // Replace the static HTML paragraph with the database text.
                        // We format the raw text to replace line breaks with paragraph tags for neatness.
                        const formattedText = dbData.data.text
                            .split('\n')
                            .filter(p => p.trim() !== '')
                            .map(p => `<p style="font-size:16.5px;line-height:1.95;color:var(--ink-soft);margin-bottom:16px;">${p}</p>`)
                            .join('');
                        
                        contentContainer.innerHTML = formattedText;
                    }
                }
            } catch (err) {
                console.warn("Could not load dynamic text. Falling back to static HTML.", err);
            }
        }
    }

    // Function to dynamically load Poojas into the table on pooja.html
    async function loadDynamicPoojas() {
        const poojaTableBody = document.getElementById('dynamic-pooja-table');
        if (poojaTableBody) {
            try {
                const res = await fetch('/api/poojas');
                if (res.ok) {
                    const poojas = await res.json();
                    if (poojas.length > 0) {
                        poojaTableBody.innerHTML = poojas.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.amount}</td>
                            </tr>
                        `).join('');
                    }
                }
            } catch (err) {
                console.warn("Could not load Poojas from backend.", err);
            }
        }
    }

    // Trigger the dynamic loading automatically
    loadDynamicText();
    loadDynamicPoojas();
});
