const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: 'root',
    description: 'DEV ONLY! Do not mess with these commands.',
    devOnly: true,
    options: [
        {
            name: 'command',
            description: 'Select an option to run.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: '❗ Shutdown Bot (not recommended)', value: 'shutdown' },
            ]
        },
        {
            name: 'user',
            description: 'The user you want to select.',
            required: false,
            type: ApplicationCommandOptionType.Mentionable
        }
    ],
  
    callback: async (client, interaction) => {

        const member = interaction.member;
        const guild = interaction.guild;
        const targetUser = interaction.options.getMentionable('user');

        const option = interaction.options.getString('command');

        if (option === 'shutdown') {
            await interaction.reply({ content: '`🔨` Bot is now shutting down.', ephemeral: true });
            await client.destroy();
            process.exit(0);

        }
    },
  };