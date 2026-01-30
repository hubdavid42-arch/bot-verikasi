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
const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const VERIFY_BUTTON_ID = "verify_button_v1";

client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);

  // Ambil channel verify
  const channel = await client.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.log("❌ VERIFY_CHANNEL_ID salah / channel tidak ketemu");
    return;
  }

  // Kirim panel verifikasi otomatis
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
  console.log("✅ Panel verify terkirim ke channel verifikasi");
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;

    const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
    if (!role) {
      return interaction.reply({ content: "❌ VERIFY_ROLE_ID salah / role tidak ketemu.", ephemeral: true });
    }

    // cek bot permission
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

    // kasih role
    if (interaction.member.roles.cache.has(VERIFY_ROLE_ID)) {
      return interaction.reply({ content: "✅ Kamu sudah verified.", ephemeral: true });
    }

    await interaction.member.roles.add(VERIFY_ROLE_ID, "User verified via button");

    // DM setelah verified (kalau gagal, gak apa-apa)
    try {
      await interaction.user.send("🎉 Kamu berhasil Verified! Sekarang semua channel sudah terbuka.");
    } catch {}

    return interaction.reply({ content: "✅ Verified! Channel sudah kebuka.", ephemeral: true });
  } catch (err) {
    console.log(err);
  }
});

client.login(TOKEN);
