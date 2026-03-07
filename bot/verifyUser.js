const { Client, GatewayIntentBits } = require("discord.js");

async function verifyUser(discordUserId) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  await client.login(process.env.BOT_TOKEN);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const member = await guild.members.fetch(discordUserId);

  const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
  const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID;

  if (unverifiedRoleId) {
    await member.roles.remove(unverifiedRoleId).catch(() => {});
  }

  if (verifiedRoleId) {
    await member.roles.add(verifiedRoleId);
  }

  try {
    await member.send(`
✅ You have been successfully verified!

Your Roblox account has been linked and your server roles have been assigned.

Welcome to **Crimson Empire** — enjoy your stay.
— **Crimson Empire Team**
`);
  } catch (err) {
    console.log("Could not DM verified user");
  }

  await client.destroy();
}

module.exports = { verifyUser };