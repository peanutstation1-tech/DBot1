const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
]);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Example function to analyze message history in a specific channel
async function analyzeChannelHistory(channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel.isTextBased()) return;

        // Fetch the last 10 messages
        const messages = await channel.messages.fetch({ limit: 10 });
        
        const now = Date.now();

        messages.forEach(msg => {
            // Calculate how long ago the message was sent (in seconds)
            const ageInSeconds = Math.floor((now - msg.createdTimestamp) / 1000);
            
            console.log(`[User: ${msg.author.tag}] said: "${msg.content}" -- Sent ${ageInSeconds} seconds ago`);

            // You can add your custom evaluation logic here:
            // e.g., if (msg.content.includes("bug") && ageInSeconds < 60) { ... }
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

// Trigger your function when needed (or wire it up to an Express endpoint that Roblox pings)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!checkhistory') {
        await analyzeChannelHistory(message.channel.id);
        message.reply("Checked channel history! Check your bot console.");
    }
});

client.login('YOUR_DISCORD_BOT_TOKEN');
