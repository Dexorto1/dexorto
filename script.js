import initParticles from './Particles.js';
import { initAllSpotlights } from './SpotlightCard.js';
import initDecryptedText from './DecryptedText.js';
import initCustomCursor from './Cursor.js';

// Initialize Custom Interactive Cursor & Background Light Interaction
initCustomCursor();

// Initialize 3D Particle Background
const particlesContainer = document.getElementById('particles-bg');
if (particlesContainer) {
  initParticles(particlesContainer, {
    particleColors: ["#F97316"],
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleBaseSize: 100,
    moveParticlesOnHover: true,
    alphaParticles: false,
    disableRotation: false,
  });
}

// Initialize SpotlightCard hover effect on topic cards
initAllSpotlights('.custom-spotlight-card', {
  spotlightColor: 'rgba(0, 229, 255, 0.2)',
  radius: 280
});

// Initialize DecryptedText on Hero Headline & Intro (runs strictly once per page load)
const heroTitle = document.querySelector('.hero h1');
if (heroTitle) {
  initDecryptedText(heroTitle, {
    text: "Hey, I’m Neel\nUpadhyay.",
    speed: 35,
    maxIterations: 18,
    animateOn: 'view',
    revealDirection: 'start',
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~"
  });
}

const heroIntro = document.querySelector('.hero .intro');
if (heroIntro) {
  initDecryptedText(heroIntro, {
    text: "I’m the person behind dexorto — building through code, Linux, open source, and community.",
    speed: 25,
    maxIterations: 15,
    animateOn: 'view',
    revealDirection: 'start',
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  });
}

document.getElementById('current-year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((item, index) => {
  item.style.transitionDelay = `${index * 100}ms`;
  observer.observe(item);
});


// Rate Limiter: 10 messages per 480 seconds
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 480 * 1000; // 480 seconds in ms
const RATE_LIMIT_KEY = "contact_form_rate_limit";

function checkClientRateLimit() {
  const now = Date.now();
  let submissions = [];
  try {
    submissions = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || "[]");
  } catch {
    submissions = [];
  }
  submissions = submissions.filter((t) => typeof t === "number" && now - t < RATE_LIMIT_WINDOW);
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
  } catch {}

  if (submissions.length >= RATE_LIMIT_MAX) {
    const oldest = submissions[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 1000);
    return { limited: true, retryAfter };
  }
  return { limited: false, submissions };
}

function recordClientSubmission(submissions) {
  try {
    submissions.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
  } catch {}
}

// Replace with your deployed Cloudflare Worker URL.
const CONTACT_ENDPOINT = "https://dexorto-contact.dexorto-website.workers.dev/contact";
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rateCheck = checkClientRateLimit();
    if (rateCheck.limited) {
      formStatus.textContent = `Rate limit reached: max 10 messages per 480s. Please wait ${rateCheck.retryAfter}s.`;
      return;
    }

    const button = contactForm.querySelector("button");
    button.disabled = true;
    formStatus.textContent = "Sending…";
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          formStatus.textContent = data.error || `Rate limit reached. Please wait before sending again.`;
          return;
        }
        throw new Error(data.error || "Submission failed");
      }
      recordClientSubmission(rateCheck.submissions);
      contactForm.reset();
      formStatus.textContent = "Message sent — thank you!";
    } catch (err) {
      formStatus.textContent = err.message || "Could not send your message. Please try again later.";
    } finally {
      button.disabled = false;
    }
  });
}
