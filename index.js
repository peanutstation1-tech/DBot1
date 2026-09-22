const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// --- 1. SETUP DISCORD BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Function to analyze message history in a specific channel
async function analyzeChannelHistory(channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel.isTextBased()) return;

        // Fetch the last 10 messages
        const messages = await channel.messages.fetch({ limit: 10 });
        const now = Date.now();

        messages.forEach(msg => {
            const ageInSeconds = Math.floor((now - msg.createdTimestamp) / 1000);
            console.log(`[User: ${msg.author.tag}] said: "${msg.content}" -- Sent ${ageInSeconds} seconds ago`);
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!checkhistory') {
        await analyzeChannelHistory(message.channel.id);
        message.reply("Checked channel history! Check your bot console.");
    }
});

// --- 2. SETUP EXPRESS WEB SERVER FOR ROBLOX ---
const app = express();
app.use(express.json()); // Allows the server to read JSON data sent from Roblox

// A test route so you can visit your Render URL in a browser
app.get('/', (req, res) => {
    res.send('RendR Services Backend is active and running!');
});

// The endpoint your Roblox game will ping
app.post('/roblox-message', async (req, res) => {
    const data = req.body;
    
    // Print what Roblox sent to your Render console
    console.log("Received data from Roblox:", data);

    try {
        // REPLACE 'YOUR_DISCORD_CHANNEL_ID' with your actual channel ID numbers
        const channel = await client.channels.fetch('YOUR_DISCORD_CHANNEL_ID');
        if (channel) {
            await channel.send(`🎮 **[Roblox Game]**: ${data.message} (Players online: ${data.playerCount})`);
        }
    } catch (error) {
        console.error("Failed to send message to Discord channel:", error);
    }

    res.status(200).json({ success: true, status: "Message received and posted to Discord!" });
});

// Render assigns a dynamic port via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
});

// --- 3. LOGIN TO DISCORD ---
client.login(process.env.DISCORD_TOKEN);
