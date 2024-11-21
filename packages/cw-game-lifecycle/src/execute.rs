use std::u64;

use crate::error::ContractError;
use crate::state::{Game, GameRound, GameRoundStatus, GameStatus, ADMINS, GAMES, OWNER};
use crate::state::{GameConfig, GAME_ID_COUNTER};
use cosmwasm_std::{Addr, DepsMut, Env, MessageInfo, Response, Storage, Uint128};
use sha2::{Digest, Sha256};
use hex;

fn _validate_deposit() -> Result<(), ContractError> {
    //TODO: check what currency is used for the deposit
    //       * if it's not the native token $COREUM, we need to check if the Smart Token contract is whitelisted
    //       * if it's not whitelisted, return an error

    // // Check if min_deposit is required and validate user's deposit
    // if config_clone.min_deposit > Uint128::zero() {
    //     // Check if user sent any funds
    //     if info.funds.is_empty() {
    //         return Err(ContractError::NoFundsProvided {});
    //     }

    //     // Find matching deposit denomination
    //     let deposit = info
    //         .funds
    //         .iter()
    //         .find(|coin| coin.denom == config_clone.min_deposit.denom)
    //         .ok_or(ContractError::InvalidDenom {
    //             expected: config_clone.min_deposit.denom.clone(),
    //         })?;

    //     // Validate deposit amount meets minimum
    //     if deposit.amount < config_clone.min_deposit {
    //         return Err(ContractError::InsufficientFunds {
    //             expected: config_clone.min_deposit,
    //             received: deposit.amount,
    //         });
    //     }

    //     // Deposit the funds in the escrow
    //     let escrow_key = (game_id, sender);
    //     let escrow = ESCROW
    //         .load(deps.storage, escrow_key.clone())
    //         .unwrap_or_default();
    //     ESCROW.save(
    //         deps.storage,
    //         escrow_key,
    //         &Coin {
    //             denom: deposit.denom.clone(),
    //             amount: escrow.amount + deposit.amount,
    //         },
    //     )?;

    //     // Set initial escrow amount
    //     game.total_escrow = config_clone.min_deposit.clone();
    // }

    Ok(())
}

// Creates a new game with the given config.
pub fn create_game(
    deps: DepsMut,
    info: MessageInfo,
    config: GameConfig,
) -> Result<Response, ContractError> {
    // Increment the game ID counter and use current value as the new game ID
    let game_id = GAME_ID_COUNTER.load(deps.storage)?;
    GAME_ID_COUNTER.save(deps.storage, &(game_id + 1))?;

    let game = Game::new(game_id, config, info.sender);
    GAMES.save(deps.storage, game_id, &game)?;

    Ok(Response::new()
        .add_attribute("action", "create_game")
        .add_attribute("game_id", game_id.to_string()))
}

// Joins a player to a game.
pub fn join_game(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
    telegram_id: String,
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;

    if game.status != GameStatus::Created {
        // game cannot be joined since it's either already started or ended
        return Err(ContractError::GameNotInCreatedState { game_id });
    } else if game.players.iter().any(|p| p.0 == info.sender) {
        // player has already joined the game
        return Err(ContractError::PlayerAlreadyJoined {
            game_id,
            player: info.sender.clone(),
        });
    } else if game.players.len() >= game.config.max_players.unwrap_or(u8::MAX) as usize {
        // game is full and cannot be joined
        return Err(ContractError::GameFull { game_id });
    }

    // TODO: handle player joining fee by reading `game.config.min_deposit`
    //         * should lock a certain amount of the player's funds if `min_deposit` is greater than 0
    //         *
    //         * should create an allowance for the game contract to spend some amount of the player's (locked) funds
    //         * this can be done by calling `lock_funds` and `increase_allowance` on the cw20 token contract from here
    //         * this contract will be whitelisted on the cw20 token contract as a minter / admin / spender

    // add the player to the game
    game.players.push((info.sender.clone(), telegram_id));
    // check if the game is ready to start and update the game status accordingly
    if game.players.len() >= game.config.min_players as usize {
        game.status = GameStatus::Ready;
    }

    GAMES.save(deps.storage, game_id, &game)?;

    Ok(Response::new()
        .add_attribute("action", "join_game")
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("player", info.sender.clone().to_string()))
}

// Starts the game by updating its state and creating the first round
pub fn start_game(
    deps: DepsMut,
    _info: MessageInfo,
    game_id: u64,
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;

    if game.status != GameStatus::Ready {
        return Err(ContractError::GameNotInReadyState { game_id });
    }

    game.status = GameStatus::InProgress;
    game.current_round = 1;
    game.rounds
        .push(GameRound::new(1, game.config.round_expiry_duration));

    GAMES.save(deps.storage, game_id, &game)?;

    Ok(Response::new()
        .add_attribute("action", "start_game")
        .add_attribute("game_id", game_id.to_string()))
}

// Internal method to commit a round to the game as a player or an admin
fn _commit_round(
    deps: DepsMut,
    env: Env,
    game_id: u64,
    player: Addr,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;

    if !game.players.iter().any(|p| p.0 == player) {
        // player is not in the game, throw an error
        return Err(ContractError::PlayerNotInGame { game_id, player });
    }

    let round = game
        .rounds
        .iter_mut()
        .find(|r| r.id == game.current_round)
        .ok_or(ContractError::RoundNotFound { game_id, round: game.current_round })?;

    if round.commits.iter().any(|c| c.0 == player) {
        // player has already committed to the round
        return Err(ContractError::RoundAlreadyCommitted { game_id, player });
    }

    // check block_expired < current_block and status
    if env.block.height >= round.expires_at.unwrap_or(u64::MAX) {
        // round has expired
        return Err(ContractError::RoundExpired { game_id, round: round.id });
    }

    round.commits.push((player, value, amount));

    if round.commits.len() >= game.players.len() {
        // round is full, all players have committed
        round.status = GameRoundStatus::Committed;
    }

    GAMES.save(deps.storage, game_id, &game)?;
    Ok(Response::new())
}

// Commits a round to the game as a player
pub fn commit_round(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    game_id: u64,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    _commit_round(deps, env, game_id, info.sender, value, amount)
}

// Commits a round to the game as an admin
pub fn commit_round_as_admin(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    game_id: u64,
    player: Addr,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    if !ADMINS.load(deps.storage)?.contains(&info.sender)
        && OWNER.load(deps.storage)? != info.sender
    {
        return Err(ContractError::Unauthorized {});
    }

    _commit_round(deps, env, game_id, player, value, amount)
}

// Reveals a round by a player
pub fn reveal_round(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    game_id: u64,
    value: String,
    nonce: u64, //will be store temporally in the frontend
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;

    if game.config.skip_reveal {
        // skip reveal, just calculate the winner
        return Ok(Response::new()
            .add_attribute("action", "reveal_round")
            .add_attribute("game_id", game_id.to_string())
            .add_attribute("round_id", game.current_round.to_string()));
    }

    let round = game
        .rounds
        .iter_mut()
        .find(|r| r.id == game.current_round)
        .ok_or(ContractError::RoundNotFound { game_id, round: game.current_round })?;

    // Not all players committed and the round has not expired 
    // and reveal is not skippable (i.e. all players must commit before a reveal can be made)
    if round.status != GameRoundStatus::Committed && 
        round.expires_at.unwrap_or(u64::MAX) > env.block.height &&
        !game.config.skip_reveal {
        return Err(ContractError::RoundNotCommitted { game_id, round: round.id });
    }

    let player_commit = round
        .commits
        .iter()
        .find(|c| c.0 == info.sender)
        .map(|c| c.1.clone());
    
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    hasher.update(nonce.to_be_bytes());
    let hash = hex::encode(hasher.finalize());
    
    //Check if the reveal_commit match the previously submitted hashed commit 
    if hash != player_commit.unwrap_or_default() {
        return Err(ContractError::RoundRevealMismatch { game_id: game_id, round: game.current_round });
    }

    // push the revealed value and optionally close the round
    round.reveals.push((info.sender.clone(), value));

    // if all players revealed or the round has expired, close the round
    if round.reveals.len() >= game.players.len() || round.expires_at.unwrap_or(u64::MAX) < env.block.height {
        round.status = GameRoundStatus::Ended;
        game.current_round += 1;
    }

    // if all rounds are finished, set the game status to RoundsFinished
    if game.current_round >= game.config.max_rounds {
        game.status = GameStatus::RoundsFinished;
    }

    GAMES.save(deps.storage, game_id, &game)?;

    Ok(Response::new()
        .add_attribute("action", "reveal_round")
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("round_id", game.current_round.to_string())
        .add_attribute("player", info.sender.clone().to_string()))
}

// Ends the game by updating its state
pub fn end_game(deps: DepsMut, info: MessageInfo, game_id: u64) -> Result<Response, ContractError> {
    let is_admin = ADMINS.load(deps.storage)?.contains(&info.sender)
        || OWNER.load(deps.storage)? == info.sender;
    let mut game = GAMES.load(deps.storage, game_id)?;
    
    // check if the game can be ended (must be in progress and max rounds, if set, is reached)
    match (game.status, is_admin) {
        // admin can end the game at any time or if rounds are finished
        (GameStatus::RoundsFinished, _) | (_, true) => {
            game.status = GameStatus::Ended;
            GAMES.save(deps.storage, game_id, &game)?;
        }
        _ => {
            return Err(ContractError::CannotCloseGame {
                reason: String::from("Rounds not finished!")
            });
        }
    }

    Ok(Response::new()
        .add_attribute("action", "end_game")
        .add_attribute("game_id", game_id.to_string()))
}
