# FakeBets - A twitch chatbot

## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Get Environment Variables](#get-environment-variables)
* [Setup](#setup)
* [Commands](#commands)

## General info
A bot that connects to a twitch chat and allows chat members to make bets with fake points. Made to work with tmi.js. 

This project was inspired to make fighting games tournaments on Twitch more interactive with the chat.
	
## Technologies
Project is created with:
* tmi.js: 1.7.1 
* Node.js

## Get Environment Variables
To start, you’ll need three environment variables:
| Variable      | Description           |
| ------------- |-------------  |
| `BOT_USERNAME`| The account (username) that the chatbot uses to send chat messages. This can be your Twitch account. Alternately, many choose to create a second Twitch account for their bot, so it's clear from whom the messages originate. |
| `OAUTH_TOKEN` | The token to authenticate your chatbot with Twitch's servers. Generate this with https://twitchapps.com/tmi/ (a Twitch community-driven wrapper around the Twitch API), while logged in to your chatbot account. The token will be an alphanumeric string.|
| `CHANNEL_NAME`| The Twitch channel name where you want to run the bot. Usually this is your main Twitch account.|

## Setup
To run this project:
1. Make a Twitch account for the bot to use
2. Install node.js and npm, following the instructions on the links.
3. On the command line, install tmi.js :
`npm install tmi.js`
4. Clone this repo with: 
`gh repo clone kratzx/twitchbot-fakebets`
5. In the repo folder, modify *.env.example* and replace the three environmental variables with the values obtained above.
6. Change *.env.example* to *.env*
6. Run bot.js locally using node:
`node bot.js`
7. Now that the bot is running and connected to the Twitch IRC network, we can interact with it. 

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
