const loader = document.querySelector(".loader");
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const sections = [...document.querySelectorAll("main section[id]")];
const form = document.querySelector(".registration-form");
const formStatus = document.querySelector("[data-form-status]");
const contactForm = document.querySelector(".contact-form");
const contactStatus = document.querySelector("[data-contact-status]");
const authButtons = [...document.querySelectorAll("[data-auth-action]")];
const authStatus = document.querySelector("[data-auth-status]");
const authValue = document.querySelector("[data-auth-value]");
const registrationFields = document.querySelector("[data-registration-fields]");
const committeeSelect = document.querySelector("[data-committee-select]");
const otherCommittee = document.querySelector("[data-other-committee]");
const otherCommitteeInput = otherCommittee?.querySelector("input");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalCopy = document.querySelector("[data-modal-copy]");
const modalKicker = document.querySelector("[data-modal-kicker]");
const modalRegister = document.querySelector("[data-modal-register]");
let currentAuthStatus = "Not signed in";

const committeeDetails = {
  UNSC: {
    kicker: "Security Council",
    title: "UN Security Council",
    copy:
      "A fast-moving committee for experienced delegates handling cyber escalation, territorial security, sanctions, and urgent crisis directives."
  },
  UNHRC: {
    kicker: "Human Rights",
    title: "UN Human Rights Council",
    copy:
      "A research-heavy committee focused on civil liberties, displacement, technology, humanitarian access, and state accountability."
  },
  AIPPM: {
    kicker: "Indian Politics",
    title: "All India Political Parties Meet",
    copy:
      "A domestic policy forum where delegates balance party ideology, coalition strategy, media pressure, and national interest."
  },
  IPC: {
    kicker: "Press Corps",
    title: "International Press Corps",
    copy:
      "A creative media desk for journalists, photographers, and editors producing interviews, newsletters, live coverage, and press questions."
  }
};

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("is-hidden"), 450);
});

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

navToggle?.addEventListener("click", () => {
  nav?.classList.toggle("is-open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => nav?.classList.remove("is-open"));
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -52% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

authButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentAuthStatus = "Google signed in demo";
    registrationFields.disabled = false;
    authStatus.textContent = "Google sign in demo active. You can now complete registration.";
    authValue.value = currentAuthStatus;
    formStatus.textContent = "Form unlocked. Add your delegate details below.";
  });
});

committeeSelect?.addEventListener("change", () => {
  const isOther = committeeSelect.value === "Other";
  otherCommittee.hidden = !isOther;
  otherCommitteeInput.required = isOther;
  if (!isOther) otherCommitteeInput.value = "";
});

document.querySelectorAll(".committee-card").forEach((card) => {
  const open = () => {
    const key = card.getAttribute("data-committee");
    const details = committeeDetails[key];
    if (!details || !modal) return;

    modalKicker.textContent = details.kicker;
    modalTitle.textContent = details.title;
    modalCopy.textContent = details.copy;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modalClose?.focus();
  };

  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

const closeModal = () => {
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
};

modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

modalRegister?.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

form?.addEventListener("submit", (event) => {
  if (registrationFields?.disabled) {
    event.preventDefault();
    authStatus.textContent = "Please sign in with Google before registering.";
    return;
  }

  if (location.protocol === "file:") {
    event.preventDefault();
    formStatus.textContent = "Spot reserved demo. Deploy on Netlify to collect real submissions and files.";
    form.reset();
    authValue.value = currentAuthStatus;
    otherCommittee.hidden = true;
    otherCommitteeInput.required = false;
    return;
  }

  formStatus.textContent = "Securing your spot...";
});

contactForm?.addEventListener("submit", (event) => {
  if (location.protocol === "file:") {
    event.preventDefault();
    contactStatus.textContent = "Message ready demo. Deploy on Netlify to receive real messages.";
    contactForm.reset();
    return;
  }

  contactStatus.textContent = "Sending message...";
});
