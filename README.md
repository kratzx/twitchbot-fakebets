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
### Mod commands:
	$kill
	$ob , $openbet, $openbets
	$cb, $closebet, $closebets
	$winner, $w
	$et, $endtourney
	$togglereopen
### Common commands:
	!j, !join
	!bet
	!ub, !unbet
	!p, !checkpoints
	!pot, !checkpot
	!allin
