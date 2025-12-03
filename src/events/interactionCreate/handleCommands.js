const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (interaction, client) => {
  if (!interaction.isCommand()) return;

  const localCommands = getLocalCommands();

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Your not a developer- 💀',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.staffOnly) {
      if (!interaction.member.roles.cache.some((role) => role.name === 'Staff Team' || role.name === 'Leadership Team')) {
        interaction.reply({
          content: 'You are not a staff member- 💀',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.lsOnly) {
      if (!interaction.member.roles.cache.some((role) => role.name === 'Leadership Team')) {
        interaction.reply({
          content: 'You are not a leadership member- 💀',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === testServer)) {
        interaction.reply({
          content: 'why do you have this bot installed? 🤨',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'i aint got permissions 😭🙏',
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "the level of permissions i have is so low 😡",
            ephemeral: true,
          });
          return;
        }
      }
    }

    await commandObject.callback(client, interaction);
  } catch (error) {
    console.log(`There was an error running this command: ${error}`);
  }
};