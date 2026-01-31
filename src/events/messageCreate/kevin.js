const { ChannelType } = require('discord.js');
const { getKevinResponse, splitResponse, addToHistory } = require('../../utils/kevinAI');
const { executeAction, parseAction } = require('../../utils/kevinActions');

const OWNER_ID = '1144267370769174608';
const KEVIN_CHANNEL_ID = '1446668545709703239';

module.exports = async (message, client) => {
    if (message.author.bot) return;

    const isKevinMentioned = message.mentions.has(client.user);
    const isInKevinChannel = message.channelId === KEVIN_CHANNEL_ID;

    // Check if user is allowed to interact
    const isOwner = message.author.id === OWNER_ID;

    // Allow in Kevin channel for anyone, or anywhere if owner pings
    if (!isInKevinChannel && (!isKevinMentioned || !isOwner)) return;

    await message.channel.sendTyping();

    try {
        // Get the message content without the mention
        let content = message.content
            .replace(`<@${client.user.id}>`, '')
            .replace(`<@!${client.user.id}>`, '')
            .trim();

        // Check if this is an action command (only for owner when Kevin is mentioned)
        if (isKevinMentioned && isOwner) {
            const action = await parseAction(content, message);
            if (action.action !== 'unknown') {
                const actionResponse = await executeAction(message, action, client);
                if (actionResponse) {
                    try {
                        await message.reply({
                            content: actionResponse,
                            allowedMentions: { repliedUser: false }
                        });
                    } catch (replyError) {
                        if (replyError.code === 50035) {
                            await message.channel.send({
                                content: actionResponse,
                                allowedMentions: { repliedUser: false }
                            });
                        }
                    }
                    return;
                }
            }
        }

        // If replying to a message, include that context
        if (message.reference) {
            try {
                const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
                content = `[Replying to ${repliedTo.author.username}: "${repliedTo.content}"]\n\n${content}`;
            } catch (err) {
                // Message not found or deleted, just use original content
            }
        }

        // Fetch the last 5 messages in the channel for context
        const channelMessages = await message.channel.messages.fetch({ limit: 6 });
        const lastMessages = Array.from(channelMessages.values())
            .reverse()
            .filter(msg => msg.id !== message.id) // Exclude current message
            .slice(0, 5);

        // Add last 5 messages to history for this interaction
        for (const msg of lastMessages) {
            if (msg.author.id !== client.user.id && msg.author.id !== message.author.id) {
                // Add other users' messages for context
                addToHistory(message.author.id, msg.author.username, msg.content);
            }
        }

        // Add user's message to history
        addToHistory(message.author.id, message.author.username, content);

        // Get Kevin's response
        const response = await getKevinResponse(content, message.author.id);

        // Add Kevin's response to history
        addToHistory(message.author.id, 'Kevin', response);

        // Split response if it's too long
        const chunks = splitResponse(response);

        // Send each chunk as a separate message
        for (const chunk of chunks) {
            const sanitizedChunk = chunk
                .replace(/@everyone/g, '')
                .replace(/@here/g, '')
                .replace(/<@&\d+>/g, '') // Remove role mentions like <@&123456>
                .replace(/<@\d+>/g, '');

            try {
                // Try to reply to the message
                await message.reply({
                    content: sanitizedChunk,
                    allowedMentions: { repliedUser: false, roles: [] }
                });
            } catch (replyError) {
                // If reply fails (e.g., system message), send as regular message instead
                if (replyError.code === 50035) {
                    await message.channel.send({
                        content: sanitizedChunk,
                        allowedMentions: { repliedUser: false, roles: [] }
                    });
                } else {
                    throw replyError;
                }
            }
        }
    } catch (error) {
        console.error('Error in Kevin handler:', error);
        try {
            await message.reply({
                content: '❌ Kevin encountered an error processing your request.',
                allowedMentions: { repliedUser: false }
            });
        } catch (replyError) {
            // If reply fails, send as regular message instead
            if (replyError.code === 50035) {
                await message.channel.send({
                    content: '❌ Kevin encountered an error processing your request.',
                    allowedMentions: { repliedUser: false }
                });
            }
        }
    }
};
