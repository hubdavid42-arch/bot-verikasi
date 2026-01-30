const {
  Client,
  GatewayIntentBits,
  Routes,
  REST,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");

// ✅ Ambil dari Railway Variables
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;
const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const VERIFY_BUTTON_ID = "verify_button";


// ✅ AUTO ROLE Unverified saat member join
client.on("guildMemberAdd", async (member) => {
  const role = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);

  if (role) {
    await member.roles.add(role);
    console.log(`✅ Member baru masuk → diberi role Unverified`);
  }
});


// ✅ BOT READY
client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);

  // Register Slash Command
  const commands = [
    {
      name: "setup-verify",
      description: "Kirim tombol verify ke channel verify",
    },
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Command /setup-verify aktif!");
});


// ✅ INTERACTION HANDLER
client.on("interactionCreate", async (interaction) => {
  try {
    // ✅ Slash command setup
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup-verify") {

        // Cek admin
        if (
          !interaction.memberPermissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.reply({
            content: "❌ Kamu bukan admin!",
            ephemeral: true,
          });
        }

        const channel =
          interaction.guild.channels.cache.get(VERIFY_CHANNEL_ID);

        if (!channel)
          return interaction.reply({
            content: "❌ Channel verify tidak ditemukan!",
            ephemeral: true,
          });

        // Embed message
        const embed = new EmbedBuilder()
          .setTitle("✅ Verifikasi Server")
          .setDescription(
            "Klik tombol di bawah untuk mendapatkan akses semua channel!"
          )
          .setFooter({ text: "Bot Verify System" });

        // Button verify
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(VERIFY_BUTTON_ID)
            .setLabel("✅ Verify")
            .setStyle(ButtonStyle.Success)
        );

        // Kirim panel
        await channel.send({ embeds: [embed], components: [row] });

        return interaction.reply({
          content: "✅ Panel verifikasi berhasil dikirim!",
          ephemeral: true,
        });
      }
    }

    // ✅ Button Verify Click
    if (interaction.isButton()) {
      if (interaction.customId === VERIFY_BUTTON_ID) {
        const member = interaction.member;

        // Role Verified
        const verifiedRole =
          interaction.guild.roles.cache.get(VERIFY_ROLE_ID);

        // Role Unverified
        const unverifiedRole =
          interaction.guild.roles.cache.get(UNVERIFIED_ROLE_ID);

        // ✅ Remove Unverified
        if (unverifiedRole) {
          await member.roles.remove(unverifiedRole);
        }

        // ✅ Add Verified
        if (verifiedRole) {
          await member.roles.add(verifiedRole);
        }

        // ✅ Kirim DM ke user
        try {
          await interaction.user.send(
            "🎉 Kamu berhasil Verified! Sekarang bisa akses semua channel 😄"
          );
        } catch {
          // Kalau DM off, mention di channel verify
          const channel =
            interaction.guild.channels.cache.get(VERIFY_CHANNEL_ID);

          channel.send(
            `✅ ${member} berhasil Verified!`
          );
        }

        return interaction.reply({
          content: "✅ Kamu sudah Verified!",
          ephemeral: true,
        });
      }
    }
  } catch (err) {
    console.log("ERROR:", err);
  }
});


// ✅ LOGIN BOT
client.login(TOKEN);