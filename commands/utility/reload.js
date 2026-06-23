const { SlashCommandBuilder } = require("discord.js");
const { guildId } = require("../../config.json");

module.exports = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reloads a command")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload")
        .setRequired(true),
    ),

  async execute(interaction) {
    if (interaction.guildId !== guildId) {
      return interaction.reply({
        content: "Ta komenda jest dostępna tylko na tym serwerze Discord.",
        ephemeral: true,
      });
    }

    const commandName = interaction.options
      .getString("command", true)
      .toLowerCase();
    const command = interaction.client.commands.get(commandName);

    if (!command) {
      return interaction.reply(
        `There is no command with name \`${commandName}\`!`,
      );
    }

    const commandPath = require.resolve(`./${command.data.name}.js`);
    delete require.cache[commandPath];

    try {
      const newCommand = require(commandPath);
      interaction.client.commands.set(newCommand.data.name, newCommand);
      await interaction.reply(
        `Command \`${newCommand.data.name}\` was reloaded!`,
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};
