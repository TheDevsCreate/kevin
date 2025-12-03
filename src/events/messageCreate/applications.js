const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType } = require('discord.js');
const APPLICATION_CHANNEL_ID = '1434193569119473714';

module.exports = async (message, client) => {
  try {
    if (!message || !message.author) return;
    if (message.author.bot) return;

    // Only respond to direct messages (not in a guild)
    if (message.guild) return;
    if (message.content.trim().toLowerCase() !== 'apply') return;

    // Send confirmation embed with buttons
    const embed = new EmbedBuilder()
      .setTitle('Apply for Leadership')
      .setDescription('Are you sure you want to start a Leadership application? Click Confirm to begin.')
      .setColor('Blue');

    const timestamp = Date.now();
    const confirmId = `app_confirm_${message.author.id}_${timestamp}`;
    const cancelId = `app_cancel_${message.author.id}_${timestamp}`;

    const confirmButton = new ButtonBuilder()
      .setCustomId(confirmId)
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId(cancelId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    // Try to send via the DM channel; fall back to author.send
    try {
      await message.channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
      // if sending on the channel fails, try sending directly to the user
      await message.author.send({ embeds: [embed], components: [row] }).catch(() => null);
    }
  } catch (err) {
    console.error('Error in applications DM handler:', err);
  }
};
