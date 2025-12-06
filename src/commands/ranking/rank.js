const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: 'rank',
    description: '📈 Updates the rank of a staff member.',
    lsOnly: true,
    options: [
        {
            name: 'update-type',
            description: 'Select an update you want to do.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: '🔼 Promote a user', value: 'promote' },
                { name: '🔽 Demote a user',  value: 'demote'  }
            ]
        },
        {
            name: 'user',
            description: 'The user you want to update their rank.',
            required: true,
            type: ApplicationCommandOptionType.Mentionable
        },
        {
            name: 'reason',
            description: 'The reason why you want to update their rank.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],

    callback: async (client, interaction) => {
        const member = interaction.member;
        const targetUser = interaction.options.getMentionable('user');
        const reason = interaction.options.getString('reason');

        const updateType = interaction.options.getString('update-type');

        const mainServer = client.guilds.cache.get('1394385267703545936');
        const staffServer = client.guilds.cache.get('1429560483723218976');

        const staffHierarchy = [
            {
                name: 'Owner',
                roleIds: {staff: '1429923266528673792', main:'1429153660964962395'}
            },
            {
                name: 'Management',
                roleIds: {staff: '1429923267161886770', main:'1429153661417685163'}
            },
            {
                name: 'Administrator',
                roleIds: {staff: '1429923267594031177', main:'1429153661916938271'}
            },
            {
                name: 'Moderator',
                roleIds: {staff: '1429923267967189154', main:'1429153662693015603'}
            },
            {
                name: 'Trial Moderator',
                roleIds: {staff: '1429923329028133045', main:'1429153663271567391'}
            }
        ]

        const checkMarkEmoji = '<:approved:1435594525245706290>';
        const deniedEmoji = '<:denied:1435594488751063180>';
        const roleLogsChannel = '1435974606497382542'
        const logsChannel = staffServer.channels.cache.get(roleLogsChannel);

        await interaction.deferReply({ ephemeral: true });

        if (!targetUser) {
            return interaction.editReply({ content: 'Please specify a user to update their rank.', ephemeral: true });
        }

        const staffMember = staffServer.members.cache.get(targetUser.id);
        const mainMember = mainServer.members.cache.get(targetUser.id);

        const currentIndex = staffHierarchy.findIndex(rank => 
            staffMember.roles.cache.has(rank.roleIds.staff)
        );

        if (updateType === 'promote') {
            if (currentIndex === 0) {
                return interaction.editReply({ content: 'This user is already at the highest rank!', ephemeral: true });
            }

            const nextRank = staffHierarchy[currentIndex - 1];
            const currentRank = staffHierarchy[currentIndex];

            if (staffMember) {
                await staffMember.roles.remove(currentRank.roleIds.staff);
                await staffMember.roles.add(nextRank.roleIds.staff);
            }
            if (mainMember) {
                await mainMember.roles.remove(currentRank.roleIds.main);
                await mainMember.roles.add(nextRank.roleIds.main);
            }

            await interaction.editReply({
                content: `Successfully promoted ${targetUser} from ${currentRank.name} to ${nextRank.name} across all servers!`,
                ephemeral: true
            });

            await logsChannel.send(`# ${checkMarkEmoji} Promotion\n**User**: <@${targetUser.id}>\n**New Rank**: ${nextRank.name}\n**Old Rank**: ${currentRank.name}\n**Reason**: ${reason}`);

        } else if (updateType === 'demote') {
            if (currentIndex === staffHierarchy.length - 1) {
                return interaction.editReply({ content: 'This user is already at the lowest rank!', ephemeral: true });
            }

            const previousRank = staffHierarchy[currentIndex + 1];
            const currentRank = staffHierarchy[currentIndex];

            if (staffMember) {
                await staffMember.roles.remove(currentRank.roleIds.staff);
                await staffMember.roles.add(previousRank.roleIds.staff);
            }
            if (mainMember) {
                await mainMember.roles.remove(currentRank.roleIds.main);
                await mainMember.roles.add(previousRank.roleIds.main);
            }

            await interaction.editReply({
                content: `Successfully demoted ${targetUser} from ${currentRank.name} to ${previousRank.name} across all servers!`,
                ephemeral: true
            });
            await logsChannel.send(`# ${deniedEmoji} Demotion\n**User**: <@${targetUser.id}>\n**New Rank**: ${previousRank.name}\n**Old Rank**: ${currentRank.name}\n**Reason**: ${reason}`);
            
        }

    },
}
