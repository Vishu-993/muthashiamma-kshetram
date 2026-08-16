document.addEventListener("DOMContentLoaded", () => {
    // 1. Enable CSS animations by adding a class to the body
    document.body.classList.add('js-ready');

    // 2. Mobile Burger Menu Toggle
    const burgerBtn = document.getElementById('burgerBtn');
    const navlinks = document.getElementById('navlinks');
    
    if (burgerBtn && navlinks) {
        burgerBtn.addEventListener('click', () => {
            const isOpen = navlinks.classList.toggle('open');
            burgerBtn.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when clicking a link (mobile)
        navlinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navlinks.classList.remove('open');
                burgerBtn.setAttribute('aria-expanded', 'false');
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
        
        // Update Progress Bar
        if (progressBar) {
            let scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
            progressBar.style.width = scrollPercent + '%';
        }

        // Show/Hide Back to Top Button
        if (topFloat) {
            if (scrollTop > 400) {
                topFloat.classList.add('show');
            } else {
                topFloat.classList.remove('show');
            }
        }
    });

    // 4. Scroll Reveal Animations (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal, .stagger');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 5. Subnav Scroll Spy (Highlight active section)
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
                        // Optional: smoothly scroll the subnav container to keep the active pill visible
                        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                });
            }
        });
    }, {
        // Triggers when a section reaches the middle of the viewport
        rootMargin: "-20% 0px -70% 0px" 
    });

    sections.forEach(section => sectionObserver.observe(section));
});

// 6. Toast Notification Function (Ready for future use)
window.showToast = function(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};
