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
use crate::state::{GameConfig, GameMetadata, GAME_ID_COUNTER, GAME_METADATA, OWNER};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-game-lifecycle";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    GAME_METADATA.save(
        deps.storage,
        &GameMetadata {
            base_url: msg.base_url,
            image_url: msg.image_url,
        },
    )?;
    OWNER.save(deps.storage, &info.sender)?;
    GAME_ID_COUNTER.save(deps.storage, &0)?;

    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGame { config } => create_game(deps, info, config),
        ExecuteMsg::JoinGame {
            game_id,
            telegram_id,
        } => join_game(deps, info, game_id, telegram_id),
        ExecuteMsg::StartGame { game_id } => start_game(deps, info, game_id),
        ExecuteMsg::CommitRound {
            game_id,
            value,
            amount,
        } => commit_round(deps, info, game_id, value, amount),
        ExecuteMsg::CommitRoundAsAdmin {
            game_id,
            value,
            amount,
            player,
        } => commit_round_as_admin(deps, info, game_id, player, value, amount),
        ExecuteMsg::RevealRound {
            game_id,
            value,
            nonce,
        } => reveal_round(deps, info, game_id, value, nonce),
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
mod tests {
    use super::*;
    use crate::state::{Game, GameConfig, GameStatus, GAMES};
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{from_json, Addr, Uint128};

    #[test]
    fn test_get_game_by_id() {
        let mut deps = mock_dependencies();
        let game_id = 1u64;

        let game = Game {
            id: game_id,
            players: vec![],
            rounds: vec![],
            current_round: 0,
            status: GameStatus::Created,
            config: GameConfig::default(),
            creator: Addr::unchecked("creator"),
        };

        GAMES.save(deps.as_mut().storage, game_id, &game).unwrap();

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetGame { game_id }).unwrap();
        let saved_game: Game = from_json(&res).unwrap();

        assert_eq!(game.id, saved_game.id);
        assert_eq!(game.status, saved_game.status);
    }

    #[test]
    fn test_get_current_round() {
        let mut deps = mock_dependencies();
        let game_id = 1u64;

        let game = Game {
            id: game_id,
            players: vec![],
            rounds: vec![],
            current_round: 2,
            status: GameStatus::InProgress,
            config: GameConfig::default(),
            creator: Addr::unchecked("creator"),
        };

        GAMES.save(deps.as_mut().storage, game_id, &game).unwrap();

        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetCurrentRound { game_id },
        )
        .unwrap();
        let current_round: u8 = from_json(&res).unwrap();

        assert_eq!(current_round, 2);
    }

    #[test]
    fn test_get_game_status() {
        let mut deps = mock_dependencies();
        let game_id = 1u64;

        let game = Game {
            id: game_id,
            players: vec![],
            rounds: vec![],
            current_round: 0,
            status: GameStatus::Ready,
            config: GameConfig::default(),
            creator: Addr::unchecked("creator"),
        };

        GAMES.save(deps.as_mut().storage, game_id, &game).unwrap();

        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetGameStatus { game_id },
        )
        .unwrap();
        let status: GameStatus = from_json(&res).unwrap();

        assert_eq!(status, GameStatus::Ready);
    }
}
