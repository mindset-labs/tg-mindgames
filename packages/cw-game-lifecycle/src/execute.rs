use crate::error::ContractError;
use crate::state::{Game, GameRound, GameStatus, ADMINS, ESCROW, GAMES, OWNER};
use crate::state::{GameConfig, GAME_ID_COUNTER};
use cosmwasm_std::{Addr, Coin, DepsMut, MessageInfo, Response, Uint128};

// Creates a new game with the given config.
pub fn create_game(
    deps: DepsMut,
    info: MessageInfo,
    config: GameConfig,
) -> Result<Response, ContractError> {
    // Increment the game ID counter and use current value as the new game ID
    let sender = info.sender.clone(); // Clone once at the start

    let game_id = GAME_ID_COUNTER.load(deps.storage)?;
    GAME_ID_COUNTER.save(deps.storage, &(game_id + 1))?;

    let config_clone = config.clone();
    let mut game = Game::new(game_id, config, info.sender);

    //TODO: check what currency is used for the deposit
    //       * if it's not the native token $COREUM, we need to check if the Smart Token contract is whitelisted
    //       * if it's not whitelisted, return an error

    // Check if min_deposit is required and validate user's deposit
    if config_clone.min_deposit.amount > Uint128::zero() {
        // Check if user sent any funds
        if info.funds.is_empty() {
            return Err(ContractError::NoFundsProvided {});
        }

        // Find matching deposit denomination
        let deposit = info
            .funds
            .iter()
            .find(|coin| coin.denom == config_clone.min_deposit.denom)
            .ok_or(ContractError::InvalidDenom {
                expected: config_clone.min_deposit.denom.clone(),
            })?;
        // Validate deposit amount meets minimum
        if deposit.amount < config_clone.min_deposit.amount {
            return Err(ContractError::InsufficientFunds {
                expected: config_clone.min_deposit.amount,
                received: deposit.amount,
            });
        }

        // Deposit the funds in the escrow
        let escrow_key = (game_id, sender);
        let escrow = ESCROW
            .load(deps.storage, escrow_key.clone())
            .unwrap_or_default();
        ESCROW.save(
            deps.storage,
            escrow_key,
            &Coin {
                denom: deposit.denom.clone(),
                amount: escrow.amount + deposit.amount,
            },
        )?;

        // Set initial escrow amount
        game.total_escrow = config_clone.min_deposit.clone();
    }

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
    game.players
        .push((info.sender.clone(), telegram_id, Uint128::zero()));
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
    info: MessageInfo,
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
    game_id: u64,
    player: Addr,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    // TODO:
    //  * check if the player is in the game, if not, do some state updates just to charge them funds (👹)
    //  * check round status (must be valid)
    //  * check if the round has already been committed by the player
    //  * commit the round

    unimplemented!()
}

// Commits a round to the game as a player
pub fn commit_round(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    _commit_round(deps, game_id, info.sender, value, amount)
}

// Commits a round to the game as an admin
pub fn commit_round_as_admin(
    deps: DepsMut,
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

    _commit_round(deps, game_id, player, value, amount)
}

// Reveals a round by a player
pub fn reveal_round(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
    value: String,
    nonce: u64,
) -> Result<Response, ContractError> {
    // TODO:
    //  * check round status (must be valid - all players must have committed to begin revealing)
    //  * find the players commit for the round
    //  * hash(value, nonce) and compare it with the committed value
    //      * if they match, update the round reveal set
    //      * if not, return an error
    //  * if all the players revealed, calculate the winner and update the round / game state accordingly
    unimplemented!()
}

// Ends the game by updating its state
pub fn end_game(deps: DepsMut, game_id: u64) -> Result<Response, ContractError> {
    // TODO:
    //  * check if the game can be ended (must be in progress and max rounds, if set, is reached)
    //  * update the game state accordingly
    //  * issue rewards to the winners and burn the remaining pot

    unimplemented!()
}
