const tmi = require('tmi.js');
require('dotenv').config();

const botUsername = process.env.BOT_USERNAME;
const botPassword = process.env.OAUTH_TOKEN;
const channelName = process.env.CHANNEL_NAME;

if (!botUsername){
    console.log(botUsername);
    console.log("ERROR: Missing bot username!");
    return 0;
}
if (!botPassword){
    console.log("ERROR: Missing bot password!");
    return 0;
}
if (!channelName){
    console.log("ERROR: Missing channel name to connect to!");
    return 0;
}

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
        username: botUsername,
        password: botPassword
    },
    channels: [ '#' + channelName ]
};
// Create a client with our options
const client = new tmi.Client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// All players will be archived here
let playerBase = [];

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
            // This is a chat message..
            const commandName = message.trim();
            const userName = userstate["display-name"];
            const userType = userstate["user-type"];
            //console.log ("message: " + commandName);
            if (userType === "mod" || userType === "admin" || userName === channelName){
                modCommands(channel, userName, commandName);    
            }else {
                commonCommands(userName, commandName);
            }
            break;
        case "whisper":
            // This is a whisper..
            break;
        default:
            // Something else ?
            break;
    };
};

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
};

// Kill and disconnect the bot
function killBot (channelName, displayName) {
    client.say(channelName, `The user ${displayName} has killed me :(`);
    client.disconnect();
    return "bot killed";
};

// Returns each player an object for them to play
const newPlayer = (userName) => {
    return {
        _playerName: userName,
        _points: 5000,
        _lastBet: 0,
        _choosenFighter: '',

        getPoints (){
            return this._points;
        },
        getLastBet (){
            return this._lastBet;
        },
        addPoints (points){
            this._points += points;
        },
        losePoints (points){
            this._points -= points;
            this._lastBet = points;
        },
        clearLastBet(){
            this._lastBet = 0;
            this._choosenFighter = '';
        },
        setFighter(choise){
            this._choosenFighter = choise;
        }
    };    
};

// Mod user commands
function modCommands(channel, user, command, fighter) {
    switch (command){
        case '!kill':
        // Command to close the bot in the server
            killBot(channel, user);
            break;
        case '!openbet':
        // Here mods open bets
            break;
        case '!winner':
        // Mod notifies the bot that the left fighter won the fight
            break;
        case '!resetpoints':
        // Here mods can reset points for a new tornament
            break;
    }; 
};

// Common user commands
function commonCommands(user, command, fighter, points) {
    // Boolean flag, true if user was indexed in playerBase
    const joinedFlag = (playerBase._playerName.findIndex(user) !== -1);
    switch (command) {
        case '!join':
        // User joins the game
            if (!joinedFlag)
                playerBase.push(newPlayer(user));
            break;
        case '!bet':
        // Player bets on fighter
            if (joinedFlag) {
                const playerIndex = playerBase._playerName.findIndex(user);
                playerBase[playerIndex].losePoints(points);
                playerBase[playerIndex].setFighter(fighter);
                // need to somehow add points to pot for fighter
            }
            break;
        case '!unbet':
        // Player can remove their bet
            if (joinedFlag) {
                const playerIndex = playerBase._playerName.findIndex(user);
                const lastBet = playerBase[playerIndex].getLastBet();
                if (lastBet > 0) {
                    playerBase[playerIndex].addPoints(lastBet);
                    playerBase[playerIndex].clearLastBet();
                }                    
            }
            break;
    };
};