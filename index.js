const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;
const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

process.on("unhandledRejection", (e) => console.log("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.log("uncaughtException:", e));

client.once("ready", async () => {
  console.log("✅ READY:", client.user.tag);

  if (!TOKEN || !VERIFY_CHANNEL_ID || !VERIFY_ROLE_ID) {
    console.log("❌ ENV KOSONG. Cek Railway Variables.");
    return;
  }

  try {
    const ch = await client.channels.fetch(VERIFY_CHANNEL_ID);
    console.log("✅ CHANNEL:", ch?.name);

    // test text
    await ch.send("✅ TEST: bot berhasil kirim pesan.");

    // test button
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_btn")
        .setLabel("VERIFY")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ content: "Klik tombol VERIFY:", components: [row] });
    console.log("✅ BUTTON terkirim");
  } catch (err) {
    console.log("❌ GAGAL KIRIM:", err?.message || err);
  }
});

client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;
  if (i.customId !== "verify_btn") return;

  try {
    const role = i.guild.roles.cache.get(VERIFY_ROLE_ID);
    if (!role) return i.reply({ content: "❌ Role tidak ketemu.", ephemeral: true });

    await i.member.roles.add(role);
    return i.reply({ content: "✅ Verified!", ephemeral: true });
  } catch (err) {
    console.log("❌ VERIFY ERROR:", err?.message || err);
  }
});

client.login(TOKEN);
