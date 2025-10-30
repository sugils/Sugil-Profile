// ========================================
// Typed.js Initialization
// ========================================
var typed = new Typed(".text", {
    strings: [
        "AI/ML Analyst",
        "Full Stack Developer",
        "Python Developer",
        "Gen-AI Developer",
        "Cloud Solutions Architect"
    ],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true
});

// ========================================
// Resume Modal Functions
// ========================================
function openResume() {
    document.getElementById("resumeModal").style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeResume() {
    document.getElementById("resumeModal").style.display = "none";
    document.body.style.overflow = "auto";
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('resumeModal');
    if (event.target === modal || event.target.classList.contains('modal-overlay')) {
        closeResume();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeResume();
    }
});

// ========================================
// Clear URL Parameters on Load
// ========================================
if (window.location.search) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ========================================
// EmailJS Contact Form
// ========================================
document.addEventListener("DOMContentLoaded", function () {
    // Initialize EmailJS
    emailjs.init("gLwmgYS20sKhG4pM0");

    // Contact form submission
    document.getElementById("contact-form").addEventListener("submit", function (event) {
        event.preventDefault();

        // Get form values
        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim();
        let subject = document.getElementById("subject").value.trim();
        let message = document.getElementById("message").value.trim();

        console.log("Form Data:");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Subject:", subject);
        console.log("Message:", message);

        // Validate inputs
        if (!name || !email || !subject || !message) {
            showStatusMessage("❌ Please fill out all fields before sending.", "error");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showStatusMessage("❌ Please enter a valid email address.", "error");
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector("#contact-form button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Sending...";
        submitBtn.disabled = true;

        // EmailJS template parameters
        let templateParams = {
            name: name,
            email: email,
            subject: subject,
            message: message
        };

        // Send email via EmailJS
        emailjs.send("service_dmjrtz9", "template_zyb7utf", templateParams)
            .then(function (response) {
                console.log("✅ Email sent successfully!", response);
                showStatusMessage("✅ Message Sent Successfully! I'll get back to you soon.", "success");
                document.getElementById("contact-form").reset();
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            })
            .catch(function (error) {
                console.error("❌ Error sending email:", error);
                showStatusMessage("❌ Error Sending Message. Please try again later.", "error");
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
    });
});

// ========================================
// Status Message Display
// ========================================
function showStatusMessage(message, type) {
    const statusElement = document.getElementById("status-message");
    statusElement.textContent = message;
    statusElement.style.color = type === "success" ? "#00eeff" : "#ff3366";
    statusElement.style.fontWeight = "600";
    statusElement.style.marginTop = "20px";
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusElement.textContent = "";
    }, 5000);
}

// ========================================
// Smooth Scrolling
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offset = 80; // Height of fixed navbar
            const targetPosition = target.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// Active Navigation Link
// ========================================
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ========================================
// Scroll to Top Button
// ========================================
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '<i class="bx bx-up-arrow-alt"></i>';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: var(--primary-color);
    color: var(--dark-bg);
    border: none;
    border-radius: 12px;
    font-size: 24px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 999;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 238, 255, 0.3);
`;

document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

scrollToTopBtn.addEventListener('mouseenter', () => {
    scrollToTopBtn.style.transform = 'translateY(-5px)';
    scrollToTopBtn.style.boxShadow = '0 8px 25px rgba(0, 238, 255, 0.4)';
});

scrollToTopBtn.addEventListener('mouseleave', () => {
    scrollToTopBtn.style.transform = 'translateY(0)';
    scrollToTopBtn.style.boxShadow = '0 4px 15px rgba(0, 238, 255, 0.3)';
});

// ========================================
// Intersection Observer for Animations
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.about-card, .timeline-card, .skill-card, .project-card, .cert-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ========================================
// Console Welcome Message
// ========================================
console.log('%c Welcome to Sugil\'s Portfolio! ', 'background: #00eeff; color: #0a0e27; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c AI/ML Analyst | Full Stack Developer | Cloud Solutions Architect ', 'background: #0a0e27; color: #00eeff; font-size: 14px; padding: 5px;');
console.log('%c Looking to collaborate? Let\'s connect! ', 'color: #00eeff; font-size: 12px;');
