require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const axios = require("axios");
const { verifyUser } = require("../bot/verifyUser");

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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crimson Empire Verification</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Poppins, sans-serif;
      background: linear-gradient(135deg,#1a0000,#050505);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }

    .card {
      width: min(760px, 100%);
      background: rgba(20,0,0,0.85);
      border: 1px solid rgba(255,0,0,0.2);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45);
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 2.2rem;
    }

    p {
      opacity: .85;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .user-box {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 18px;
      margin: 20px 0;
    }

    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 14px 22px;
      border-radius: 12px;
      background: linear-gradient(135deg,#ff1e1e,#a80000);
      color: white;
      text-decoration: none;
      font-weight: 700;
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

    <div class="user-box">
      <p><strong>Discord Username:</strong> ${user.username}</p>
      <p><strong>Display Name:</strong> ${user.global_name || "Not set"}</p>
      <p><strong>Discord ID:</strong> ${user.id}</p>
    </div>

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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Roblox Verification</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Poppins, sans-serif;
      background: linear-gradient(135deg,#1a0000,#050505);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }

    .card {
      width: min(760px, 100%);
      background: rgba(20,0,0,.85);
      border: 1px solid rgba(255,0,0,.2);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45);
    }

    h1 {
      margin: 0 0 14px 0;
      font-size: 2.2rem;
    }

    p {
      opacity: .85;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 14px 22px;
      border-radius: 12px;
      background: linear-gradient(135deg,#ff1e1e,#a80000);
      color: white;
      text-decoration: none;
      font-weight: 700;
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

    <a class="btn" href="/auth/roblox">Continue with Roblox</a>
  </div>
</body>
</html>
  `);
});

app.get("/auth/roblox", requireAuth, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    redirect_uri: process.env.ROBLOX_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile"
  });

  res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
});

app.get("/auth/roblox/callback", requireAuth, async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing Roblox authorization code.");
  }

  try {
    const tokenResponse = await axios.post(
      "https://apis.roblox.com/oauth/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.ROBLOX_REDIRECT_URI,
        client_id: process.env.ROBLOX_CLIENT_ID,
        client_secret: process.env.ROBLOX_CLIENT_SECRET
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userInfoResponse = await axios.get(
      "https://apis.roblox.com/oauth/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const robloxUser = userInfoResponse.data;
    req.session.robloxUser = robloxUser;

    await verifyUser(req.session.discordUser.id);

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Complete</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
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

    .btn {
      display: inline-block;
      padding: 14px 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff1e1e, #a80000);
      color: white;
      text-decoration: none;
      font-weight: 700;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>Verification Complete</h1>
    <p>Your Discord account has been linked with Roblox successfully.</p>
    <p><strong>Roblox Username:</strong> ${robloxUser.name || "Unknown"}</p>
    <p><strong>Roblox User ID:</strong> ${robloxUser.sub || "Unknown"}</p>
    <p>Your verified role has now been assigned in the Discord server.</p>
    <a class="btn" href="/">Return Home</a>
  </main>
</body>
</html>
    `);
  } catch (error) {
    console.error("Roblox OAuth error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Failed</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
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

    .badge {
      display: inline-block;
      margin-bottom: 14px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 80, 80, 0.25);
      background: rgba(255, 0, 0, 0.08);
      color: #ffd3d3;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    h1 {
      font-size: 2.2rem;
      margin: 0 0 12px 0;
    }

    p {
      color: #d0bcbc;
      line-height: 1.8;
      margin-bottom: 16px;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
    }

    .btn {
      display: inline-block;
      padding: 14px 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff1e1e, #a80000);
      color: white;
      text-decoration: none;
      font-weight: 700;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="badge">Verification Error</div>
    <h1>Roblox verification failed</h1>
    <p>
      We couldn't complete your Roblox account linking. This can happen if the authorization expired,
      the session timed out, or Roblox rejected the request.
    </p>
    <p>
      Please go back and try again. If the issue continues, open a verification ticket in the server
      and staff will assist you.
    </p>

    <div class="actions">
      <a class="btn" href="/roblox">Try Again</a>
      <a class="btn btn-secondary" href="/">Return Home</a>
    </div>
  </main>
</body>
</html>
    `);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});