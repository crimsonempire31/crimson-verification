const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

async function verifyUser(discordUserId, robloxUser = null) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  await client.login(process.env.BOT_TOKEN);

  try {
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

    const logChannelId = process.env.VERIFICATION_LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle("New Verification")
          .setDescription("A member has completed website verification.")
          .addFields(
            {
              name: "Discord User",
              value: `<@${member.id}>`,
              inline: true
            },
            {
              name: "Discord ID",
              value: member.id,
              inline: true
            },
            {
              name: "Roblox Username",
              value: robloxUser?.name || "Unknown",
              inline: true
            },
            {
              name: "Roblox User ID",
              value: robloxUser?.sub || "Unknown",
              inline: true
            },
            {
              name: "Status",
              value: "Verified",
              inline: true
            }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(console.error);
      }
    }

    return true;
  } finally {
    await client.destroy();
  }
}

module.exports = { verifyUser };