use crate::state::{Game, GameConfig, GameRound, GameStatus};
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;
use cosmwasm_std::Uint128;

#[cw_serde]
pub struct InstantiateMsg {
    pub base_url: String,
    pub image_url: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateGame {
        config: GameConfig,
    },
    StartGame {
        game_id: u64,
    },
    JoinGame {
        game_id: u64,
        telegram_id: String,
    },
    CommitRound {
        value: String, // hashed value (choice, nonce)
        amount: Option<Uint128>,
    },
    CommitRoundAsAdmin {
        value: String,
        amount: Option<Uint128>,
        player: Addr,
    },
    RevealRound {
        value: String, // revealed value
        nonce: u64,
    },
    EndGame {
        game_id: u64, // Distribute rewards and update the leaderboard
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Game)]
    GetGame { game_id: u64 },
    #[returns(Vec<(Addr, String, Uint128)>)] // vector of (player addr, telegram ID, score)
    GetLeaderboard {},
    #[returns(GameRound)]
    GetCurrentRound { game_id: u64 },
    #[returns(GameStatus)]
    GetGameStatus { game_id: u64 },
}
