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
    _potOpen: false,
    _autoReOpen: true,

    getPoints(){
        return `Fighter A: ${this._pointsA} -- Fighter B: ${this._pointsB}`;
    },
    endFight(winner){
        if (!this._potOpen) {
            let reward = this._pointsA + this._pointsB;
            if (winner === 'a')
                reward /= this._numBetsA; 
            
            if (winner === 'b')
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
            if (fighter === 'a'){
                this._pointsA += points;
                this._numBetsA++;
            };
            if (fighter === 'b'){
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
    },
    getStatus(){
        return this._potOpen;
    },
    getReOpenStatus(){
        return this._autoReOpen;
    },
    toggleReOpen(){
        this._autoReOpen = !this._autoReOpen;
        return this._autoReOpen;
    },
    refund(fighter, points){
        if (this._potOpen){
            if (fighter === 'a'){
                this._pointsA -= points;
                this._numBetsA--;
            };
            if (fighter === 'b'){
                this._pointsB -= points;
                this._numBetsB--;
            };
        };
    }    
};
// Returns each player an object for them to play
const newPlayer = (userName) => {
    return {
        _playerName: userName,
        _points: 5000,
        _lastBet: 0,
        _choosenFighter: '',
        _numOfBets: 0,
        
        getPlayerName(){
            return this._playerName;
        },
        getPoints (){
            return this._points;
        },
        getLastBet (){
            return this._lastBet;
        },
        getChoosenFighter (){
            return this._choosenFighter;
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
        },
        getNumBets(){
            return this._numOfBets;
        },
        addNumBets(){
            this._numOfBets++;
        },
        subNumBets(){
            this._numOfBets--;
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
            let input = cleanCommand(message);
            const userName = userstate["display-name"];
            const userType = userstate["user-type"];
            if ((userType === "mod" || userType === "admin" || userName === channelName) && input.command[0] === '$'){
                modCommands(channel, userName, input.command, input.fighter);    
            }else {
                commonCommands(channel,userName, input.command, input.fighter, input.points);
            }
            // FOR DEBUG  USE
            console.log("cmd: " + input.command + " fgt: " + input.fighter + " pts: " + input.points);
            console.log(pointPot.getPoints());
            
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
        case '$kill':
        // Command to close the bot in the server
            killBot(channel, user);
            break;
        case '$ob':
        case '$openbet':
        case '$openbets':
        // Here mods open bets
            pointPot.togglePot('open');
            client.say(channelName, 'Bets are OPEN! Please make your bets ;)');
            break;
        case '$cb':
        case '$closebet':
        case '$closebets':
        // Here mods close bets
            pointPot.togglePot('close');
            client.say(channelName, 'Bets are CLOSED! Best of luck to all :D');
            break;
        case '$winner':
        // Mod notifies the bot that the left fighter won the fight
            let reward = pointPot.endFight(fighter);
            rewardPlayers(fighter, reward);
            if (pointPot.getReOpenStatus()) {
                pointPot.togglePot('open');
                client.say(channelName, 'Bets are OPEN! Please make your bets ;)');
            }
            break;
        case '$et':
        case '$endtourney':
        // Here mods can reset points for a new tornament and announce winner
            let winner = checkPlayerWinner();
            client.say(channelName, `THE WINNER IS @${winner}!! CONGRATULATIONS!! :D`);
            break;
        case '$togglereopen':
            let status = pointPot.toggleReOpen();
            if (status)
                client.say(channelName, 'Automatic re-open bets: ENABLED');
            else
                client.say(channelName, 'Automatic re-open bets: DISABLED');
            break;
    }; 
};

// Common user commands
function commonCommands(channel, user, command, fighter, points) {
    const playerIndex = playerBase.findIndex(player => player._playerName === user);
    const joinedFlag = (playerIndex !== -1);
    const betsOpen = pointPot.getStatus();
    let lastBet = 0;

    switch (command) {
        case '!j':
        case '!join':
        // User joins the game
            if (!joinedFlag)
                playerBase.push(newPlayer(user));
            break;
        case '!bet':
        // Player bets on fighter
            if (joinedFlag && betsOpen) {
                lastBet = playerBase[playerIndex].getLastBet();
                let currentPoints = playerBase[playerIndex].getPoints();
                if (lastBet === 0 && currentPoints > 0 && currentPoints >= points){                
                    playerBase[playerIndex].losePoints(points);
                    playerBase[playerIndex].setFighter(fighter);
                    playerBase[playerIndex].addNumBets();
                    pointPot.makeBet(fighter, points);      
                }
            }
            break;
        case '!ub':
        case '!unbet':
        // Player can remove their bet
            if (joinedFlag && betsOpen) {
                lastBet = playerBase[playerIndex].getLastBet();
                let lastFighter = playerBase[playerIndex].getChoosenFighter();
                if (lastBet > 0) {
                    playerBase[playerIndex].addPoints(lastBet);                    
                    pointPot.refund(lastFighter, lastBet);
                    playerBase[playerIndex].clearLastBet();
                    playerBase[playerIndex].subNumBets();
                }          
            }
            break;
        case '!p':
        case '!checkpoints':
            // implement code for user to check how many points left
            if (joinedFlag){
                const pointsLeft = playerBase[playerIndex].getPoints();                
                client.say(channel, `@${playerBase[playerIndex].getPlayerName()} you have: ${pointsLeft} points`);
            }
            break;
        case '!pot':
        case '!checkpot':
            client.say(channel, pointPot.getPoints());
            break;
        case '!allin':
        //case '!all':
            if (joinedFlag && betsOpen) {
                lastBet = playerBase[playerIndex].getLastBet();
                let currentPoints = playerBase[playerIndex].getPoints();
                if (lastBet === 0 && currentPoints > 0){                
                    playerBase[playerIndex].losePoints(currentPoints);
                    playerBase[playerIndex].setFighter(fighter);
                    playerBase[playerIndex].addNumBets();
                    pointPot.makeBet(fighter, currentPoints);
                    client.say(channel, `DAAAYUUUM @${playerBase[playerIndex].getPlayerName()} has gone ALL IN!! With ${currentPoints} points PogChamp`);      
                }
            }
            break;
    };
};

function rewardPlayers(fighter, reward){
    for (let index in playerBase){
        if (playerBase[index].getChoosenFighter() === fighter)
            playerBase[index].addPoints(reward);
    playerBase[index].clearLastBet();
    }
};

function checkPlayerWinner(){
    let winnerPoints = playerBase[0].getPoints();
    let winnerName = playerBase[0].getPlayerName();
    let winnerBets = playerBase[0].getNumBets();
    for (let index in playerBase){
        let currentPlayer = playerBase[index].getPoints();
        let currentPlayerBets = playerBase[index].getNumBets()
        if(currentPlayer > winnerPoints){
            winnerPoints = currentPlayer;
            winnerName = playerBase[index].getPlayerName();
            winnerBets = currentPlayerBets;
        }            
        if(currentPlayer === winnerPoints && currentPlayerBets > winnerBets){
            winnerPoints = currentPlayer;
            winnerName = playerBase[index].getPlayerName();
            winnerBets = currentPlayerBets;
        }
    }
    return `${winnerName} WITH ${winnerPoints}`;
}

function cleanCommand(message){
    let command = (message.trim()).toLowerCase();
    let fighter = '';
    let points = 0;
    // Check if any message that comes is one that takes an additional variable and variable is within expected
    // !bet {fighter} {points} ; gotta check if fighter and points are string and num
    if (command.includes('!bet')) {
        fighter = command[5];
        points = parseInt(command.slice(7));
        // check if {fighter} is string and {points} a number
        if (typeof fighter === 'string' && typeof points === 'number'){
            // check if {fighter} is either 'A' or 'B'
            if (fighter === 'a' || fighter === 'b'){
                // check if {points} was parsed correctly
                if (points !== NaN)
                    command = '!bet';
                else
                    command = 'ignore';
            }else
                command = 'ignore';
        }else 
            command = 'ignore';   
    }
    // !allin {fighter} ; gotta check if fighter is string and is 'A' or 'B'
    else if (command.includes('!allin')) {
        fighter = command[7];
        if (typeof fighter === 'string'){
            if (fighter === 'a' || fighter === 'b')
                command = '!allin';
            else 
                command = 'ignore';    
        }else 
            command = 'ignore';
    }
    // $winner {fighter} ; gotta check if fighter is string and is 'A' or 'B'
    else if (command.includes('$winner')) {
        fighter = command[8];
        if (typeof fighter === 'string'){
            if (fighter === 'a' || fighter === 'b')
                command = '$winner';
            else 
                command = 'ignore';    
        }else 
            command = 'ignore';
    }
    else if (command.includes('$w')){
        fighter = command[3];
        if (typeof fighter === 'string'){
            if (fighter === 'a' || fighter === 'b')
                command = '$winner';
            else 
                command = 'ignore';    
        }else 
            command = 'ignore';
    }
    return {
        command,
        fighter,
        points
    };
}