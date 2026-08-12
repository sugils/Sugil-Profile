/* ==========================================================================
   Certification marquee — vanilla port of image-auto-slider.tsx.

   Reads the cert cards from the static grid in index.html (which stays in
   the DOM as the no-JS fallback) and rebuilds them as an infinite
   auto-scrolling strip: two duplicated groups slide left by -50% on a
   linear loop, so the seam is invisible. Styling lives in carousel.css.

   (The circular skills carousel and the projects fan carousel that used to
   live here were replaced by the shader cards in style.css and the
   article-card grid + detail modal in main.js.)
   ========================================================================== */
(function () {
    'use strict';

    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const textOf = (el) => (el ? el.textContent.trim() : '');

    function readCerts(grid) {
        if (!grid) return [];
        return $$('.cert-card', grid).map(card => {
            const icon = $('.card-icon i', card);
            return {
                icon: icon ? icon.className : 'bx bx-cube',
                title: textOf($('h3', card)),
                issuer: textOf($('p', card)),
                year: textOf($('.chip', card))
            };
        });
    }

    function createCertMarquee(mount, items) {
        if (!mount || !items.length) return;

        const buildGroup = (hidden) => {
            const group = document.createElement('div');
            group.className = 'cert-marquee-group';
            if (hidden) group.setAttribute('aria-hidden', 'true');

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'cert-m-card';
                card.innerHTML =
                    `<span class="cert-m-icon"><i class="${item.icon}"></i></span>` +
                    `<h4>${item.title}</h4>` +
                    `<p>${item.issuer}</p>` +
                    (item.year ? `<span class="chip">${item.year}</span>` : '');
                group.appendChild(card);
            });
            return group;
        };

        const track = document.createElement('div');
        track.className = 'cert-marquee-track';
        track.append(buildGroup(false), buildGroup(true));

        const root = document.createElement('div');
        root.className = 'cert-marquee';
        root.appendChild(track);

        mount.innerHTML = '';
        mount.appendChild(root);
    }

    function init() {
        createCertMarquee($('#certMarquee'), readCerts($('#certGrid')));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
