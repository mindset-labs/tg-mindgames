---
title: 👾 REPL
layout: default
nav_order: 90
---

# Mind Games REPL

## Game Play

The games can be played through the REPL via External Owned Accounts (EOAs) instead of using Abstract Accounts via the Abstraxion library provided by Xion.

To achieve this, simply clone the repository and following the steps below to set up the environment.

### Dependencies

1. Install Node.js and Yarn
2. Install dependencies

```bash
yarn install
```

3. Setup the environment variables

```bash
cp .env.example .env
```

You can use the following values in the `.env` file:

```
export RPC_URL='https://rpc.xion-testnet-1.burnt.com:443'
export P2E_CODE_ID='1449'
export P2E_CONTRACT_ADDRESS='xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz'
export DILEMMA_CODE_ID='1455'
export DILEMMA_CONTRACT_ADDRESS='xion12cfz7k5a6hj744jdsj52r57dth4tlnggcfqdyw6620rja0f6ltdsl8c2rh'
export ROCK_PAPER_SCISSORS_CODE_ID='1598'
export ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS='xion1gkdu9yqntqgf5ta4nucpmgqef4vskqkr63h8y9f4kdmeterdqnxqhle09c'
export TRADE_GAINS_CODE_ID='1599'
export SIGNER_PRIVATE_KEY='....'
```

4. Run the REPL

```bash
yarn start:repl
```

5. Explore the REPL

```
> help
```

If the `help` command is typed into the REPL, you will see a list of available commands.


### Connecting to the network via REPL

To connect to the Xion network via REPL, you can use the following command:

```bash
> connect
```

> Note: The REPL is built with Typescript and uses `@cosmjs` packages to interact with the Xion network and the game contracts on it. You can use a `--priv-key` flag for the `connect` command to connect to the network via a specific private key instead of the one specified in the `.env` file.

### Creating a game

The next step is to create a game which you and other players can join, this is done by calling `game create` and choosing the type of game you'd like to play:

```shell
> game create
```

The REPL will prompt you to choose the type of game you'd like to play and your telegram ID (simply as a string identifier, we automatically read the telegram ID when playing within the Telegram app).

> Note: You must have the contract addresses corresponding to the game you'd like to play in the `.env` file. This command will fail otherwise.

When creating a game via the REPL, the current player (EOA) is automatically added to the game by joining it. If you'd like to join a game that has already been created, you can use the `game connect` and `game join` commands as shown below.

### Getting Game Details

To get the details of a game, you can use the `game details` command and choose the game you'd like to get the details of.

```shell
> game details
```

You should be able to see the game details in the REPL as shown in the example output below:

```shell
> game details
Getting game 2
{
  id: 2,
  players: [ [ 'xion14le37gv7ye0kk3t9s3fee7znvutdnhegc4caup', 'mindbend0x' ] ],
  rounds: [],
  current_round: 0,
  status: 'created',
  config: {
    game_joining_fee: null,
    min_deposit: '0',
    max_players: 2,
    min_players: 2,
    round_expiry_duration: 1000,
    max_rounds: 1,
    round_reward_multiplier: 1,
    has_turns: true,
    skip_reveal: false
  },
  creator: 'xion14le37gv7ye0kk3t9s3fee7znvutdnhegc4caup',
  total_escrow: '0',
  player_escrow: [],
  scores: {}
}
```

### Joining a game

> Note: skip this if you have just created the game yourself and the REPL is still open.

To join a game, you can use the `game join` command and choose the game you'd like to join and provide the ID of the game.

```bash
> game join
```

If the REPL was shutdown and you've already joined the game prior to shutting down the REPL, you can use the `game connect` command to connect to the game.

```bash
> game connect
```

### Playing the game

Each round within the game is played by committing a move and then revealing that move. The moves are committed by calling the `game play-round` and later revealed by calling the `game reveal-round` command.

```bash
> game play-round
```

Playing a round will hash your choice and save it in the game's state. The REPL automatically keeps track of a nonce for you such that it's not possible for a player who is inspecting the game's state to guess your choice for games with a small set of possible moves (e.g. Rock-Paper-Scissors).

```bash
> game reveal-round
```

Revealing a round will reveal the choice of the player who committed the round and update the game's state.

Whenever all players have revealed their moves for a round, the round is considered complete and the next round (if any) is started.


### Ending the game

Once all rounds have been played, the game can be ended by any of the players by calling the `game end` command.

```bash
> game end
```

This command will end the game and distribute the rewards to the players. Each game contract automatically calls the play-to-earn contract to distribute the rewards to the players.

---

## Contract Management Helpers

The REPL also provides a set of commands to help manage the game contracts. These commands are useful for managing the contracts and their associated state.

The `/scripts` directory contains a 2 useful scripts for compiling + optimizing the contracts and generating the typescript types.

* `./scripts/optimize.sh` - Compiles the contracts and optimizes them for deployment. All WASM outputs are stored in the `/artifacts` directory.
* `./scripts/codegen.sh` - Generates the typescript types for the contracts. All generated files are stored in the `/codegen` directory.

### Uploading contracts

> Note: Make sure to use the `connect` command in the REPL before attempting to upload the contracts.

To upload the contracts to the Xion network, you can use the `upload` command.

```bash
> upload
```

The command will prompt you for the WASM file you'd like to upload. Use the full file name as it is in the `/artifacts` directory.


### Instantiating contracts

To instantiate a contract, you can use the `instantiate` command.

```bash
> instantiate game
```

This command will prompt you for the type of game you'd like to instantiate and it will read the associated code ID from the `.env` file.

You can also specify the code ID manually by using the `--code-id` flag.

```bash
> instantiate game --code-id 1455
```
