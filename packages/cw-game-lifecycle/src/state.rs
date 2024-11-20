use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const OWNER: Item<String> = Item::new("owner");
pub const NAME: Item<String> = Item::new("name");
pub const GAMES: Map<u64, Game> = Map::new("games");
pub const LEADERBOARD: Map<Addr, Uint128> = Map::new("leaderboard"); // (player, total_rewards_achieved)

#[cw_serde]
pub struct Game {
    pub id: u64,
    pub players: Vec<(Addr, Uint128)>, // (player, deposit)
    pub rounds: Vec<GameRound>,
    pub current_round: u8,
    pub status: GameStatus,
    pub game_config: GameConfig,
}

#[cw_serde]
pub struct GameRound {
    pub id: u8,
    pub expires_at: u64,
    // TODO: add other round data
}

#[cw_serde]
pub enum GameStatus {
    Created,
    Started,
    Ended,
}

#[cw_serde]
pub struct GameConfig {
    pub min_deposit: Uint128,
    pub max_players: u8,
    pub round_expiry_duration: u64,
    pub max_rounds: u8,
    pub round_reward_multiplier: Option<u64>,
}
