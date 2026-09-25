const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// --- 1. SETUP EXPRESS WEB SERVER FIRST ---
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RendR Services Backend</title>
            <style>
                body {
                    background-color: #121214;
                    color: #e4e4e7;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .card {
                    background-color: #18181b;
                    border: 1px solid #27272a;
                    padding: 2.5rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
                    text-align: center;
                    max-width: 450px;
                    width: 100%;
                }
                h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #f43f5e;
                }
                p {
                    color: #a1a1aa;
                    font-size: 0.95rem;
                    margin-top: 0;
                }
                .status-badge {
                    display: inline-block;
                    background-color: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 0.35rem 0.85rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin-top: 1rem;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>RendR Services</h1>
                <p>Backend & Discord-Roblox Bridge</p>
                <div class="status-badge">● Active & Running</div>
            </div>
        </body>
        </html>
    `);
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
                await channel.send(`🎮 **[Roblox Game]**: ${data.message} (Players online:${data.playerCount})`);
            }
        }
    } catch (error) {
        console.error("Failed to send message to Discord channel:", error);
    }

    res.status(200).json({ success: true, status: "Message received!" });
});

// --- 2. SETUP DISCORD BOT ---
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
        message.reply(`✔ Queued kick for \`${targetInput}\` | Reason: *${reason}*`);
    }

    if (command === '!privconnect') {
        const targetInput = args[1];
        if (!targetInput) {
            return message.reply("Please provide a Roblox User ID or Username! Usage: `!privconnect <UserId/Username>`");
        }
        
        commandQueue.push({ action: 'privconnect', target: targetInput });
        message.reply(`✔ Queued private server connection for \`${targetInput}\`...`);
    }
    if (command === 'Hi RendR') {
        return message.reply('Hi!')
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
        message.reply(`🔍 Checking status for \`${targetInput}\``);
    }
});

// --- 3. START LISTENERS ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
