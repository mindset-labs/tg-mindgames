use crate::error::ContractError;
use crate::state::GameConfig;
use cosmwasm_std::{Addr, DepsMut, Env, Response, StdResult, Uint128};

pub fn create_game(deps: DepsMut, config: GameConfig) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn join_game(
    deps: DepsMut,
    game_id: u64,
    telegram_id: String,
) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn start_game(deps: DepsMut, game_id: u64) -> Result<Response, ContractError> {
    unimplemented!()
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
