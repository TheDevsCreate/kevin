const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');

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

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('✅ Lofi bot connected to VC');
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.warn('⚠️ Lofi bot disconnected from VC');
    });

    const path = require('path');
    const resource = createAudioResource(path.join(__dirname, '../../assets/Lofi.mp3'));
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    client._lofiPlayer = player;
    client._lofiConnection = connection;

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('🛑 Lofi stream ended, replaying...');
        setTimeout(() => {
            player.play(resource);
        }, 100);
    });



    player.on('error', (error) => {
        console.error('❌ Audio player error:', error);
    });
}

module.exports = async (client) => {
    await lofiStartup(client);
};
