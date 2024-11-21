use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const OWNER: Item<String> = Item::new("owner");
pub const NAME: Item<String> = Item::new("name");
pub const GAME_ID_COUNTER: Item<u64> = Item::new("game_id_counter");
pub const GAME_METADATA: Item<GameMetadata> = Item::new("game_metadata");
pub const GAMES: Map<u64, Game> = Map::new("games"); // (Game ID, Game)
pub const LEADERBOARD: Map<String, (Addr, Uint128)> = Map::new("leaderboard"); // (Telegram_id, (address, total_rewards_achieved))

#[cw_serde]
pub struct GameMetadata {
    pub base_url: String,
    pub image_url: String,
}

#[cw_serde]
pub struct Game {
    pub id: u64,
    pub players: Vec<(Addr, String, Uint128)>, // (player, telegram ID, deposit)
    pub rounds: Vec<GameRound>,
    pub current_round: u8,
    pub status: GameStatus,
    pub config: GameConfig,
    pub creator: Addr,
}

#[cw_serde]
pub struct GameRound {
    pub id: u8,
    pub expires_at: u64, // specific block at which the round expires
    pub commits: Vec<(Addr, String, Option<Uint128>)>, // (player, committed value, committed amout)
    pub result: Vec<(Addr, Option<Uint128>)>, // (winner, amount)
}

#[cw_serde]
pub enum GameStatus {
    Created,    // PLayer 1 has joined and staked
    Ready,      // PLayer 2 has joined and staked
    InProgress, // Rounds is in progress
    Ended,      // Rewards has been distributed
}

#[cw_serde]
pub struct GameConfig {
    pub min_deposit: Uint128,
    pub max_players: Option<u8>,
    pub round_expiry_duration: u64, //in Blocks
    pub max_rounds: u8,
    pub round_reward_multiplier: Option<u64>,
    pub has_turns: bool,
    pub skip_reveal: bool,
}
