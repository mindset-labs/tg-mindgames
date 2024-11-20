use cosmwasm_std::{to_json_binary, Binary, Deps, Env, StdResult, Uint128};

pub fn get_game_by_id(_deps: Deps, _game_id: u64) -> StdResult<Binary> {
    unimplemented!()
}

pub fn get_leaderboard(_deps: Deps) -> StdResult<Binary> {
    unimplemented!()
}

pub fn get_current_round(_deps: Deps, _game_id: u64) -> StdResult<Binary> {
    unimplemented!()
}

pub fn get_game_status(_deps: Deps, _game_id: u64) -> StdResult<Binary> {
    unimplemented!()
}
