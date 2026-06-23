const SUPABASE_URL = "https://mptdvkewcpijuamihfqr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L13XbqR7-BCHwuXgoFPCjA_qM_quMBK";

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
const authCard = document.querySelector("[data-auth-card]");
const committeeSelect = document.querySelector("[data-committee-select]");
const otherCommittee = document.querySelector("[data-other-committee]");
const otherCommitteeInput = otherCommittee?.querySelector("input");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalCopy = document.querySelector("[data-modal-copy]");
const modalKicker = document.querySelector("[data-modal-kicker]");
const modalRegister = document.querySelector("[data-modal-register]");

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

const hideAuthCard = () => {
  if (authCard) {
    authCard.style.display = "none";
  }
};

const showAuthCard = () => {
  if (authCard) {
    authCard.style.display = "grid";
  }
};

const updateFormState = (signedIn, userEmail = "Not signed in") => {
  if (registrationFields) {
    registrationFields.disabled = !signedIn;
  }

  authStatus.textContent = signedIn
    ? `Signed in as ${userEmail}. Your registration form is unlocked.`
    : "Form locked until sign-in.";

  authValue.value = signedIn ? `Signed in as ${userEmail}` : "Not signed in";

  if (signedIn) {
    hideAuthCard();
  } else {
    showAuthCard();
  }
};

const handleSignIn = (user) => {
  if (!user) return;
  updateFormState(true, user.email || "Google user");
};

const resetAuth = () => {
  updateFormState(false);
};

const initSupabaseAuth = async () => {
  const urlHasParams =
    window.location.search.includes("access_token") ||
    window.location.search.includes("refresh_token") ||
    window.location.search.includes("provider_token") ||
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("refresh_token") ||
    window.location.hash.includes("provider_token");

  if (urlHasParams) {
    try {
      await supabaseClient.auth.getSessionFromUrl({ storeSession: true });
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.warn("Supabase auth redirect processing failed:", error);
    }
  }

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    handleSignIn(session.user);
  } else {
    resetAuth();
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      handleSignIn(session.user);
    }

    if (event === "SIGNED_OUT") {
      resetAuth();
    }
  });
};

const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href
      }
    });

    if (error) {
      throw error;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    authStatus.textContent = "Google sign-in failed. Please try again.";
    console.error(error);
  }
};

const uploadScreenshot = async (file, userId) => {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop();
  const path = `screenshots/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage.from("screenshots").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabaseClient.storage.from("screenshots").getPublicUrl(path);
  return publicUrlData.publicUrl;
};

const submitRegistration = async (event) => {
  event.preventDefault();

  if (!form) return;
  if (!registrationFields || registrationFields.disabled) {
    authStatus.textContent = "Please sign in with Google before registering.";
    return;
  }

  if (location.protocol === "file:") {
    formStatus.textContent = "Supabase requires a real site URL. Serve this page via http://localhost or deploy it live.";
    return;
  }

  formStatus.textContent = "Saving registration...";

  const formData = new FormData(form);
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const institution = formData.get("institution")?.toString().trim() || "";
  const committee = formData.get("committee")?.toString().trim() || "";
  const otherCommitteeValue = formData.get("other_committee")?.toString().trim() || "";
  const paymentPreference = formData.get("payment_preference")?.toString().trim() || "";
  const transactionId = formData.get("transaction_id")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";
  const screenshotFile = formData.get("payment_screenshot");

  const selectedCommittee = committee === "Other" ? otherCommitteeValue : committee;

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  const user = session?.user;
  if (!user) {
    authStatus.textContent = "You must be signed in to submit registration.";
    return;
  }

  try {
    const screenshotUrl =
      screenshotFile instanceof File && screenshotFile.size > 0
        ? await uploadScreenshot(screenshotFile, user.id)
        : null;

    const { data, error: insertError } = await supabaseClient.from("registrations").insert([
      {
        user_id: user.id,
        auth_email: user.email,
        name,
        email,
        institution,
        committee: selectedCommittee,
        other_committee: otherCommitteeValue,
        payment_preference: paymentPreference,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        message,
        created_at: new Date().toISOString()
      }
    ]).select();

    if (insertError) {
      throw insertError;
    }

    const registrationId = data?.[0]?.id || data?.[0]?.registration_id || "saved";
    formStatus.textContent = `Registration saved successfully! Your registration ID is ${registrationId}.`;
    form.reset();
    if (otherCommittee) {
      otherCommittee.hidden = true;
    }
  } catch (error) {
    console.error(error);
    formStatus.textContent = "Unable to save registration. Please try again later.";
  }
};

const submitContactMessage = async (event) => {
  event.preventDefault();

  if (!contactForm) return;

  if (location.protocol === "file:") {
    contactStatus.textContent = "Supabase requires a real site URL. Serve this page via http://localhost or deploy it live.";
    return;
  }

  contactStatus.textContent = "Saving message...";

  const formData = new FormData(contactForm);
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const subject = formData.get("subject")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";

  try {
    const { error } = await supabaseClient.from("contact_messages").insert([
      {
        name,
        email,
        phone,
        subject,
        message,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      throw error;
    }

    contactStatus.textContent = "Message sent successfully. We will get back to you soon.";
    contactForm.reset();
  } catch (error) {
    console.error(error);
    contactStatus.textContent = "Unable to send message. Please try again later.";
  }
};

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("is-hidden"), 450);
  initSupabaseAuth();
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
  button.addEventListener("click", signInWithGoogle);
});

committeeSelect?.addEventListener("change", () => {
  const isOther = committeeSelect.value === "Other";
  if (otherCommittee) {
    otherCommittee.hidden = !isOther;
  }
  if (otherCommitteeInput) {
    otherCommitteeInput.required = isOther;
    if (!isOther) otherCommitteeInput.value = "";
  }
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

form?.addEventListener("submit", submitRegistration);
contactForm?.addEventListener("submit", submitContactMessage);
