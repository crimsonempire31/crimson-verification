const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

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

Welcome to **Crimson Empire**.
`);
    } catch {
      console.log("Could not DM verified user.");
    }

    const logChannelId = process.env.VERIFICATION_LOG_CHANNEL_ID;
    if (!logChannelId) return true;

    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) return true;

    const robloxId = robloxUser?.sub || "Unknown";
    const robloxUsername = robloxUser?.name || "Unknown";
    const robloxDisplay = robloxUser?.preferred_username || robloxUsername;
    const discordDisplay = member.displayName || member.user.globalName || member.user.username;

    const avatarUrl = robloxUser?.sub
      ? `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxUser.sub}&width=420&height=420&format=png`
      : null;

    const robloxProfileUrl = robloxUser?.sub
      ? `https://www.roblox.com/users/${robloxUser.sub}/profile`
      : null;

    const verifiedTime = Math.floor(Date.now() / 1000);

    const verificationEmbed = new EmbedBuilder()
      .setColor(0xb30000)
      .setTitle("New Verification")
      .setDescription("A member has successfully completed website verification.")
      .setThumbnail(avatarUrl)
      .addFields(
        {
          name: "Discord User",
          value: `<@${member.id}>`,
          inline: true
        },
        {
          name: "Discord Display",
          value: `\`${discordDisplay}\``,
          inline: true
        },
        {
          name: "Roblox Username",
          value: `\`${robloxUsername}\``,
          inline: true
        },
        {
          name: "Roblox Display",
          value: `\`${robloxDisplay}\``,
          inline: true
        },
        {
          name: "Discord ID",
          value: `\`${member.id}\``,
          inline: true
        },
        {
          name: "Roblox ID",
          value: `\`${robloxId}\``,
          inline: true
        },
        {
          name: "Status",
          value: "✅ Verified",
          inline: false
        }
      );

    const miscEmbed = new EmbedBuilder()
      .setColor(0x5a0000)
      .setTitle("Misc")
      .addFields(
        {
          name: "Verification Time",
          value: `<t:${verifiedTime}:F>`,
          inline: true
        },
        {
          name: "Relative",
          value: `<t:${verifiedTime}:R>`,
          inline: true
        }
      )
      .setFooter({
        text: "Crimson Empire • Verification Logs"
      })
      .setTimestamp();

    const components = [];

    if (robloxProfileUrl) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("View Roblox Profile")
          .setStyle(ButtonStyle.Link)
          .setURL(robloxProfileUrl)
      );

      components.push(row);
    }

    await logChannel.send({
      embeds: [verificationEmbed, miscEmbed],
      components
    });

    return true;
  } finally {
    await client.destroy();
  }
}

module.exports = { verifyUser };