/**
 * Live deploy: agar HTML static host (Netlify/Vercel) par hai aur Node API alag URL par hai,
 * yahan apna backend base URL set karo (trailing slash mat lagao).
 * Example: window.__API_BASE__ = "https://your-app.onrender.com";
 * Same server se serve ho raha ho to khali string rehne do.
 */
window.__API_BASE__ = window.__API_BASE__ || "";
