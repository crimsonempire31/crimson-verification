const client = require("./bot");

async function verifyUser(discordId) {

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const member = await guild.members.fetch(discordId).catch(() => null);
  if (!member) return;

  const verifiedRole = guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
  const unverifiedRole = guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);

  if (unverifiedRole) await member.roles.remove(unverifiedRole);
  if (verifiedRole) await member.roles.add(verifiedRole);

  await member.send("✅ You are now verified! Welcome to **Crimson Empire**.");

}

module.exports = verifyUser;