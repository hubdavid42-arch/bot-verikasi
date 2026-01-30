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

// anti crash biar error keliatan di logs
process.on("unhandledRejection", (err) => console.error("unhandledRejection:", err));
process.on("uncaughtException", (err) => console.error("uncaughtException:", err));

client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  console.log("ENV:", {
    hasTOKEN: !!TOKEN,
    VERIFY_CHANNEL_ID,
    VERIFY_ROLE_ID,
  });

  if (!TOKEN || !VERIFY_CHANNEL_ID || !VERIFY_ROLE_ID) {
    console.log("❌ ERROR: TOKEN / VERIFY_CHANNEL_ID / VERIFY_ROLE_ID ada yang kosong di Railway Variables.");
    return;
  }

  // 1) fetch channel
  let channel;
  try {
    channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
  } catch (err) {
    console.log("❌ ERROR: Gagal fetch channel. (ID salah / bot gak punya akses)");
    console.log("DETAIL:", err?.message || err);
    return;
  }

  if (!channel) {
    console.log("❌ ERROR: channel = null. VERIFY_CHANNEL_ID kemungkinan salah.");
    return;
  }

  console.log(`✅ Channel ketemu: #${channel.name}`);

  // 2) test send (kalau ini gak muncul, berarti permission send messages/embeds)
  try {
    await channel.send("✅ TEST: Bot bisa kirim pesan di sini.");
    console.log("✅ Test message terkirim.");
  } catch (err) {
    console.log("❌ ERROR: Bot gak bisa kirim pesan ke channel (cek View Channel / Send Messages).");
    console.log("DETAIL:", err?.message || err);
    return;
  }

  // 3) send panel verify (embed + button)
  try {
    const embed = new EmbedBuilder()
      .setTitle("🔒 Verifikasi Dulu")
      .setDescription("Klik tombol **✅ Verify** untuk membuka semua channel server.")
      .setFooter({ text: "Verify System" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel("✅ Verify")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    console.log("✅ Panel verify terkirim.");
  } catch (err) {
    console.log("❌ ERROR: Gagal kirim panel (biasanya karena izin Embed Links).");
    console.log("DETAIL:", err?.message || err);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;

    const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
    if (!role) {
      return interaction.reply({ content: "❌ Role Verified tidak ketemu. Cek VERIFY_ROLE_ID.", ephemeral: true });
    }

    const me = interaction.guild.members.me;

    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "❌ Bot tidak punya izin Manage Roles.", ephemeral: true });
    }

    if (me.roles.highest.position <= role.position) {
      return interaction.reply({
        content: "❌ Role bot harus di atas role Verified (Server Settings → Roles).",
        ephemeral: true,
      });
    }

    if (interaction.member.roles.cache.has(VERIFY_ROLE_ID)) {
      return interaction.reply({ content: "✅ Kamu sudah verified.", ephemeral: true });
    }

    await interaction.member.roles.add(role, "Verified via button");

    try {
      await interaction.user.send("🎉 Kamu berhasil Verified! Sekarang semua channel terbuka.");
    } catch {}

    return interaction.reply({ content: "✅ Verified sukses!", ephemeral: true });
  } catch (err) {
    console.log("❌ interaction error:", err?.message || err);
  }
});

client.login(TOKEN).catch((err) => {
  console.log("❌ LOGIN GAGAL (TOKEN salah).");
  console.log("DETAIL:", err?.message || err);
});
