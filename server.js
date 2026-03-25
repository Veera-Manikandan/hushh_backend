const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const db = require("./firebase");

const app = express();
const verifyToken = require("./middleware/authMiddleware");
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));


const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET_KEY = process.env.SECRET_KEY || "fallback_secret";

app.use(cors({ origin: "*" }));

app.use(cors({
  origin: [
    "http://localhost:5500",
    "hushh-frontend-9fj8hn8ua-veeramanikandans-projects-3e2a7372.vercel.app"
  ]
}));

// REGISTER API
app.post("/register", async (req, res) => {
  try {
    const { username, name, email, password, sendEmail } = req.body;

    // Validation
    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 🔍 Check username exists
    const usernameCheck = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!usernameCheck.empty) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 🔍 Check email exists
    const emailCheck = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!emailCheck.empty) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 💾 Save user
    const newUser = await db.collection("users").add({
      username,
      name,
      email,
      password: hashedPassword,
      sendEmail,
      createdAt: new Date(),
    });

    // 🎟️ Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: email,
        username: username,
        
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

     if (sendEmail) {
      try {
        await axios.post("https://hook.eu1.make.com/chlukqnipgltn5tu8pfnqz8iqkujqf9o", {
          username,
          name,
          email
        });
      } catch (err) {
        console.log("Webhook error:", err.message);
        // Don't break registration if email fails
      }
    }
    // ✅ Response
    res.json({
      message: "User Registered Successfully",
      token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving data" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 🔍 find user in Firestore
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "User not found" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // 🔐 compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 🎟️ generate JWT token
    const token = jwt.sign(
      {
        id: userDoc.id,
        email: user.email,
        username: user.username,
       
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    try {
      await axios.post("https://hook.eu1.make.com/5k9k8vnocq7hg6x0mawdf9ooos43v5mx", {
        email: user.email,
        username: user.username,
        time: new Date(),
        action: "login"
      });
    } catch (err) {
      console.log("Login webhook error:", err.message);
    }
    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login error" });
  }
});

app.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: "Welcome!",
    user: req.user,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

