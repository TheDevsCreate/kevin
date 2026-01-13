const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');
const path = require('path');

async function lofiStartup(client) {
    const guildId = '1394385267703545936';
    const channelId = '1429152268883857468';

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return console.warn('Guild not found');

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== 2) return console.warn('Voice channel not found');

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    // This function creates a FRESH resource every time it is called
    const playSong = () => {
        try {
            const resourcePath = path.join(__dirname, '../../assets/Lofi.mp3');
            const resource = createAudioResource(resourcePath);
            player.play(resource);
        } catch (error) {
            console.error('❌ Failed to create/play audio resource:', error);
        }
    };

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('✅ Lofi bot connected to VC');
        playSong(); // Start playing when connected
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.warn('⚠️ Lofi bot disconnected from VC');
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('🛑 Lofi stream ended, replaying...');
        // We call playSong() again, which generates a NEW resource
        setTimeout(() => {
            playSong();
        }, 1000); 
    });

    player.on('error', (error) => {
        console.error('❌ Audio player error:', error);
        // If the player errors, wait 5 seconds and try to restart
        setTimeout(() => playSong(), 5000);
    });

    client._lofiPlayer = player;
    client._lofiConnection = connection;
}

module.exports = async (client) => {
    try {
        await lofiStartup(client);
    } catch (err) {
        console.error('Critical error in lofiStartup:', err);
    }
};