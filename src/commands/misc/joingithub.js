const { ApplicationCommandOptionType, MessageFlags } = require("discord.js");
const { Octokit } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GithubPAT,
});

module.exports = {
  name: "joingithub",
  description: "📝 Join our Github Organization!",
  options: [
    {
      name: "username",
      description: "🏷️ Your GitHub username!",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],

  callback: async (client, interaction) => {
    const ghUsername = interaction.options.getString("username");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    try {
      const { data: user } = await octokit.rest.users.getByUsername({
        username: ghUsername,
      });
      const ghUserId = user.id;

      const res = await octokit.request("POST /orgs/{org}/invitations", {
        org: "TheDevsCreate",
        invitee_id: ghUserId,
        role: "direct_member",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (res.status === 201) {
        return interaction.editReply(
          `**📨 Invitation sent!** Check for an email from GitHub to join our organization.`,
        );
      }

      console.warn(`⚠️ GitHub Organization: ${ghUserId} - ${res.status}`);
      return interaction.editReply(
        `⚠️ Unexpected response from GitHub. Please report this to the admins!`,
      );
    } catch (e) {
      console.error(e);
      console.warn(
        `⚠️ GitHub Organization: ${ghUserId} - ${res.status}\n404 - GitHub Token Missing\n422 - Email invalid/unable to be invited\n401 - Invalid/expired GitHub Token`,
      );
      return interaction.editReply(
        `⚠️ Unexpected response from GitHub. Please report this to the admins!`,
      );
    }
  },
};
