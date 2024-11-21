use crate::state::{GAMES, LEADERBOARD};
use cosmwasm_std::{to_json_binary, Binary, Deps, Env, StdResult, Uint128};

pub fn get_game_by_id(deps: Deps, game_id: u64) -> StdResult<Binary> {
    let game = GAMES.load(deps.storage, game_id)?;
    to_json_binary(&game)
}

pub fn get_leaderboard(deps: Deps) -> StdResult<Binary> {
    let leaderboard = LEADERBOARD.load(deps.storage, "leaderboard".to_string())?;
    to_json_binary(&leaderboard)
}

pub fn get_current_round(deps: Deps, game_id: u64) -> StdResult<Binary> {
    let game = GAMES.load(deps.storage, game_id)?;
    let current_round = game.current_round;
    to_json_binary(&current_round)
}

pub fn get_game_status(deps: Deps, game_id: u64) -> StdResult<Binary> {
    let game = GAMES.load(deps.storage, game_id)?;
    let game_status = game.status;
    to_json_binary(&game_status)
}
