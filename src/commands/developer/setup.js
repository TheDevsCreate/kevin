const { StringSelectMenuOptionBuilder, MessageFlags, ButtonStyle } = require("discord.js");
const { StringSelectMenuBuilder } = require("discord.js");
const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: 'setup',
    description: 'DEV ONLY! Setup a certain feature.',
    devOnly: true,
    options: [
        {
            name: 'feature',
            description: 'Select a feature to setup.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: '🎫 Tickets', value: 'tickets' },
            ]
        }
    ],
    callback: async (client, interaction) => {

        const member = interaction.member;
        const guild = interaction.guild;
        const option = interaction.options.getString('feature');

        if (option === 'tickets') {
            
            const ticketsEmbed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("🎫 DevsCreate Support")
                .setDescription("**Welcome to the DevsCreate support area!**\nPlease select a ticket type so we can assist you further.")

            const ticketTypes = [
                {
                    label: 'Partnerships',
                    description: 'Apply to become a Partner!',
                    value: 'partnership',
                    emoji: '<:Partners:1429244550479745134>'
                },
                {
                    label: 'General Support',
                    description: 'Get normal support from our staff.',
                    value: 'general',
                    emoji: '<:User:1429244551700283483>'
                },
                {
                    label: 'Verified Developer',
                    description: 'Apply for Verified Developer!',
                    value: 'verifieddeveloper',
                    emoji: '<:Code:1429244549263396954>'
                }
            ]
            
            const actionRow = new ActionRowBuilder().addComponents(ticketTypes.map((tt) => 
                new ButtonBuilder()
                    .setLabel(tt.label)
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`createTicket_${tt.value}`)
                    .setEmoji(tt.emoji)
            ))

            const targetChannel = await guild.channels.fetch("1429152050867994907")
            await targetChannel.send({ embeds: [ticketsEmbed], components: [actionRow] })
            await interaction.reply({ content: '`🔨` The **ticket embed** has successfully been setup!', flags: [MessageFlags.Ephemeral] })

        }

    },
}