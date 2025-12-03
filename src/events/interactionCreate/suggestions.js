const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const LEADERSHIP_ROLE_ID = '1429156020403306637';

module.exports = async (interaction, client) => {
  try {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    if (!customId.startsWith('suggest_approve_') && !customId.startsWith('suggest_deny_')) return;

    // Only leadership can click these
    const member = interaction.member;
    if (!member || !member.roles.cache.has(LEADERSHIP_ROLE_ID)) {
      return interaction.reply({ content: 'You do not have permission to perform this action. (Leadership only)', ephemeral: true });
    }

    // Prevent double handling: if components are already disabled, treat as handled
    const alreadyHandled = interaction.message.components?.some(r => r.components?.some(c => c.disabled));
    if (alreadyHandled) {
      return interaction.reply({ content: 'This suggestion has already been handled.', ephemeral: true });
    }

    const isApprove = customId.startsWith('suggest_approve_');
    const suggestionId = customId.replace(isApprove ? 'suggest_approve_' : 'suggest_deny_', '');

    // Build updated embed based on existing one
    const oldEmbed = interaction.message.embeds?.[0];
    const newEmbed = oldEmbed ? EmbedBuilder.from(oldEmbed) : new EmbedBuilder();

    newEmbed.setColor(isApprove ? 'Green' : 'Red');
    // Append status field or update title
    newEmbed.addFields({ name: 'Status', value: isApprove ? `Approved by ${interaction.user.tag}` : `Denied by ${interaction.user.tag}` });

    // Disable buttons (recreate with disabled=true)
    const approveId = `suggest_approve_${suggestionId}`;
    const denyId = `suggest_deny_${suggestionId}`;

    const approveButton = new ButtonBuilder()
      .setCustomId(approveId)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
      .setDisabled(true);

    const denyButton = new ButtonBuilder()
      .setCustomId(denyId)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(approveButton, denyButton);

    // Update the suggestion message
    await interaction.update({ embeds: [newEmbed], components: [] });

    // Try to DM the original suggester if possible
    try {
      const authorField = oldEmbed?.fields?.find(f => f.name === 'Author');
      const mention = authorField?.value;
      const match = mention?.match(/<@!?(\d+)>/);
      if (match) {
        const suggesterId = match[1];
        const guild = interaction.guild;
        const member = await guild.members.fetch(suggesterId).catch(() => null);
        if (member) {
          const dmEmbed = new EmbedBuilder()
            .setTitle(isApprove ? 'Your suggestion was approved' : 'Your suggestion was denied')
            .setDescription(oldEmbed?.description || '')
            .addFields({ name: 'Handled by', value: `${interaction.user.tag}` })
            .setColor(isApprove ? 'Green' : 'Red')
            .setTimestamp();

          await member.send({ embeds: [dmEmbed] }).catch(() => null);
        }
      }
    } catch (err) {
      // ignore DM errors
    }

  } catch (err) {
    console.error('Error handling suggestion button:', err);
    try { await interaction.reply({ content: 'There was an error processing this action.', ephemeral: true }); } catch (e) { /* ignore */ }
  }
};
