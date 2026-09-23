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

// Locked to your specific Discord channel ID
const TARGET_CHANNEL_ID = '1552081097800548412';

// A queue to hold moderation commands waiting for Roblox to pick them up
let commandQueue = [];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Restrict commands to ONLY your specified Discord channel
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!kick') {
        const targetInput = args[1];
        if (!targetInput) {
            return message.reply("Please provide a Roblox User ID or Username! Usage: `!kick <UserId/Username> [Reason]`");
        }
        const reason = args.slice(2).join(' ') || "You have been kicked by a Discord moderator.";

        commandQueue.push({ action: 'kick', target: targetInput, reason: reason });
        message.reply(`✅ Queued kick for \`${targetInput}\` | Reason: *${reason}*`);
    }

    if (command === '!ban') {
        const targetInput = args[1];
        if (!targetInput) {
            return message.reply("Please provide a Roblox User ID or Username! Usage: `!ban <UserId/Username> [Reason]`");
        }
        const reason = args.slice(2).join(' ') || "Banned by a Discord moderator.";

        commandQueue.push({ action: 'ban', target: targetInput, reason: reason });
        message.reply(`🚨 Queued official ban for \`${targetInput}\` | Reason: *${reason}*`);
    }

    if (command === '!unban') {
        const targetInput = args[1];
        if (!targetInput) {
            return message.reply("Please provide a Roblox User ID or Username to unban! Usage: `!unban <UserId/Username>`");
        }

        commandQueue.push({ action: 'unban', target: targetInput });
        message.reply(`🔄 Queued unban command for \`${targetInput}\``);
    }

    if (command === '!status') {
        const targetInput = args[1];
        if (!targetInput) {
            return message.reply("Please provide a Roblox User ID or Username! Usage: `!status <UserId/Username>`");
        }

        commandQueue.push({ action: 'status', target: targetInput });
        message.reply(`🔍 Checking status for \`${targetInput}\`...`);
    }
});

// --- 2. SETUP EXPRESS WEB SERVER ---
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('RendR Services Backend is active and running!');
});

app.get('/get-commands', (req, res) => {
    const pendingCommands = [...commandQueue];
    commandQueue = []; 
    res.status(200).json({ commands: pendingCommands });
});

app.post('/roblox-message', async (req, res) => {
    const data = req.body;
    console.log("Received data from Roblox:", data);

    try {
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (channel) {
            if (data.type === 'statusReport') {
                await channel.send(`📊 **[Status Report]**: ${data.message}`);
            } else {
                await channel.send(`🎮 **[Roblox Game]**: ${data.message} (Players online: ${data.playerCount})`);
            }
        }
    } catch (error) {
        console.error("Failed to send message to Discord channel:", error);
    }

    res.status(200).json({ success: true, status: "Message received!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
