const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

const STAFF_ROLE_ID = '1429156019707183185';

module.exports = {
    name: 'add',
    description: 'Add a user to the current ticket',
    options: [
        {
            name: 'user',
            description: 'The user to add to the ticket',
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    staffOnly: true,

    callback: async (client, interaction) => {
        try {

            // Check if we're in a ticket channel
            const channel = interaction.channel;
            if (!channel.name.toLowerCase().startsWith('ticket-')) {
                return interaction.reply({
                    content: 'This command can only be used in ticket channels.',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('user');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return interaction.reply({
                    content: 'Unable to find that user in the server.',
                    ephemeral: true
                });
            }

            // Check if user already has access
            if (channel.permissionsFor(targetMember).has(PermissionFlagsBits.ViewChannel)) {
                return interaction.reply({
                    content: `${targetUser.tag} already has access to this ticket.`,
                    ephemeral: true
                });
            }

            // Add user to the ticket channel
            await channel.permissionOverwrites.edit(targetMember, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            // Notify success
            await interaction.reply({
                content: `✅ Added ${targetUser.tag} to the ticket.`
            });

            // Send a log message in the channel
            await channel.send({
                content: `${targetUser} was added to the ticket by ${interaction.user}.`
            });

        } catch (error) {
            console.error('Error in add command:', error);
            await interaction.reply({
                content: 'There was an error trying to add the user to the ticket.',
                ephemeral: true
            });
        }
    }
};
