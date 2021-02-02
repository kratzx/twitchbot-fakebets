# FakeBets - A twitch chatbot

## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)

## General info
A bot that connects to a twitch chat and allows chat members to make bets with fake points. Made to work with tmi.js. 

This project was inspired to make fighting games tournaments on Twitch more interactive with the chat.
	
## Technologies
Project is created with:
* tmi.js: 1.7.1 
* Node.js
	
## Setup
To run this project:

```
$ npm i tmi.js
$ gh repo clone kratzx/twitchbot-fakebets
$ node bot.js
```
## Commands
All commands must be sent in the twitch chat. Mod commands can be issued by a mod or the channel owner.
### Mod commands:
* Kill the bot - `$kill`
* Open bets for players - `$ob`, `$openbet`, `$openbets`
* Close bets for players - `$cb`, `$closebet`, `$closebets`
* Notify fighter who won - `$winner {fighter}`, `$w {fighter}`
* End tournament and announce player with most points - `$et`, `$endtourney`
* Toggle automatic open bets after nofitied winning fighter - `$togglereopen`
### Common commands:
* Player joins betting game - `!j`, `!join`
* Make bet - `!bet {fighter} {points}`
* Cancel last bet - `!ub`, `!unbet`
* Check available points - `!p`, `!checkpoints`
* Check points in the pot - `!pot`, `!checkpot`
* Bets all the available points - `!allin {fighter}`
