#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
// use cw2::set_contract_version;

use crate::error::ContractError;
use crate::lifecycle::GameLifecycle;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-game-lifecycle";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

// Base contract implementation which inherits the GameLifecycle trait and its default implementations
pub struct BaseContract;
impl GameLifecycle for BaseContract {}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    BaseContract::instantiate(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    BaseContract::execute(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    BaseContract::query(deps, env, msg)
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
            total_escrow: Uint128::zero(),
            player_escrow: vec![],
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
            total_escrow: Uint128::zero(),
            player_escrow: vec![],
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
            total_escrow: Uint128::zero(),
            player_escrow: vec![],
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
