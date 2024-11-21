use crate::error::ContractError;
use crate::state::GameConfig;
use crate::state::{Game, GameStatus, GAMES};
use cosmwasm_std::{Addr, DepsMut, Env, MessageInfo, Response, Uint128};

pub fn create_game(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    config: GameConfig,
) -> Result<Response, ContractError> {
    let game_id = GAMES
        .keys(deps.storage, None, None, cosmwasm_std::Order::Descending)
        .next()
        .map(|r| r.unwrap() + 1)
        .unwrap_or(0);

    let game = Game {
        id: game_id,
        players: vec![(info.sender, String::new(), Uint128::zero())],
        rounds: vec![],
        current_round: 0,
        status: GameStatus::Created,
        game_config: config,
    };

    GAMES.save(deps.storage, game_id, &game)?;

    Ok(Response::new()
        .add_attribute("action", "create_game")
        .add_attribute("game_id", game_id.to_string()))
}

pub fn join_game(
    deps: DepsMut,
    game_id: u64,
    _env: Env,
    info: MessageInfo,
    telegram_id: String,
) -> Result<Response, ContractError> {
    let mut game = GAMES.load(deps.storage, game_id)?;
    game.players
        .push((info.sender, telegram_id, Uint128::zero()));
    GAMES.save(deps.storage, game_id, &game)?;
    Ok(Response::new())
}

pub fn start_game(deps: DepsMut, game_id: u64) -> Result<Response, ContractError> {
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
