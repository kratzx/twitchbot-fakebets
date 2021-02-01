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
// Pot of points
let pointPot = {
    _pointsA: 0,
    _numBetsA:0,
    _pointsB: 0,
    _numBetsB:0,
    _potOpen: true,

    getPoints(){
        return `Fighter A: ${this._pointsA} -- Fighter B: ${this._pointsB}`;
    },
    endFight(winner){
        if (this._potOpen) {
            let reward = this._pointsA + this._pointsB;
            if (winner === 'A')
                reward /= this._numBetsA; 
            
            if (winner === 'B')
                reward /= this._numBetsB; 
            
            this._pointsA = 0;
            this._numBetsA = 0;
            this._pointsB = 0;
            this._numBetsB = 0;
            this._potOpen = false;
            
            return reward;
        };
    },
    makeBet(fighter, points){
        if (this._potOpen){
            if (fighter === 'A'){
                this._pointsA += points;
                this._numBetsA++;
            };
            if (fighter === 'B'){
                this._pointsB += points;
                this._numBetsB++;
            };
        };
    },
    togglePot(status){
        if (status === 'open')
            this._potOpen = true;
        if (status === 'close')
            this._potOpen = false;
    }
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
            this._points = this._points + points;
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
            let commandName = message.trim();
            let fighter = '';
            let points = 0;
            let stringPoints = '';
            if (commandName.includes('!bet')) {
                fighter = commandName[5];
                stringPoints = commandName.slice(7);
                points = parseInt(stringPoints);
                commandName = '!bet';
            }
            const userName = userstate["display-name"];
            const userType = userstate["user-type"];
            if (userType === "mod" || userType === "admin" || userName === channelName){
                modCommands(channel, userName, commandName, fighter);    
            }else {
                commonCommands(channel,userName, commandName, fighter, points);
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

// Mod user commands
function modCommands(channel, user, command, fighter) {
    switch (command){
        case '!kill':
        // Command to close the bot in the server
            killBot(channel, user);
            break;
        case '!openbet':
        // Here mods open bets
            pointPot.togglePot('open');
            client.say(channelName, 'Bets are OPEN! Please make your bets ;)');
            break;
        case '!closebet':
        // Here mods close bets
            pointPot.togglePot('close');
            client.say(channelName, 'Bets are CLOSED! Best of luck to all :D');
            break;
        case '!winner':
        // Mod notifies the bot that the left fighter won the fight
            pointPot.endFight(fighter);

            break;
        case '!endtourney':
        // Here mods can reset points for a new tornament
        // Announce winner
            break;
    }; 
};

// Common user commands
function commonCommands(channel, user, command, fighter, points) {
    // Boolean flag, true if user was indexed in playerBase
    const playerIndex = playerBase.findIndex(player => player._playerName === user)
    const joinedFlag = (playerIndex !== -1);
    let lastBet = 0;
    switch (command) {
        case '!join':
        // User joins the game
            if (!joinedFlag)
                playerBase.push(newPlayer(user));
                console.log(playerBase);
            break;
        case '!bet':
        // Player bets on fighter
            if (joinedFlag) {
                lastBet = playerBase[playerIndex].getLastBet();
                if (lastBet === 0){
                    // falta lockear si esta cerradas las apuestas
                    playerBase[playerIndex].losePoints(points);
                    playerBase[playerIndex].setFighter(fighter);
                    pointPot.makeBet(fighter, points);
                    console.log(playerBase);
                }
            }
            break;
        case '!unbet':
        // Player can remove their bet
            if (joinedFlag) {
                console.log(lastBet);
                lastBet = playerBase[playerIndex].getLastBet();
                if (lastBet > 0) {
                    playerBase[playerIndex].addPoints(lastBet);
                    playerBase[playerIndex].clearLastBet();
                    // falta remover del pot
                }   
                console.log(playerBase);                 
            }
            break;
        case '!checkPoints':
            // implement code for user to check how many points left
            if (joinedFlag){
                const pointsLeft = playerBase[playerIndex].getPoints();                
                client.say(channel, `@${playerBase[playerIndex]._playerName} you have: ${pointsLeft} points`);
                console.log(playerBase);
            }
            break;
        case '!checkPot':
            client.say(channel, pointPot.getPoints());
            console.log(playerBase);
            break;
    };
};
// falta hacer to lowercase() todos los comandos