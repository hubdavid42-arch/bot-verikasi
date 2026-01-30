const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;
const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;

const VERIFY_BUTTON_ID = "verify_button_v1";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Biar error ketangkep dan Railway gak bikin loop crash tanpa info
process.on("unhandledRejection", (err) => console.error("unhandledRejection:", err));
process.on("uncaughtException", (err) => console.error("uncaughtException:", err));

client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  console.log("ENV CHECK:", {
    hasTOKEN: Boolean(TOKEN),
    VERIFY_CHANNEL_ID,
    VERIFY_ROLE_ID,
  });

  if (!TOKEN || !VERIFY_CHANNEL_ID || !VERIFY_ROLE_ID) {
    console.log("❌ ERROR: Ada ENV yang kosong. Cek Railway Variables.");
    return;
  }

  // Ambil channel verify
  let channel = null;
  try {
    channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
  } catch (err) {
    console.log("❌ Gagal fetch channel verify. Cek VERIFY_CHANNEL_ID / izin bot.");
    console.log("DETAIL:", err?.message || err);
    return;
  }

  if (!channel) {
    console.log("❌ Channel verify = null. Cek VERIFY_CHANNEL_ID.");
    return;
  }

  // Coba kirim panel (anti crash)
  try {
    const embed = new EmbedBuilder()
      .setTitle("🔒 Verifikasi Dulu")
      .setDescription("Klik tombol **✅ Verify** untuk membuka semua channel.")
      .setFooter({ text: "Jika tombol tidak berfungsi, hubungi admin." });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel("✅ Verify")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    console.log("✅ Panel verify terkirim ke channel:", channel.name);
  } catch (err) {
    console.log("❌ Gagal send panel. Biasanya karena izin channel (Send Messages / Embed Links).");
    console.log("DETAIL:", err?.message || err);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;

    const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
    if (!role) {
      return interaction.reply({
        content: "❌ VERIFY_ROLE_ID salah / role tidak ketemu.",
        ephemeral: true,
      });
    }

    const me = interaction.guild.members.me;

    // permission manage roles
    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "❌ Bot tidak punya izin **Manage Roles**.",
        ephemeral: true,
      });
    }

    // role bot harus di atas role verified
    if (me.roles.highest.position <= role.position) {
      return interaction.reply({
        content: "❌ Role bot harus di atas role **Verified** (Server Settings → Roles).",
        ephemeral: true,
      });
    }

    // sudah verified?
    if (interaction.member.roles.cache.has(VERIFY_ROLE_ID)) {
      return interaction.reply({ content: "✅ Kamu sudah verified.", ephemeral: true });
    }

    await interaction.member.roles.add(VERIFY_ROLE_ID, "User verified via button");

    // DM (opsional)
    try {
      await interaction.user.send("🎉 Kamu berhasil Verified! Sekarang semua channel terbuka.");
    } catch {}

    return interaction.reply({ content: "✅ Verified! Channel sudah kebuka.", ephemeral: true });
  } catch (err) {
    console.log("❌ interaction error:", err?.message || err);
    // jangan crash
  }
});

client.login(TOKEN).catch((err) => {
  console.log("❌ Login gagal. Biasanya TOKEN salah.");
  console.log("DETAIL:", err?.message || err);
});
