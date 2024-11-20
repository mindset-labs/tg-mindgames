#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
// use cw2::set_contract_version;

use crate::error::ContractError;
use crate::execute::{
    commit_round, commit_round_as_admin, create_game, end_game, join_game, reveal_round, start_game,
};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::query::{get_current_round, get_game_by_id, get_game_status, get_leaderboard};
use crate::state::{GameConfig, GameMetadata, GAME_METADATA};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-game-lifecycle";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    GAME_METADATA.save(
        deps.storage,
        &GameMetadata {
            base_url: msg.base_url,
            image_url: msg.image_url,
        },
    )?;

    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGame { config } => create_game(deps, config),

        ExecuteMsg::JoinGame {
            game_id,
            telegram_id,
        } => join_game(deps, game_id, telegram_id),
        ExecuteMsg::StartGame { game_id } => start_game(deps, game_id),
        ExecuteMsg::CommitRound { value, amount } => commit_round(deps, value, amount),
        ExecuteMsg::RevealRound { value, nonce } => reveal_round(deps, value, nonce),
        ExecuteMsg::CommitRoundAsAdmin {
            value,
            amount,
            player,
        } => commit_round_as_admin(deps, value, amount, player),
        ExecuteMsg::EndGame { game_id } => end_game(deps, game_id),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGame { game_id } => get_game_by_id(deps, game_id),
        QueryMsg::GetLeaderboard {} => get_leaderboard(deps),
        QueryMsg::GetCurrentRound { game_id } => get_current_round(deps, game_id),
        QueryMsg::GetGameStatus { game_id } => get_game_status(deps, game_id),
    }
}

#[cfg(test)]
mod tests {}
