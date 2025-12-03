module.exports = async (message, client) => {
	try {
		if (!message?.channel || message.author?.bot || message.channel.isThread()) return;
		if (message.channel.id !== '1429151397877649520') return;

		const now = new Date();
		const threadName = `OTD - ${now.toLocaleDateString('en-US')}`;

		const thread = await message.startThread({
			name: threadName,
			autoArchiveDuration: 1440,
			reason: 'Create OTD thread',
		});

		await thread.send("<:Sparkles:1429520603689390100> Send your answers **here**!");
	} catch (err) {
		console.error('Error creating OTD thread:', err);
	}
};
