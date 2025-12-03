const { 
    ApplicationCommandOptionType,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

const SUGGEST_CHANNEL_ID = '1430993976600694795';

const LEADERSHIP_ROLE_ID = '1429156020403306637';

module.exports = {
    name: 'suggest',
    description: 'Suggest something new to add to DevsCreate!',
    options: [
        {
            name: 'suggestion',
            description: 'The thing you want to suggest',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],

    callback: async (client, interaction) => {
        const guild = interaction.guild;
        const suggestion = interaction.options.getString('suggestion');
        
        const suggestChannel = await guild.channels.fetch(SUGGEST_CHANNEL_ID).catch(() => null);
        if (!suggestChannel) {
            return interaction.reply({ content: 'Could not find the suggestions channel. Please contact an administrator.', ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('New Suggestion')
            .setDescription(suggestion)
            .addFields(
                { name: 'Author', value: `${interaction.user.tag} (<@${interaction.user.id}>)` }
            )
            .setColor('Blue')
            .setTimestamp();
        
        const suggestId = interaction.id; 
        
        const approveButton = new ButtonBuilder()
            .setCustomId(`suggest_approve_${suggestId}`)
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const denyButton = new ButtonBuilder()
            .setCustomId(`suggest_deny_${suggestId}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(approveButton, denyButton);

        
        await suggestChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Your suggestion has been submitted!', ephemeral: true });
    }
}