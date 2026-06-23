const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replies with your input")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The input to echo back")
        .setRequired(true)
        .addChoices(
          { name: "Funny", value: "gif_funny" },
          { name: "Meme", value: "gif_meme" },
        ),
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel to echo into"),
    )
    .addBooleanOption((option) =>
      option
        .setName("ephemeral")
        .setDescription("Whether or not the echo should be ephemeral"),
    ),

  async execute(interaction) {
    const input = interaction.options.getString("input");
    await interaction.reply(input || "Brak tekstu do powtórzenia.");
  },
};
