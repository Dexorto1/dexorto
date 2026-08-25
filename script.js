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


// Replace with your deployed Cloudflare Worker URL.
const CONTACT_ENDPOINT = "https://dexorto-contact.dexorto-website.workers.dev/contact";
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  button.disabled = true; formStatus.textContent = "Sending…";
  try {
    const response = await fetch(CONTACT_ENDPOINT, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(new FormData(contactForm))) });
    if (!response.ok) throw new Error();
    contactForm.reset(); formStatus.textContent = "Message sent — thank you!";
  } catch { formStatus.textContent = "Could not send your message. Please try again later."; }
  finally { button.disabled = false; }
});
