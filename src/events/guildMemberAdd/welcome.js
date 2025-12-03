const { EmbedBuilder } = require("discord.js");

module.exports = async (member, client) => {
    try {
        const welcomeChannel = client.channels.cache.get("1429151779488137327");
        if (!welcomeChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`Welcome, ${member.user.displayName} to DevsCreate!`)
            .setDescription(`Welcome <@${member.user.id}> to DevsCreate!\n<:rightchevron:1429161154076344360> Check out our <#1429149555647058073>.\n<:rightchevron:1429161154076344360> Be on the **lookout** for <#1429151218088804484>!\n<:rightchevron:1429161154076344360> Make sure to say **"Hi"** in <#1429151779488137327>!`)
            .setColor("Blue")
        
        welcomeChannel.send({ embeds: [embed] })
    } catch (err) {
        console.error("Error occured welcoming: ", err)
    }
}