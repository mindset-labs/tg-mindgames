use std::collections::HashMap;

use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const OWNER: Item<Addr> = Item::new("owner");
pub const NAME: Item<String> = Item::new("name");
pub const ADMINS: Item<Vec<Addr>> = Item::new("admins");
pub const GAME_ID_COUNTER: Item<u64> = Item::new("game_id_counter");
pub const GAME_METADATA: Item<GameMetadata> = Item::new("game_metadata");
pub const GAMES: Map<u64, Game> = Map::new("games"); // (Game ID, Game)
pub const LEADERBOARD: Map<String, (Addr, Uint128)> = Map::new("leaderboard"); // (Telegram_id, (address, total_rewards_achieved))

#[cw_serde]
pub struct GameMetadata {
    pub base_url: String,
    pub image_url: String,
    pub token_contract: Addr,
}

#[cw_serde]
pub struct Game {
    pub id: u64,
    pub players: Vec<(Addr, String)>, // (player, telegram ID)
    pub rounds: Vec<GameRound>,
    pub current_round: u8,
    pub status: GameStatus,
    pub config: GameConfig,
    pub creator: Addr,
    pub total_escrow: Uint128, // Total escrowed funds for this game
    pub player_escrow: Vec<(Addr, Uint128)>, // (player, escrowed funds)
    pub scores: HashMap<Addr, Uint128>, // (player, score)
}

#[cw_serde]
pub struct GameRound {
    pub id: u8,
    pub expires_at: Option<u64>, // specific block at which the round expires, null if no expire
    pub commits: Vec<(Addr, String, Option<Uint128>)>, // (player, committed value, committed amout)
    pub reveals: Vec<(Addr, String)>, // (player, revealed value)
    pub status: GameRoundStatus,
}

#[cw_serde]
pub enum GameRoundStatus {
    Pending,
    Committed,
    Revealed,
    Ended,
}

#[cw_serde]
pub enum GameStatus {
    Created,        // Player 1 has joined and staked
    Ready,          // Player 2 has joined and staked
    InProgress,     // Rounds is in progress
    RoundsFinished, // All rounds finished but rewards not distributed and game not closed
    Ended,          // Rewards has been distributed and game closed
}

#[cw_serde]
pub struct GameConfig {
    pub game_joining_fee: Option<Uint128>,
    pub min_deposit: Uint128,
    pub max_players: Option<u8>,
    pub min_players: u8,
    pub round_expiry_duration: Option<u64>, //in Blocks
    pub max_rounds: u8,
    pub round_reward_multiplier: Option<u64>,
    pub has_turns: bool,
    pub skip_reveal: bool,
}
