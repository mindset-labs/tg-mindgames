---
title: 🏠 Home
layout: home
nav_order: 1
---

# Telegram Mindgames

A decentralized platform for playing classic game theory games via Telegram, powered by CosmWasm smart contracts on the Xion blockchain.

![telegram-mindgames-preview](https://mindset-labs.github.io/tg-mindgames/images/tg-mindgames-preview.png)

## Overview

Telegram Mindgames allows users to play famous game theory games like the Prisoner's Dilemma against other players through a familiar Telegram interface, while having all game logic and rewards handled transparently on-chain.

## Games

### Prisoner's Dilemma

The classic game of cooperation vs defection. Two players must simultaneously choose whether to cooperate with or betray each other:

- If both players cooperate, they each receive a moderate reward
- If both players defect, they each receive a small penalty
- If one player cooperates while the other defects, the defector receives a large reward while the cooperator receives a large penalty

This creates an interesting dynamic where the Nash equilibrium (both defecting) leads to worse outcomes than if both players had cooperated, but cooperation requires trust.

> Game Contract (Xion testnet): `xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz`

The formal description of the game can be found [here](https://en.wikipedia.org/wiki/Prisoner%27s_dilemma).

---


### Trade Gains (aka. Bargaining)

Two players must simultaneously choose how much of a reward pool they want to claim as a value from 0 to 10. If the sum of the two values is greater than 10, the game ends with both players receiving nothing. If the sum of the two values is less than or equal to 10, the game ends with both players receiving what they asked for.

Rewards are multiplied by 10 such that if a player claims 5 out of the 10 possible rewards, they receive 50 total reward tokens from the play-to-earn token contract.

> Game Contract (Xion testnet): `xion1svmey6ndpjlh0mdryk5lw6rzxczfe9d005q44mk4g2tfv6umcxmsek3ttt`

The formal description of the game can be found [here](https://gtl.csa.iisc.ac.in/gametheory/ln/web-cp2-bargaining.pdf).

---

### Rock-Paper-Scissors

A simple game of rock, paper, scissors which follows the same classic rules that we all know.

> Game Contract (Xion testnet): `xion1gkdu9yqntqgf5ta4nucpmgqef4vskqkr63h8y9f4kdmeterdqnxqhle09c`

---

### Asteroid

A simple game of asteroid mining.

> Note: This game is not a game theory game, but a fun game to play so we added it to the platform and used the same [Game Lifecycle](/architecture.html) approach as the other games.

> Game Contract (Xion testnet): `xion1fkpu38egjmdk2whhj8n5duc3m4p5csxgm46haeg5hsl89d2hws5smhctt9`

---

### Future Games

More game theory classics will be added, such as:
- Stag Hunt
- Chicken Game
- Public Goods Game
- Ultimatum Game
- And many more...

> We aim to implement as many games as possible from the known list of [game theory games](https://en.wikipedia.org/wiki/List_of_games_in_game_theory).
