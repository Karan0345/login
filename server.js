const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const mobileRegex = /^[0-9]{10}$/;
const pinRegex = /^[0-9]{6}$/;

app.post("/api/verification", async (req, res) => {
  const { name, bankName, problemType, pin, experienceLevel, mobile, password } = req.body;

  if (!name || !bankName || !problemType || !pin || !experienceLevel || !mobile || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({ message: "Mobile number must be 10 digits." });
  }
  if (!pinRegex.test(pin)) {
    return res.status(400).json({ message: "Security PIN must be 6 digits." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const saved = await db.users.insert({
      full_name: name.trim(),
      mobile: mobile.trim(),
      password_hash: passwordHash,
      bank_name: bankName.trim(),
      problem_type: problemType.trim(),
      security_pin: pin.trim(),
      experience_level: experienceLevel.trim()
    });

    return res.status(201).json({ message: "Verification submitted successfully.", userId: saved._id });
  } catch (error) {
    console.error("Verification failed:", error);
    if (error.errorType === "uniqueViolated") {
      return res.status(409).json({ message: "This mobile number is already verified." });
    }
    return res.status(500).json({ message: "Unable to process verification." });
  }
});

app.post("/api/login", async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: "Mobile number and password are required." });
  }
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({ message: "Mobile number must be 10 digits." });
  }

  try {
    const user = await db.users.findOne({ mobile: mobile.trim() });
    if (!user) {
      await db.loginAttempts.insert({ mobile: mobile.trim(), success: 0, attempted_at: new Date() });
      return res.status(401).json({ message: "Invalid mobile number or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await db.loginAttempts.insert({ mobile: mobile.trim(), success: 0, attempted_at: new Date() });
      return res.status(401).json({ message: "Invalid mobile number or password." });
    }

    await db.loginAttempts.insert({ mobile: mobile.trim(), success: 1, attempted_at: new Date() });
    return res.status(200).json({
      message: "Login successful.",
      user: { id: user._id, name: user.full_name, mobile: user.mobile }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

app.get("/", (_req, res) => {
  res.redirect("/login.html");
});

const server = app.listen(PORT, () => {
  console.log(`Spro Deal app running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running server or start with another port, for example: PORT=3001 npm start`
    );
    process.exit(1);
  }
  console.error("Server failed to start:", error);
  process.exit(1);
});
