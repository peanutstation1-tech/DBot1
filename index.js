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

// A queue to hold moderation commands waiting for Roblox to pick them up
let commandQueue = [];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`); });  // Function to analyze message history in a specific channel async function analyzeChannelHistory(channelId) {     try {         const channel = await client.channels.fetch(channelId);         if (!channel.isTextBased()) return;          const messages = await channel.messages.fetch({ limit: 10 });         const now = Date.now();          messages.forEach(msg => {             const ageInSeconds = Math.floor((now - msg.createdTimestamp) / 1000);             console.log(`[User: ${msg.author.tag}] said: "${msg.content}" -- Sent ${ageInSeconds} seconds ago`);
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!checkhistory') {
        await analyzeChannelHistory(message.channel.id);
        message.reply("Checked channel history! Check your bot console.");
    }

    if (command === '!kick') {
        const userId = args[1];
        if (!userId) {
            return message.reply("Please provide a Roblox User ID! Usage: `!kick <UserId> [Reason]`");
        }
        // Join remaining arguments as the custom reason, or use a default
        const reason = args.slice(2).join(' ') || "You have been kicked by a Discord moderator.";

        commandQueue.push({ action: 'kick', userId: userId, reason: reason });
        message.reply(`✅ Queued kick for User ID \`${userId}\` | Reason: *${reason}*`);
    }

    if (command === '!ban') {
        const userId = args[1];
        if (!userId) {
            return message.reply("Please provide a Roblox User ID! Usage: `!ban <UserId> [Reason]`");
        }
        const reason = args.slice(2).join(' ') || "Banned by a Discord moderator.";

        commandQueue.push({ action: 'ban', userId: userId, reason: reason });
        message.reply(`🚨 Queued official ban for User ID \`${userId}\` | Reason: *${reason}*`);
    }

    if (command === '!unban') {
        const userId = args[1];
        if (!userId) {
            return message.reply("Please provide a Roblox User ID to unban! Usage: `!unban <UserId>`");
        }

        commandQueue.push({ action: 'unban', userId: userId });
        message.reply(`🔄 Queued unban command for Roblox User ID: \`${userId}\``);
    }
});

// --- 2. SETUP EXPRESS WEB SERVER ---
const app = express();
app.use(express.json());

// A test route to check if Render is online
app.get('/', (req, res) => {
    res.send('RendR Services Backend is active and running!');
});

// Endpoint for Roblox to fetch pending moderation commands
app.get('/get-commands', (req, res) => {
    const pendingCommands = [...commandQueue];
    commandQueue = []; // Clear queue so commands only run once
    res.status(200).json({ commands: pendingCommands });
});

// The endpoint your Roblox game pings when events happen (like player joins)
app.post('/roblox-message', async (req, res) => {
    const data = req.body;
    console.log("Received data from Roblox:", data);

    try {
        // REPLACE WITH YOUR ACTUAL DISCORD CHANNEL ID
        const channel = await client.channels.fetch('YOUR_DISCORD_CHANNEL_ID');
        if (channel) {
            await channel.send(`🎮 **[Roblox Game]**: ${data.message} (Players online: ${data.playerCount})`);
        }
    } catch (error) {
        console.error("Failed to send message to Discord channel:", error);
    }

    res.status(200).json({ success: true, status: "Message received and posted to Discord!" });
});

// --- 3. START SERVER & LOGIN ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
