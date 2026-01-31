const { PermissionFlagsBits } = require('discord.js');
const { OpenAI } = require('openai');
const { EmbedBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

const openai = new OpenAI({
    apiKey: process.env.OpenAI_Key
});

const OWNER_ID = '1144267370769174608';

/**
 * Extract user mentions from message
 * @param {Message} message - Discord message
 * @returns {Array} - Array of user objects with id and username
 */
function extractMentions(message) {
    const mentions = [];
    
    // Get mentioned users from message.mentions
    message.mentions.users.forEach(user => {
        if (user.id !== message.client.user.id) { // Exclude Kevin
            mentions.push({
                id: user.id,
                username: user.username,
                tag: user.tag
            });
        }
    });

    return mentions;
}

/**
 * Find closest matching role in guild
 * @param {Guild} guild - Discord guild
 * @param {string} searchTerm - Role name to search for
 * @returns {Role|null} - Matching role or null
 */
function findClosestRole(guild, searchTerm) {
    if (!searchTerm) return null;
    
    const search = searchTerm.toLowerCase().trim();
    const roles = Array.from(guild.roles.cache.values());

    // First try exact match
    let found = roles.find(r => r.name.toLowerCase() === search);
    if (found) return found;

    // Then try partial match
    found = roles.find(r => r.name.toLowerCase().includes(search));
    if (found) return found;

    // Try fuzzy matching - check if search is contained or vice versa
    found = roles.find(r => search.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(search));
    if (found) return found;

    return null;
}

/**
 * Parse message content for action using AI
 * @param {string} content - Message content without Kevin mention
 * @param {Message} message - Discord message for context
 * @returns {Promise<Object>} - { action: string, details: string }
 */
async function parseAction(content, message) {
    try {
        const parsePrompt = `You are a Discord bot command parser. Analyze the user's message and determine what action they want to perform.

Available actions:
1. "giveRole" - User wants to give a role to someone (e.g., "give X the partner role", "make Y a moderator")
2. "addToTicket" - User wants to add someone to a ticket (e.g., "add X to this ticket", "put Y in the ticket")
3. "closeTicket" - User wants to close the current ticket (e.g., "close this ticket", "close the ticket")
4. "unknown" - No clear action detected

The message may contain user mentions in the format <@USER_ID>. If it does, extract those.

Respond ONLY with a JSON object (no markdown, no extra text):
{
  "action": "giveRole" | "addToTicket" | "closeTicket" | "unknown",
  "targetUserId": "extracted user ID from mention or null",
  "targetUserName": "extracted username if mentioned, or null",
  "roleName": "if giveRole action, the role name they want to give, otherwise null"
}

Message to analyze: "${content}"`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: parsePrompt
                }
            ],
            max_completion_tokens: 200,
        });

        const responseText = response.choices[0]?.message?.content || '';
        
        // Parse the JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { action: 'unknown' };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate the response
        if (!['giveRole', 'addToTicket', 'closeTicket', 'unknown'].includes(parsed.action)) {
            return { action: 'unknown' };
        }

        return parsed;
    } catch (error) {
        console.error('Error parsing action with AI:', error);
        return { action: 'unknown' };
    }
}

/**
 * Execute a Kevin action
 * @param {Message} message - Discord message
 * @param {Object} action - Parsed action object
 * @param {Client} client - Discord client
 * @returns {Promise<string>} - Response message
 */
async function executeAction(message, action, client) {
    // Only allow owner to use action commands
    if (message.author.id !== OWNER_ID) {
        return '❌ only my owner can command me like that bro';
    }

    try {
        switch (action.action) {
            case 'giveRole':
                return await executeGiveRole(message, action);
            
            case 'addToTicket':
                return await executeAddToTicket(message, action);
            
            case 'closeTicket':
                return await executeCloseTicket(message, action);
            
            default:
                return null; // Not an action command
        }
    } catch (error) {
        console.error('Error executing Kevin action:', error);
        return `❌ something went wrong trying to do that: ${error.message}`;
    }
}

/**
 * Give a role to a user
 * @param {Message} message - Discord message
 * @param {Object} action - Action object with targetUserId/targetUserName and roleName
 * @returns {Promise<string>} - Response message
 */
async function executeGiveRole(message, action) {
    const guild = message.guild;
    const mentions = extractMentions(message);

    // Find the target user - prefer explicit ID from AI, then mentions in message
    let targetUser = null;
    
    if (action.targetUserId) {
        try {
            const member = await guild.members.fetch(action.targetUserId);
            targetUser = {
                id: member.id,
                username: member.user.username,
                tag: member.user.tag
            };
        } catch (e) {
            // ID not found, try other methods
        }
    }

    if (!targetUser && mentions.length > 0) {
        targetUser = mentions[0]; // Use first mentioned user
    }

    if (!targetUser) {
        return '❌ i couldn\'t figure out who to give the role to, bro';
    }

    // Find the role
    const role = findClosestRole(guild, action.roleName);
    if (!role) {
        return `bro i don't even know what "${action.roleName}" is lmao`;
    }

    // Get the member
    const member = await guild.members.fetch(targetUser.id);
    
    // Check if they already have the role
    if (member.roles.cache.has(role.id)) {
        return `bro ${targetUser.username} already has that role lol`;
    }

    // Give the role
    await member.roles.add(role);
    return `gotchu, i gave ${targetUser.username} the ${role.name} role`;
}

/**
 * Add a user to the current ticket
 * @param {Message} message - Discord message
 * @param {Object} action - Action object with targetUserId/targetUserName
 * @returns {Promise<string>} - Response message
 */
async function executeAddToTicket(message, action) {
    const channel = message.channel;
    const guild = message.guild;

    // Check if we're in a ticket channel
    if (!channel.name.toLowerCase().startsWith('ticket-')) {
        return `bro this isn't even a ticket channel lol`;
    }

    const mentions = extractMentions(message);

    // Find the target user - prefer explicit ID from AI, then mentions in message
    let targetUser = null;
    
    if (action.targetUserId) {
        try {
            const member = await guild.members.fetch(action.targetUserId);
            targetUser = {
                id: member.id,
                username: member.user.username,
                tag: member.user.tag
            };
        } catch (e) {
            // ID not found, try other methods
        }
    }

    if (!targetUser && mentions.length > 0) {
        targetUser = mentions[0]; // Use first mentioned user
    }

    if (!targetUser) {
        return '❌ i couldn\'t figure out who to add to the ticket, bro';
    }

    // Fetch the member
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return `can't find ${targetUser.username} in the server bro`;
    }

    // Check if they already have access
    if (channel.permissionsFor(targetMember).has(PermissionFlagsBits.ViewChannel)) {
        return `bro ${targetUser.username} is already in this ticket`;
    }

    // Add them to the ticket
    await channel.permissionOverwrites.edit(targetMember, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
    });

    // Notify
    return `aight, i added ${targetUser.username} to the ticket`;
}

/**
 * Close the current ticket
 * @param {Message} message - Discord message
 * @param {Object} action - Action object
 * @returns {Promise<string>} - Response message
 */
async function executeCloseTicket(message, action) {
    const channel = message.channel;
    const guild = message.guild;

    // Check if we're in a ticket channel
    if (!channel.name.toLowerCase().startsWith('ticket-')) {
        return `bro this isn't even a ticket channel lol`;
    }

    try {
        // Create transcript
        const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            fileName: `${channel.name}-transcript.html`,
            poweredBy: false,
        });

        // Get the logs channel
        const logsChannel = await guild.channels.fetch('1429153062529925303');

        // Create log embed
        const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Ticket Closed')
            .setDescription(
                `
**Ticket:** ${channel.name}
**Closed by:** ${message.author.tag}
**Closed at:** ${new Date().toLocaleString()}
                `
            )
            .setTimestamp();

        // Send transcript and log
        await logsChannel.send({
            embeds: [logEmbed],
            files: [transcript],
        });

        // Delete the channel after 2 seconds
        setTimeout(async () => {
            await channel.delete();
        }, 2000);

        return 'ticket closed, ez';
    } catch (error) {
        return `bro i can't close this ticket: ${error.message}`;
    }
}

module.exports = {
    executeAction,
    parseAction,
    extractMentions,
    findClosestRole
};
