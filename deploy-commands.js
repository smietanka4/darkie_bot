const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const globalCommands = [];
const guildCommands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      if (command.guildOnly) {
        guildCommands.push(command.data.toJSON());
      } else {
        globalCommands.push(command.data.toJSON());
      }
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`,
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy the commands
(async () => {
  try {
    console.log(
      `Started refreshing ${globalCommands.length + guildCommands.length} application (/) commands.`,
    );

    if (guildCommands.length > 0) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        {
          body: guildCommands,
        },
      );
      console.log(
        `Successfully reloaded ${data.length} guild-only application (/) commands.`,
      );
    }

    if (globalCommands.length > 0) {
      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: globalCommands,
      });
      console.log(
        `Successfully reloaded ${data.length} global application (/) commands.`,
      );
    }
  } catch (err) {
    // And of course, we make sure that we catch and log any errors
    console.error(err);
  }
})();
