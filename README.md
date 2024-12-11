# Telegram Mindgames

A decentralized platform for playing classic game theory games via Telegram, powered by CosmWasm smart contracts.

## Overview

Telegram Mindgames allows users to play famous game theory games like the Prisoner's Dilemma against other players through a familiar Telegram interface, while having all game logic and rewards handled transparently on-chain.

## Games

### Prisoner's Dilemma

The classic game of cooperation vs defection. Two players must simultaneously choose whether to cooperate with or betray each other:

- If both players cooperate, they each receive a moderate reward
- If both players defect, they each receive a small penalty
- If one player cooperates while the other defects, the defector receives a large reward while the cooperator receives a large penalty

This creates an interesting dynamic where the Nash equilibrium (both defecting) leads to worse outcomes than if both players had cooperated, but cooperation requires trust.

### Future Games

More game theory classics will be added, such as:
- Stag Hunt
- Chicken Game
- Public Goods Game
- Ultimatum Game

## Technical Architecture

The platform consists of:

- A Telegram bot interface for player interactions
- Backend server for quick player matching
- CosmWasm smart contracts handling:
  - Game logic and state
  - Move validation
  - Reward distribution
- Integration with a play-to-earn token for rewards

All game moves and outcomes are recorded on-chain, ensuring complete transparency and fairness.

## Getting Started

1. Find the bot on Telegram: @MindgamesBot
2. ....
3. ....

Join us in exploring game theory through decentralized gameplay!
