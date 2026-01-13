
const { VoiceState, Client, PermissionFlagsBits, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")

/**
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 * @param {Client} client
 */


module.exports = async (oldState, newState, client) => {
    const member = newState.member;
    const guild = newState.guild;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const jtc = "1343335046169235541";
    const category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "Custom VCs".toLowerCase())

    if (oldChannel !== newChannel && newChannel && newChannel.id === jtc) {
        try {
            const vcName = `${member.user.username}'s VC`
            const voiceChannel = await guild.channels.create({
                name: vcName,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                    },
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.Connect]
                    }
                ]
            });

            await member.voice.setChannel(voiceChannel)

            const deleteButton = new ButtonBuilder()
                .setCustomId(`delete_vc_${voiceChannel.id}`)
                .setLabel('Delete VC')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder().addComponents(deleteButton);

            await voiceChannel.send({
                content: `# Hey <@${member.id}>! 👋\nWelcome to your **custom VC** 🔥\n\n# 📥 How To Invite Users\nYou simply run the </allowvc:1343344119308619816> command anywhere in the server and then select the user you'd like to invite in the VC! Btw, only the owner of the VC is allowed to invite people.\n\n# 🗑️ How To Delete the VC\njust leave the vc. its not that flipping hard.`,
                components: [row]
            })
            
        } catch (err) {
            console.error(`Error connecting voice channel: ${err}`)
        }
    }

    if (oldChannel && oldChannel.members.size === 0 && oldChannel.name.endsWith("'s VC")) {
        try {
            await oldChannel.delete();
        } catch (err) {
            console.error(`Error deleting voice channel: ${err}`)
        }
    }

  };