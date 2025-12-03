const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const supabase = require('../../utils/supabaseClient');

const APPLICATION_CHANNEL_ID = '1434193569119473714';
const LEADERSHIP_ROLE_ID = '1429923376603856966';

// Questions structure: category -> list of questions
const applicationQuestions = {
  Introduction: [
    'Please introduce yourself (name, pronouns, short bio).',
    'If you have a resume you would like to share, now is the time to do so.',
    'What are some strengths you posses as a moderator?',
    'What are some weaknesses you posses as a moderator?',
    'How well would you say you work in groups on a scale of 1-10?',
    'How well do you respond to being given commands to follow?'
  ],
  Questions: [
    'What experience do you have leading a team or managing projects?',
    'How do you prioritize tasks when multiple deadlines overlap?',
    'From a scale of 1-10, rate your activity on Discord. ',
    'How do you ensure clear communication both within the team and the server members?',
    'How would you handle a dispute between team members?',
  ],
  Situations: [
    'Say a moderator is unrightfully kicking members. How would you properly deal with the situation?',
    'Say there\'s a raid in the server. How would you properly deal with the situation?',
    'If a team member is not fulfilling their duties, how would you address this?',
    'If you see a moderator breaking the rules, how would you handle the situation?',
  ],
  Agreements: [
    'By replying "yes," you agree to follow all rules as a member of the leadership team.'
  ]
};

module.exports = async (interaction, client) => {
  try {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    // Handle approve/deny clicks from leadership in the applications channel
    if (customId.startsWith('app_handle_')) {
      // Format: app_handle_<approve|deny>_<applicationId>
      const parts = customId.split('_');
      const handleAction = parts[2];
      const applicationId = parts.slice(3).join('_');

      // Only leadership may handle applications
      if (!interaction.member || !interaction.member.roles.cache.has(LEADERSHIP_ROLE_ID)) {
        return interaction.reply({ content: 'You do not have permission to handle applications.', ephemeral: true });
      }

      // Prevent double-handling
      const alreadyHandled = interaction.message.components?.some(r => r.components?.some(c => c.disabled));
      if (alreadyHandled) return interaction.reply({ content: 'This application has already been handled.', ephemeral: true });

      // Update DB status
      try {
        const newStatus = handleAction === 'approve' ? 'accepted' : 'denied';
        await supabase.from('applications').update({ status: newStatus, handled_by: interaction.user.id, handled_at: new Date().toISOString() }).eq('id', applicationId);
      } catch (err) {
        console.error('Error updating application status in DB:', err);
      }

      // Update embed and disable buttons
      const oldEmbed = interaction.message.embeds?.[0];
      const newEmbed = oldEmbed ? EmbedBuilder.from(oldEmbed) : new EmbedBuilder();
      newEmbed.setColor(handleAction === 'approve' ? 'Green' : 'Red');
      newEmbed.addFields({ name: 'Status', value: `${handleAction === 'approve' ? 'Approved' : 'Denied'} by ${interaction.user.tag}` });

      const disabledApprove = new ButtonBuilder()
        .setCustomId(`app_handle_approve_${applicationId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true);
      const disabledDeny = new ButtonBuilder()
        .setCustomId(`app_handle_deny_${applicationId}`)
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(disabledApprove, disabledDeny);

      await interaction.update({ embeds: [newEmbed], components: [row] });
      return;
    }

    if (!customId.startsWith('app_confirm_') && !customId.startsWith('app_cancel_')) return;

    const parts = customId.split('_');
    // customId format: app_confirm_userid_timestamp
    const action = parts[1];
    const userId = parts[2];

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'This confirmation is not for you.', ephemeral: true });
    }

    if (action === 'cancel') {
      await interaction.update({ content: 'Application cancelled.', components: [], embeds: [] });
      return;
    }

    // action === 'confirm'
    // Disable the buttons on the confirmation message
    try {
      const disabledConfirm = new ButtonBuilder()
        .setCustomId(customId)
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true);
      const disabledCancel = new ButtonBuilder()
        .setCustomId(`app_cancel_${userId}_${Date.now()}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true);
      const row = new ActionRowBuilder().addComponents(disabledConfirm, disabledCancel);
      await interaction.update({ components: [row] });
    } catch (e) {
      // ignore
    }

    // Create application record in Supabase
    let appRecord = null;
    try {
      const { data, error } = await supabase.from('applications').insert([
        {
          user_id: interaction.user.id,
          user_tag: interaction.user.tag,
          status: 'in_progress'
        }
      ]).select().single();
      if (error) {
        console.error('Supabase insert error:', error);
      } else {
        appRecord = data;
      }
    } catch (err) {
      console.error('Error creating application record:', err);
    }

    // Start asking questions via DM
    const dm = interaction.user.dmChannel || await interaction.user.createDM();

    const responses = {};

    for (const [category, questions] of Object.entries(applicationQuestions)) {
      responses[category] = [];
      for (const q of questions) {
        await dm.send({ content: `**${category}** - ${q}` });
        try {
          const collected = await dm.awaitMessages({
            filter: m => m.author.id === interaction.user.id,
            max: 1,
            time: 5 * 60 * 1000,
            errors: ['time']
          });
          const answer = collected.first().content;
          responses[category].push(answer);
        } catch (err) {
          await dm.send({ content: 'Application timed out due to inactivity. Please start again with "APPLY" if you wish to continue.' });
          // Update DB to cancelled
          if (appRecord) {
            await supabase.from('applications').update({ status: 'cancelled' }).eq('id', appRecord.id);
          }
          return;
        }
      }
    }

    // Save responses to DB
    try {
      if (appRecord) {
        await supabase.from('applications').update({ status: 'submitted', responses: responses }).eq('id', appRecord.id);
      } else {
        await supabase.from('applications').insert([
          {
            user_id: interaction.user.id,
            user_tag: interaction.user.tag,
            status: 'submitted',
            responses: responses
          }
        ]);
      }
    } catch (err) {
      console.error('Error saving application responses:', err);
    }

    // Send application to the applications channel
    try {
      const appChannel = await client.channels.fetch(APPLICATION_CHANNEL_ID).catch(() => null);
      if (appChannel) {
        const outEmbed = new EmbedBuilder()
          .setTitle('New Leadership Application')
          .setDescription(`Application from ${interaction.user.tag} (<@${interaction.user.id}>)`)
          .setColor('Blue')
          .setTimestamp();

        for (const [category, answers] of Object.entries(responses)) {
          const value = answers.map((a, i) => `**Q${i + 1}:** ${a}`).join('\n\n');
          outEmbed.addFields({ name: category, value: value || 'No answer' });
        }

        // Use application record id if available
        const appId = appRecord?.id || `${interaction.user.id}_${Date.now()}`;

        const approveBtn = new ButtonBuilder()
          .setCustomId(`app_handle_approve_${appId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success);

        const denyBtn = new ButtonBuilder()
          .setCustomId(`app_handle_deny_${appId}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger);

        const comps = new ActionRowBuilder().addComponents(approveBtn, denyBtn);

        await appChannel.send({ content: '<@&1429923376603856966>', embeds: [outEmbed], components: [comps] });
      }
    } catch (err) {
      console.error('Error posting application to channel:', err);
    }

    await dm.send({ content: 'Thank you — your application has been submitted. The leadership team will review it and get back to you.' });

  } catch (err) {
    console.error('Error in applications interaction handler:', err);
    try { await interaction.reply({ content: 'There was an error processing your application.', ephemeral: true }); } catch (e) {}
  }
};
