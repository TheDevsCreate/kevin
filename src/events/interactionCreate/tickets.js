const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");

const ticketCategories = {
  partnership: "1429481179475611648",
  general: "1429481302150746182",
  verifieddeveloper: "1429481355619733656",
};

module.exports = async (interaction, client) => {
  // Handle ticket select menu interactions
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticketSelectMenu"
  ) {
    const selected = interaction.values[0];

    // Category IDs for different ticket types

    if (selected === "partnership") {
      const modal = new ModalBuilder()
        .setCustomId("partnershipModal")
        .setTitle("Partnership Application");

      const projectNameInput = new TextInputBuilder()
        .setCustomId("projectName")
        .setLabel("What is your project/server name?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const memberCountInput = new TextInputBuilder()
        .setCustomId("memberCount")
        .setLabel("How many members do you have?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Describe your project/server")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(projectNameInput);
      const row2 = new ActionRowBuilder().addComponents(memberCountInput);
      const row3 = new ActionRowBuilder().addComponents(descriptionInput);

      modal.addComponents(row1, row2, row3);
      await interaction.showModal(modal);

      // Reset the select menu
      const newSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticketSelectMenu")
        .setPlaceholder("Select a ticket type...")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: "Partnerships",
            description: "Apply to become a Partner!",
            value: "partnership",
            emoji: "<:Partners:1429244550479745134>",
          },
          {
            label: "General Support",
            description: "Get normal support from our staff.",
            value: "general",
            emoji: "<:User:1429244551700283483>",
          },
          {
            label: "Verified Developer",
            description: "Apply for Verified Developer!",
            value: "verifieddeveloper",
            emoji: "<:Code:1429244549263396954>",
          },
        ]);

      const row = new ActionRowBuilder().addComponents(newSelectMenu);
      await interaction.message.edit({ components: [row] });
    } else if (selected === "verifieddeveloper") {
      const modal = new ModalBuilder()
        .setCustomId("verifiedDeveloperModal")
        .setTitle("Verified Developer Application");

      const githubInput = new TextInputBuilder()
        .setCustomId("github")
        .setLabel("What's your GitHub / Website?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const experienceInput = new TextInputBuilder()
        .setCustomId("experience")
        .setLabel("How long have you been developing?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reasonInput = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Why do you want to be a verified developer?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(githubInput);
      const row2 = new ActionRowBuilder().addComponents(experienceInput);
      const row3 = new ActionRowBuilder().addComponents(reasonInput);

      modal.addComponents(row1, row2, row3);
      await interaction.showModal(modal);

      // Reset the select menu
      const newSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticketSelectMenu")
        .setPlaceholder("Select a ticket type...")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: "Partnerships",
            description: "Apply to become a Partner!",
            value: "partnership",
            emoji: "<:Partners:1429244550479745134>",
          },
          {
            label: "General Support",
            description: "Get normal support from our staff.",
            value: "general",
            emoji: "<:User:1429244551700283483>",
          },
          {
            label: "Verified Developer",
            description: "Apply for Verified Developer!",
            value: "verifieddeveloper",
            emoji: "<:Code:1429244549263396954>",
          },
        ]);

      const row = new ActionRowBuilder().addComponents(newSelectMenu);
      await interaction.message.edit({ components: [row] });
    } else {
      const ticketChannel = await createTicketChannel(
        interaction,
        selected,
        ticketCategories[selected],
      );

      if (ticketChannel) {
        // Reply with ephemeral message
        await interaction.reply({
          content: `Your ticket has been created: ${ticketChannel}`,
          flags: [MessageFlags.Ephemeral],
        });

        // Reset the select menu
        const newSelectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticketSelectMenu")
          .setPlaceholder("Select a ticket type...")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: "Partnerships",
              description: "Apply to become a Partner!",
              value: "partnership",
              emoji: "<:Partners:1429244550479745134>",
            },
            {
              label: "General Support",
              description: "Get normal support from our staff.",
              value: "general",
              emoji: "<:User:1429244551700283483>",
            },
            {
              label: "Verified Developer",
              description: "Apply for Verified Developer!",
              value: "verifieddeveloper",
              emoji: "<:Code:1429244549263396954>",
            },
          ]);

        const row = new ActionRowBuilder().addComponents(newSelectMenu);
        await interaction.message.edit({ components: [row] });
      }
    }
  }

  // Handle partnership modal submission
  if (
    interaction.isModalSubmit() &&
    interaction.customId === "partnershipModal"
  ) {
    const projectName = interaction.fields.getTextInputValue("projectName");
    const memberCount = interaction.fields.getTextInputValue("memberCount");
    const description = interaction.fields.getTextInputValue("description");

    const ticketChannel = await createTicketChannel(
      interaction,
      "partnership",
      ticketCategories.partnership,
      { projectName, memberCount, description },
    );

    if (ticketChannel) {
      await interaction.reply({
        content: `Your partnership ticket has been created: ${ticketChannel}`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  }

  // Handle verified developer modal submission
  if (
    interaction.isModalSubmit() &&
    interaction.customId === "verifiedDeveloperModal"
  ) {
    const github = interaction.fields.getTextInputValue("github");
    const experience = interaction.fields.getTextInputValue("experience");
    const reason = interaction.fields.getTextInputValue("reason");

    const ticketChannel = await createTicketChannel(
      interaction,
      "verifieddeveloper",
      ticketCategories.verifieddeveloper,
      { github, experience, reason },
    );

    if (ticketChannel) {
      await interaction.reply({
        content: `Your verified developer ticket has been created: ${ticketChannel}`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  }

  // Handle close ticket button
  if (interaction.isButton() && interaction.customId === "closeTicket") {
    const channel = interaction.channel;

    // Create confirmation buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId("confirmClose")
      .setLabel("Confirm")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancelClose")
      .setLabel("Cancel")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton,
    );

    await interaction.reply({
      content: "**Are you sure you want to close this ticket?**",
      components: [row],
      flags: [MessageFlags.Ephemeral],
    });
  }

  // Handle confirmation buttons
  if (
    interaction.isButton() &&
    (interaction.customId === "confirmClose" ||
      interaction.customId === "cancelClose")
  ) {
    if (interaction.customId === "confirmClose") {
      await interaction.reply({
        content: `🔒 Closing ticket...`,
        flags: [MessageFlags.Ephemeral],
      });

      const channel = interaction.channel;

      try {
        const transcript = await discordTranscripts.createTranscript(channel, {
          limit: -1, // Get all messages
          fileName: `${channel.name}-transcript.html`,
          poweredBy: false,
        });

        // Get the logs channel
        const logsChannel = await interaction.guild.channels.fetch(
          "1429153062529925303",
        );

        // Create log embed
        const logEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("Ticket Closed")
          .setDescription(
            `
                        **Ticket:** ${channel.name}
                        **Closed by:** ${interaction.user.tag}
                        **Closed at:** ${new Date().toLocaleString()}
                    `,
          )
          .setTimestamp();

        // Send transcript and log
        await logsChannel.send({
          embeds: [logEmbed],
          files: [transcript],
        });

        // Delete the channel after everything is logged
        setTimeout(async () => {
          await channel.delete();
        }, 2000);
      } catch (error) {
        console.error("Error handling ticket closure:", error);
        await interaction.editReply({
          content:
            "❌ There was an error closing the ticket. Please try again.",
          flags: [MessageFlags.Ephemeral],
        });
      }
    } else {
      // If cancelled, just delete the confirmation message
      await interaction.update({
        content: "✅ Ticket close cancelled.",
        components: [],
        flags: [MessageFlags.Ephemeral],
      });
    }
  }
};

// Helper function to create ticket channels
async function createTicketChannel(
  interaction,
  type,
  categoryId,
  modalData = null,
) {
  try {
    const ticketTypes = {
      partnership: "ticket",
      general: "ticket",
      verifieddeveloper: "ticket",
    };

    const channel = await interaction.guild.channels.create({
      name: `${ticketTypes[type]}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          type: 0, // Role type
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          type: 1, // Member type
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: "1429156020403306637",
          type: 0, // Role type
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: "1429156019707183185",
          type: 0, // Role type
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    // Create initial ticket message
    const displayNames = {
      partnership: "Partnership",
      general: "General",
      verifieddeveloper: "Verified Developer",
    };

    const displayType =
      displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`${displayType} Ticket`)
      .setDescription(
        `**Welcome ${interaction.user}!**\nA staff member will be with you shortly.`,
      )
      .setTimestamp();

    // Add modal data to embed if it exists (works for partnership and verified developer)
    if (modalData) {
      const fieldLabels = {
        projectName: "Project Name",
        memberCount: "Member Count",
        description: "Description",
        github: "GitHub / Website",
        experience: "How long developing",
        reason: "Why Verified Developer?",
      };

      const fields = [];
      for (const key of Object.keys(modalData)) {
        if (!modalData[key]) continue;
        const label = fieldLabels[key] || key;
        let value = String(modalData[key]);
        if (value.length > 1024) value = value.slice(0, 1021) + "...";
        fields.push({ name: label, value });
      }

      if (fields.length) embed.addFields(fields);
    }

    const closeButton = new ButtonBuilder()
      .setCustomId("closeTicket")
      .setLabel("Close")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({ embeds: [embed], components: [row] });
    return channel;
  } catch (error) {
    console.error("Error creating ticket:", error);
    await interaction.reply({
      content:
        "There was an error creating your ticket. Please try again later.",
      flags: [MessageFlags.Ephemeral],
    });
    return null;
  }
}
