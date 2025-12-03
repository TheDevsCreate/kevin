require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits, Partials } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const intents = Object.keys(GatewayIntentBits).map((a) => GatewayIntentBits[a]);
if (!intents.includes(GatewayIntentBits.MessageContent)) intents.push(GatewayIntentBits.MessageContent);
if (!intents.includes(GatewayIntentBits.DirectMessages)) intents.push(GatewayIntentBits.DirectMessages);

const client = new Client({
  intents,
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]
});


eventHandler(client);

client.login(process.env.DISCORD_TOKEN)