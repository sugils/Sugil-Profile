/* ==========================================================================
   Sugil S — Portfolio interactions
   ========================================================================== */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* --------------------------------------------------------------------------
   Theme
   -------------------------------------------------------------------------- */
(function initTheme() {
    const root = document.documentElement;
    const toggle = $('#themeToggle');
    if (!toggle) return;

    // The initial theme is resolved by the inline script in <head> to avoid a flash.
    toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);

        const meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', next === 'dark' ? '#030D26' : '#F5F6FA');
    });
})();

/* --------------------------------------------------------------------------
   Blur text (hero) — vanilla port of the BlurText component: the target's
   text is split into letter/word segments that blur and drop in one by one
   once the element scrolls into view.

   data-blur="letters|words"   how to split
   data-blur-delay="90"        stagger per segment (ms)
   data-blur-start="450"       extra base delay, for sequencing lines (ms)
   -------------------------------------------------------------------------- */
(function initBlurText() {
    const targets = $$('[data-blur]');
    if (!targets.length) return;

    if (REDUCED_MOTION) {
        targets.forEach(el => el.classList.add('blur-in'));
        return;
    }

    targets.forEach(el => {
        const step = Number(el.dataset.blurDelay) || 80;
        const start = Number(el.dataset.blurStart) || 0;
        const text = el.textContent.trim();
        const segments = el.dataset.blur === 'words' ? text.split(/\s+/) : Array.from(text);

        el.textContent = '';
        segments.forEach((seg, i) => {
            const span = document.createElement('span');
            span.className = 'blur-seg';
            span.style.setProperty('--bd', (start + i * step) + 'ms');
            // Words are joined with U+00A0 (a normal trailing space would
            // collapse inside the inline-block segment); letters butt up.
            span.textContent = seg + (el.dataset.blur === 'words' && i < segments.length - 1 ? ' ' : '');
            el.appendChild(span);
        });
        el.classList.add('blur-split');
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('blur-in');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.1 });

    targets.forEach(el => io.observe(el));
})();

/* --------------------------------------------------------------------------
   Navigation: scrolled state, mobile menu, active link
   -------------------------------------------------------------------------- */
(function initNav() {
    const navbar = $('#navbar');
    const menu = $('#navMenu');
    const toggle = $('#navToggle');
    const links = $$('.nav-link');

    const closeMenu = () => {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    });

    links.forEach(link => link.addEventListener('click', () => {
        closeMenu();
        // Reflect the target right away rather than waiting for the smooth
        // scroll to travel far enough for the scroll handler to catch up.
        links.forEach(l => l.classList.toggle('active', l === link));
    }));

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    // Active link tracking — the section occupying the upper third of the viewport wins.
    const sections = $$('section[id]');

    const syncActive = () => {
        const marker = window.scrollY + window.innerHeight * 0.32;
        let current = sections.length ? sections[0].id : '';

        sections.forEach(section => {
            if (marker >= section.offsetTop) current = section.id;
        });

        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
        syncActive();
    }, { passive: true });

    syncActive();
})();

/* --------------------------------------------------------------------------
   Scroll progress bar + back-to-top ring
   -------------------------------------------------------------------------- */
(function initScrollProgress() {
    const bar = $('#progressBar');
    const btn = $('#backToTop');
    const ring = $('#ringBar');
    const CIRC = 2 * Math.PI * 20;

    const update = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const pct = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;

        bar.style.width = `${pct * 100}%`;
        ring.style.strokeDashoffset = String(CIRC - pct * CIRC);
        btn.classList.toggle('show', window.scrollY > 480);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    });
})();

/* --------------------------------------------------------------------------
   Scroll reveal + counters
   -------------------------------------------------------------------------- */
(function initReveal() {
    const items = $$('[data-reveal]');

    if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('revealed'));
        $$('.counter').forEach(el => { el.textContent = el.dataset.count; });
        return;
    }

    const countUp = (el) => {
        const target = Number(el.dataset.count) || 0;
        const duration = 1400;
        const start = performance.now();

        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = String(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            $$('.counter', entry.target).forEach(countUp);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(el => observer.observe(el));
})();

/* --------------------------------------------------------------------------
   Stacked section scrolling — each .stack-panel pins while the next section
   slides up over it (the motion-footer "curtain reveal", generalised).
   Panels shorter than the viewport pin at the top (top: 0); taller ones are
   bottom-anchored (top: viewport − height) so all their content scrolls
   into view before the next sheet covers them.
   -------------------------------------------------------------------------- */
(function initStackPanels() {
    const panels = $$('.stack-panel');
    if (!panels.length) return;

    const measure = () => {
        panels.forEach(panel => {
            panel.style.top = Math.min(0, window.innerHeight - panel.offsetHeight) + 'px';
        });
    };

    // Panel heights move whenever content does (project filters, image loads,
    // viewport changes) — ResizeObserver catches all of it.
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(measure);
        panels.forEach(panel => ro.observe(panel));
    }

    let timer = null;
    window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(measure, 150);
    });
    window.addEventListener('load', measure);
    measure();
})();

/* --------------------------------------------------------------------------
   Timeline progress rail
   -------------------------------------------------------------------------- */
(function initTimeline() {
    const timeline = $('#timeline');
    const fill = $('#timelineFill');
    if (!timeline || !fill) return;

    const update = () => {
        const rect = timeline.getBoundingClientRect();
        const anchor = window.innerHeight * 0.55;
        const progress = (anchor - rect.top) / rect.height;
        fill.style.height = `${Math.max(0, Math.min(progress, 1)) * 100}%`;
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

/* The cursor-tracking card spotlight was removed with the frosted-glass look;
   cards are solid surfaces now, so there is no glow to follow the pointer. */

/* --------------------------------------------------------------------------
   Magnetic buttons
   -------------------------------------------------------------------------- */
(function initMagnetic() {
    if (REDUCED_MOTION || window.matchMedia('(hover: none)').matches) return;

    $$('.magnetic').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
        });

        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
})();

/* --------------------------------------------------------------------------
   Projects — article-card grid: the filter bar shows/hides cards, and
   clicking a card opens the detail modal. Card markup (cover image +
   gradient) stays in index.html; only the extended details live here.
   -------------------------------------------------------------------------- */
const PROJECT_DETAILS = {
    fraud: {
        category: 'Decision AI · Streaming',
        title: 'Real-Time Fraud Detection System',
        role: 'Decision AI · Streaming Inference',
        stack: ['Python', 'Apache Kafka', 'Anomaly Detection', 'Feature Engineering'],
        points: [
            'Built an anomaly detection model that identifies fraudulent patterns in streaming data.',
            'Backed by a Kafka pipeline for continuous ingestion and real-time inference.',
            'Applied predictive modeling and feature engineering to lift detection accuracy.',
            'Tuned the system for low-latency, high-throughput decision-making.',
        ],
    },
    learning: {
        category: 'AI · Full Stack',
        title: 'AI-Powered Learning & Evaluation System',
        role: 'Full Stack & AI Developer',
        stack: ['Azure OpenAI', 'Whisper', 'Python', 'Flask', 'React.js', 'PostgreSQL'],
        points: [
            'Developed an AI-powered application that automates the trainee review process using LLMs and speech recognition.',
            'AI asks questions based on a knowledge base (KB) containing the syllabus and tracks intern activity during the review.',
            'Speech-to-text processing was implemented using Whisper AI.',
            'Validates responses and provides real-time feedback.',
        ],
    },
    cloudarch: {
        category: 'Cloud Automation',
        title: 'AI-Powered Cloud Architecture Automation',
        role: 'Backend & AI Developer',
        stack: ['Python', 'React.js', 'AWS', 'Azure', 'Terraform', 'GitHub', 'GitLab', 'Azure DevOps', 'Bitbucket'],
        points: [
            'Automated cloud architecture creation using AI based on user inputs like project name, cloud provider (AWS, Azure, GCP), and architecture type (DataOps, Serverless, etc.).',
            'AI-generated architecture diagrams that users can validate and regenerate as needed.',
            'Code generation and deployment via SCM integration (GitHub, GitLab, Azure DevOps, Bitbucket).',
            'Implemented cost tracking dashboards to monitor cloud spending per service.',
        ],
    },
    report: {
        category: 'GenAI · AWS',
        title: 'Report Generator using AWS AI Models (Bedrock)',
        role: 'Full Stack & AI Developer',
        stack: ['AWS Bedrock', 'Playwright', 'Vision Models', 'Python', 'Flask', 'Snowflake'],
        points: [
            'Developed an AI-powered report generator that processes call transcripts, meeting documents, and cloud architectures.',
            'Used chunking techniques to process large files and generate summaries.',
            'Vision models analyzed business flow diagrams to generate detailed descriptions.',
            'AI provided cloud architecture analysis, including pros, cons, and future improvements.',
            'Integrated AWS billing scraping using Playwright to track cloud costs.',
        ],
    },
    insight: {
        category: 'Data · GenAI',
        title: 'AI-Powered Insight Generation',
        role: 'Full Stack & AI Developer',
        stack: ['AWS Bedrock', 'Snowflake', 'Python', 'Flask', 'React.js'],
        points: [
            'Developed an automated insight generation system that fetches data from Snowflake based on query generation via AWS Bedrock.',
            'Generates insights on weekly, monthly, and quarterly intervals.',
            'Connected to Snowflake DB to fetch real-time business data.',
            'Implemented automated email reports to send insights to clients.',
            'AI chatbot allows users to query specific client data and get responses in real time.',
        ],
    },
    voice: {
        category: 'Conversational AI',
        title: 'Voice Agent with Whisper & GPT',
        role: 'AI & Full Stack Engineer',
        stack: ['OpenAI Whisper', 'GPT-4', 'Python', 'React', 'PostgreSQL'],
        points: [
            'Conversational AI that improves communication skills through real-time voice interaction.',
            'Gives detailed feedback on speech patterns, clarity and conversation flow.',
            'Admin dashboard monitors every training session and user progress.',
        ],
    },
    recruit: {
        category: 'AI Agents',
        title: 'Recruitment Automation with AI Agents',
        role: 'AI/ML & Backend Engineer',
        stack: ['LangChain', 'AWS Bedrock', 'AI Agents', 'FastAPI', 'React'],
        points: [
            'End-to-end recruitment platform powered by multiple AI agents that handle sourcing, resume screening, interview scheduling and follow-up.',
            'Agents orchestrate the workflow and match candidates to roles.',
            'Runs personalised outreach campaigns automatically.',
        ],
    },
    toolkit: {
        category: 'AI Platform',
        title: 'Recruiter Toolkit — All-in-One AI Platform',
        role: 'Full Stack AI Developer',
        stack: ['GPT-4', 'NLP', 'Vector DB', 'Flask', 'React'],
        points: [
            'JD Analyzer and Profile Reranker for candidate scoring.',
            'Boolean query generator, email generator and resume parser.',
            'Skills matcher and interview-question generator in one intelligent recruitment workflow.',
        ],
    },
};

const projectModal = (() => {
    let lastFocus = null;

    function open(card) {
        const data = PROJECT_DETAILS[card.dataset.project];
        if (!data) return;

        // The hero reuses the clicked card's cover image and gradient.
        const hero = $('#pmHero');
        ['--card-img', '--g1', '--g2'].forEach(prop => {
            hero.style.setProperty(prop, card.style.getPropertyValue(prop));
        });

        $('#pmCategory').textContent = data.category;
        $('#pmTitle').textContent = data.title;
        $('#pmRoleText').textContent = data.role;

        const stack = $('#pmStack');
        stack.innerHTML = '';
        data.stack.forEach(tech => {
            const span = document.createElement('span');
            span.textContent = tech;
            stack.appendChild(span);
        });

        const points = $('#pmPoints');
        points.innerHTML = '';
        data.points.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            points.appendChild(li);
        });

        lastFocus = document.activeElement;
        $('#projectModal').classList.add('open');
        document.body.style.overflow = 'hidden';
        $('#pmClose').focus();
    }

    function close() {
        const modal = $('#projectModal');
        if (!modal.classList.contains('open')) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    $$('#projectsGrid .article-card').forEach(card => {
        card.addEventListener('click', () => open(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
        });
    });

    return { open, close };
})();

function closeProject() { projectModal.close(); }

(function initProjectFilter() {
    const buttons = $$('.filter-btn');
    const cards = $$('#projectsGrid .article-card');
    if (!buttons.length || !cards.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('aria-current');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'true');

            const filter = btn.dataset.filter;
            cards.forEach(card => {
                const show = filter === 'all' || card.dataset.category.split(' ').includes(filter);
                card.classList.toggle('is-hidden', !show);
            });
        });
    });
})();

/* --------------------------------------------------------------------------
   Resume viewer — PDF.js pages rendered onto canvases inside the modal, so
   the styling is ours instead of the browser's grey plugin chrome. PDF.js is
   fetched lazily on first open; if the CDN (or rendering) fails we fall back
   to the plain <iframe> viewer so the resume always stays reachable.
   -------------------------------------------------------------------------- */
const RESUME_PATH = 'SUGIL%20-AI-ML%20Analyst%20Resume.pdf';
const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const resumeViewer = (() => {
    const ZOOM_MIN = 50, ZOOM_MAX = 250, ZOOM_STEP = 25;

    let pdfDoc = null;
    let fitScale = 1;        // scale at which page 1 fills the body width (= 100%)
    let zoom = 100;
    let renderToken = 0;     // stale async renders bail out when this moves on
    let pdfjsPromise = null;
    let started = false;
    let failed = false;
    let lastFocus = null;

    function loadPdfJs() {
        if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
        if (!pdfjsPromise) {
            pdfjsPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = PDFJS_SRC;
                script.onload = () => {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
                    resolve(window.pdfjsLib);
                };
                script.onerror = () => { pdfjsPromise = null; reject(new Error('PDF.js failed to load')); };
                document.head.appendChild(script);
            });
        }
        return pdfjsPromise;
    }

    function computeFitScale(baseWidth) {
        const body = $('#rvBody');
        const padding = 56; // .rv-pages-wrap horizontal padding both sides
        return Math.max(0.4, (body.clientWidth - padding) / baseWidth);
    }

    /* PDF.js forbids two render() calls on one canvas at once, so renders are
       serialized through a queue; stale queued passes bail out via the token. */
    let renderQueue = Promise.resolve();

    function renderPages() {
        const token = ++renderToken;
        renderQueue = renderQueue.then(() => renderPass(token)).catch(() => {});
        return renderQueue;
    }

    async function renderPass(token) {
        const wrap = $('#rvPagesWrap');
        const scale = fitScale * (zoom / 100);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            if (token !== renderToken) return;
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale });

            let holder = wrap.children[i - 1];
            if (!holder) {
                holder = document.createElement('div');
                holder.className = 'rv-page';
                holder.appendChild(document.createElement('canvas'));
                wrap.appendChild(holder);
            }

            const canvas = holder.firstElementChild;
            canvas.width = Math.floor(viewport.width * dpr);
            canvas.height = Math.floor(viewport.height * dpr);
            canvas.style.width = Math.floor(viewport.width) + 'px';
            canvas.style.height = Math.floor(viewport.height) + 'px';

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport,
                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
            }).promise;
        }
    }

    function setZoom(next) {
        if (!pdfDoc) return;
        zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
        $('#rvZoomLevel').textContent = zoom + '%';
        renderPages();
    }

    function updatePageIndicator() {
        if (!pdfDoc) return;
        const body = $('#rvBody');
        const pages = $$('.rv-page', body);
        if (!pages.length) return;
        const marker = body.scrollTop + body.clientHeight / 2;
        let current = 1;
        pages.forEach((p, i) => { if (p.offsetTop <= marker) current = i + 1; });
        $('#rvPageIndicator').textContent = current + ' / ' + pdfDoc.numPages;
    }

    function fallbackToIframe() {
        failed = true;
        $('#resumeViewer').classList.add('rv-fallback');
        $('#rvLoading').hidden = true;
        const wrap = $('#rvPagesWrap');
        wrap.innerHTML = '';
        const frame = document.createElement('iframe');
        frame.title = 'Resume PDF';
        frame.src = RESUME_PATH;
        wrap.appendChild(frame);
    }

    async function start() {
        if (started) return;
        started = true;
        $('#rvLoading').hidden = false;

        try {
            const pdfjs = await loadPdfJs();
            pdfDoc = await pdfjs.getDocument(RESUME_PATH).promise;
            const baseWidth = (await pdfDoc.getPage(1)).getViewport({ scale: 1 }).width;
            fitScale = computeFitScale(baseWidth);
            await renderPages();
            $('#rvLoading').hidden = true;
            updatePageIndicator();
        } catch (err) {
            fallbackToIframe();
        }
    }

    function refit() {
        if (!pdfDoc || !$('#resumeModal').classList.contains('open')) return;
        pdfDoc.getPage(1).then(page => {
            fitScale = computeFitScale(page.getViewport({ scale: 1 }).width);
            renderPages();
        });
    }

    // Wire up controls once the DOM is there.
    $('#rvZoomIn').addEventListener('click', () => setZoom(zoom + ZOOM_STEP));
    $('#rvZoomOut').addEventListener('click', () => setZoom(zoom - ZOOM_STEP));
    $('#rvBody').addEventListener('scroll', updatePageIndicator, { passive: true });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refit, 200);
    });

    document.addEventListener('keydown', (e) => {
        if (!$('#resumeModal').classList.contains('open') || e.ctrlKey || e.metaKey) return;
        if (e.key === '+' || e.key === '=') setZoom(zoom + ZOOM_STEP);
        if (e.key === '-') setZoom(zoom - ZOOM_STEP);
    });

    return {
        open() {
            lastFocus = document.activeElement;
            $('#resumeModal').classList.add('open');
            document.body.style.overflow = 'hidden';
            $('#rvClose').focus();
            if (!failed) {
                if (started) refit(); // window may have resized while closed
                else start();
            }
        },
        close() {
            $('#resumeModal').classList.remove('open');
            document.body.style.overflow = '';
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        },
    };
})();

function openResume() { resumeViewer.open(); }
function closeResume() { resumeViewer.close(); }

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeResume(); closeProject(); }
});

/* --------------------------------------------------------------------------
   Contact form (EmailJS)
   -------------------------------------------------------------------------- */
(function initContactForm() {
    const form = $('#contact-form');
    const status = $('#status-message');
    if (!form) return;

    const setStatus = (message, type) => {
        status.textContent = message;
        status.className = type;
        if (type === 'success') setTimeout(() => { status.textContent = ''; status.className = ''; }, 6000);
    };

    if (typeof emailjs === 'undefined') {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            setStatus('Mail service is unavailable right now — please email me directly.', 'error');
        });
        return;
    }

    emailjs.init('gLwmgYS20sKhG4pM0');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = $('#name').value.trim();
        const email = $('#email').value.trim();
        const subject = $('#subject').value.trim();
        const message = $('#message').value.trim();

        if (!name || !email || !subject || !message) {
            setStatus('Please fill out every field before sending.', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('That email address does not look valid.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Sending...";
        submitBtn.disabled = true;

        const restore = () => {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        };

        emailjs.send('service_dmjrtz9', 'template_zyb7utf', { name, email, subject, message })
            .then(() => {
                setStatus('Message sent — I will get back to you shortly.', 'success');
                form.reset();
                restore();
            })
            .catch((error) => {
                console.error('EmailJS error:', error);
                setStatus('Could not send the message. Please email me directly instead.', 'error');
                restore();
            });
    });
})();

/* --------------------------------------------------------------------------
   Misc
   -------------------------------------------------------------------------- */
(function initMisc() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
})();

console.log('%c Sugil S — AI/ML Engineer ', 'background:#4F80F0;color:#fff;font-size:15px;font-weight:700;padding:8px 14px;border-radius:6px;');
console.log('%c NLP · LLMs · Decision Systems · Cloud AI ', 'color:#2FBFA4;font-size:12px;padding:4px;');
