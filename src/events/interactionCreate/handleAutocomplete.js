const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (interaction, client) => {
  if (!interaction.isAutocomplete()) return;

  const localCommands = getLocalCommands();

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject || !commandObject.autocomplete) return;

    await commandObject.autocomplete(interaction);
  } catch (error) {
    console.log(`There was an error with autocomplete: ${error}`);
  }
};
