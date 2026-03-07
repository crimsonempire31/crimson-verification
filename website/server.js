require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const axios = require("axios");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, "../public")));

function requireAuth(req, res, next) {
  if (!req.session.discordUser) {
    return res.redirect("/verify.html");
  }
  next();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/auth/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing Discord authorization code.");
  }

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    req.session.discordUser = {
      id: userResponse.data.id,
      username: userResponse.data.username,
      global_name: userResponse.data.global_name,
      avatar: userResponse.data.avatar
    };

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Discord OAuth error:", error.response?.data || error.message);
    res.status(500).send("Discord login failed.");
  }
});

app.get("/dashboard", requireAuth, (req, res) => {
  const user = req.session.discordUser;
  const displayName = user.global_name || user.username;

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Crimson Empire Verification</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: Poppins;
        background: linear-gradient(135deg,#1a0000,#050505);
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        min-height:100vh;
      }

      .card{
        background:rgba(20,0,0,0.85);
        border:1px solid rgba(255,0,0,0.2);
        padding:40px;
        border-radius:20px;
        max-width:700px;
      }

      h1{
        margin-bottom:10px;
      }

      p{
        opacity:.8;
        line-height:1.7;
      }

      .btn{
        display:inline-block;
        margin-top:20px;
        padding:14px 22px;
        border-radius:12px;
        background:linear-gradient(135deg,#ff1e1e,#a80000);
        color:white;
        text-decoration:none;
        font-weight:700;
      }
    </style>
  </head>

  <body>

  <div class="card">

  <h1>Welcome, ${displayName}</h1>

  <p>
  You have successfully signed in with Discord.  
  The next step is linking your Roblox account so we can confirm your identity
  and give you access to the Crimson Empire server.
  </p>

  <p>
  For your security, Crimson Empire never asks for your password directly.
  You will be redirected to the official Roblox login system.
  </p>

  <a class="btn" href="/roblox">Continue to Roblox Verification</a>

  </div>

  </body>
  </html>
  `);
});

app.get("/roblox", requireAuth, (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Roblox Verification</title>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

<style>

body{
font-family:Poppins;
background:linear-gradient(135deg,#1a0000,#050505);
color:white;
display:flex;
align-items:center;
justify-content:center;
min-height:100vh;
}

.card{
background:rgba(20,0,0,.85);
border:1px solid rgba(255,0,0,.2);
padding:40px;
border-radius:20px;
max-width:700px;
}

.btn{
display:inline-block;
margin-top:20px;
padding:14px 22px;
border-radius:12px;
background:linear-gradient(135deg,#ff1e1e,#a80000);
color:white;
text-decoration:none;
font-weight:700;
}

</style>
</head>

<body>

<div class="card">

<h1>Roblox Account Linking</h1>

<p>
To complete verification, you must link your Roblox account.
You will be redirected to Roblox to confirm ownership.
</p>

<p>
After linking your account, you will automatically receive
your verified role in the Discord server.
</p>

<a class="btn" href="#">Continue with Roblox</a>

</div>

</body>
</html>
`);
});

app.get("/roblox-link", requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Roblox Verification</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: "Poppins", sans-serif;
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255, 0, 0, 0.14), transparent 30%),
            radial-gradient(circle at bottom right, rgba(120, 0, 0, 0.18), transparent 30%),
            linear-gradient(135deg, #1a0000, #050505);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
        }
        .card {
          width: min(760px, 100%);
          background: rgba(20, 0, 0, 0.82);
          border: 1px solid rgba(255, 0, 0, 0.18);
          border-radius: 24px;
          padding: 36px 28px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.45);
        }
        h1 {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }
        p {
          color: #d0bcbc;
          line-height: 1.8;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <main class="card">
        <h1>Roblox Verification</h1>
        <p>Discord login works. Next ima build the Roblox linking system here. sybau...</p>
      </main>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});