use crate::error::ContractError;
use crate::state::{GameConfig, GAME_ID_COUNTER};
use crate::state::{Game, GameStatus, GAMES};
use cosmwasm_std::{Addr, DepsMut, MessageInfo, Response, Uint128};

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

pub fn join_game(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
    telegram_id: String,
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;
    game.players
        .push((info.sender, telegram_id, Uint128::zero()));
    GAMES.save(deps.storage, game_id, &game)?;
    Ok(Response::new())
}

pub fn start_game(deps: DepsMut, info: MessageInfo, game_id: u64) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;
    game.status = GameStatus::InProgress;
    GAMES.save(deps.storage, game_id, &game)?;
    Ok(Response::new())
}

pub fn commit_round(
    deps: DepsMut,
    value: String,
    amount: Option<Uint128>,
) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn commit_round_as_admin(
    deps: DepsMut,
    value: String,
    amount: Option<Uint128>,
    player: Addr,
) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn reveal_round(deps: DepsMut, value: String, nonce: u64) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn end_game(deps: DepsMut, game_id: u64) -> Result<Response, ContractError> {
    unimplemented!()
}
