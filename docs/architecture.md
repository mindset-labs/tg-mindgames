---
title: 📚 Technical Architecture
layout: default
nav_order: 30
---

# Technical Architecture

![](https://mindset-labs.github.io/tg-mindgames/images/architecture.png)

## Game Lifecycle

The platform consists of:

- A Telegram bot interface for player interactions
- CosmWasm smart contracts handling:
  - Game logic and state
  - Move validation
  - Reward distribution
- Integration with a play-to-earn token for rewards

All game moves and outcomes are recorded on-chain, ensuring complete transparency and fairness.

The way the smart contracts are designed allows for easy addition of new games, as well as the ability to add new features to existing games. Following the architecture of a [GameLifecycle Trait](https://github.com/mindset-labs/tg-mindgames/blob/main/packages/cw-game-lifecycle/src/lifecycle.rs) which holds a default implementation for all games, each game contract must implement the trait and can override the default implementation if needed.

![](https://mindset-labs.github.io/tg-mindgames/images/games.png)

Each game contract is set to be an authorized minter on the play-to-earn token contract (cw20 with some extensions) to enable issuance of rewards to players once a game ends.

The GameLifecycle Trait implements a basic game state machine, which can be extended to support more complex game logic. The following diagram shows the basic state machine for the games implemented so far:

![](https://mindset-labs.github.io/tg-mindgames/images/lifecycle.png)


## Wallet-less Transactions via Xion Meta Accounts

The Xion blockchain implements [Meta Accounts](https://docs.burnt.com/xion/developers/learn/xions-meta-accounts) which allows users to login with web2 credentials (ex: email and OTP) and interact with the on-chain smart contracts.


## Gas-less Transactions via Xion Treasury

The Xion treasury feature also allows for sponsored transactions such that users do not need to worry about paying for gas fees when playing the games.
