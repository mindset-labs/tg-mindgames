---
title: 🔖 Packages & Contracts
layout: default
nav_order: 50
---

# Packages

## `cw-game-lifecycle`

The `cw-game-lifecycle` package is a trait that implements a basic game state machine. The flow of any game within the project can be generalized into the following states:

- `Created`: The game is created and can be joined by players
- `Ready`: The game has been joined by enough players and can be started
- `InProgress`: The game is in progress and players can make moves (commits and reveals)
- `RoundsFinished`: All rounds have been finished but rewards are not distributed yet
- `Ended`: The game has ended and rewards are being distributed

While some games are rounds based and others are not, the state machine is designed to be generic and can be extended as each game is its own contract which can override the default implementation if needed.

Each game also has a `GameConfig` struct that holds the configuration for the game, such as the number of players, the minimum deposit, the maximum deposit, the expiry duration, etc.

### Commit & Reveal

A `commit` is a hash of the player's choice and a nonce (to prevent guessing). The nonce is not provided or sent to the contract until the `reveal` phase.

The contract stores the commit in the state and can later verify the reveal against the commit when provided with the plain value of the choice as well as the nonce.

This ensures that a player is the only one who can reveal their choice and that the reveal is the same as the commit (i.e. a player cannot reveal a different choice than the one they committed).

---

# Games Contracts

## `cw-cooperation-dilemma`

The implementation of the Prisoner's Dilemma game uses the default implementation of the `cw-game-lifecycle` trait but simply overrides the calculation of the rewards and validation of the moves.

```rust
impl GameLifecycle for CooperationDilemma {
    fn is_valid_reveal_choice(value: &String) -> bool {
        // ...
    }

    fn calculate_rewards_and_winners(
        game: &mut Game,
    ) -> Result<bool, LifecycleError> {
        // ...
    }
}
```

## `cw-trade-gains`

Just like the `cw-cooperation-dilemma` contract, the `cw-trade-gains` contract uses the default implementation of the `cw-game-lifecycle` trait but simply overrides the calculation of the rewards and validation of the moves.

## `cw-rock-paper-scissors`

The `cw-rock-paper-scissors` contract uses the default implementation of the `cw-game-lifecycle` trait but simply overrides the calculation of the rewards and validation of the moves.

