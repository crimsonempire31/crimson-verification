require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`Bot online as ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {

  try {

    const role = member.guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);
    if (role) await member.roles.add(role);

    await member.send(`
👋 Welcome to **Crimson Empire**!

To gain full access to the server, you must complete **Roblox account verification**.

🔐 Verification is done through our official website:
http://localhost:3000

📌 After successfully completing verification:
• return to the server
• you will automatically receive your roles and full access

If you encounter any issues or have questions, feel free to contact a staff member and we will assist you.

Enjoy your stay and welcome to **Crimson Empire**.
— **Crimson Empire Team**
`);

  } catch (err) {

    console.log("User has DMs closed");

  }

});

client.login(process.env.BOT_TOKEN);

module.exports = client;