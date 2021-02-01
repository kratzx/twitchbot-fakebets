const tmi = require('tmi.js');

// Define configuration options
const opts = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: "kratzx94",
        password: "oauth:yblxfm7hffvvui8c67upwjyr2ak4y7"
    },
    channels: [ "#krathozx" ]
};
// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;

    // Handle different message types..
    switch(userstate["message-type"]) {
        case "action":
            // This is an action message..
            break;
        case "chat":
            const commandName = message.trim();
            // This is a chat message..
            if (userstate["user-type"] === "mod" || userstate["user-type"] === "admin"){
                // Mod Only Commands
                if (commandName === '!kill')
                    killBot(channel, userstate["display-name"]);             
            }
            // Common commands

            break;
        case "whisper":
            // This is a whisper..
            break;
        default:
            // Something else ?
            break;
    }
};

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}

function killBot (channelName, displayName) {
    client.say(channelName, `The user ${displayName} has killed me :(`);
    client.disconnect();
    return "bot killed";
}

const 