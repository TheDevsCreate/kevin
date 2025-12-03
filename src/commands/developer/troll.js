const { ApplicationCommandOptionType } = require("discord.js");
const { createAudioResource } = require('@discordjs/voice');

module.exports = {
    name: 'troll',
    description: '😂 Just a fun troll command.',
    devOnly: true,
    options: [
        {
            name: 'troll',
            description: 'What type of troll?',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: 'Lofi Soundboard', value: 'lofi' }
            ]
        },
        {
            name: 'file',
            description: 'The sound file you want to play (only for lofi).',
            required: false,
            type: ApplicationCommandOptionType.Attachment
        }
    ],

    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        const option = interaction.options.getString('troll');
        
        if (option === 'lofi') {
            // Check if lofi player exists
            if (!client._lofiPlayer || !client._lofiConnection) {
                return interaction.editReply({
                    content: '❌ Lofi system is not currently running!',
                    ephemeral: true
                });
            }

            const file = interaction.options.getAttachment('file');
            
            if (file) {
                // Check if the file is an audio file
                if (!file.contentType?.startsWith('audio/')) {
                    return interaction.editReply({
                        content: '❌ Please provide an audio file!',
                        ephemeral: true
                    });
                }

                try {
                    // Create a resource from the uploaded file
                    const resource = createAudioResource(file.url);
                    
                    // Play the new audio
                    client._lofiPlayer.play(resource);
                    
                    await interaction.editReply({
                        content: '✅ Now playing your audio file! Will resume lofi after it finishes.',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error playing audio:', error);
                    return interaction.editReply({
                        content: '❌ Failed to play the audio file!',
                        ephemeral: true
                    });
                }
            } else {
                const status = client._lofiPlayer.state.status;
                await interaction.editReply({
                    content: `📻 Lofi Status: ${status}\nℹ️ Tip: Upload an audio file to play it!`,
                    ephemeral: true
                });
            }
        }
    }
}