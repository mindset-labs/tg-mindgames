use std::collections::HashMap;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{to_json_binary, Addr, CosmosMsg, StdResult, Uint128, WasmMsg};
use crate::{msg::ExecuteMsg, state::{Game, GameConfig, GameRound, GameRoundStatus, GameStatus}};

/// CwTemplateContract is a wrapper around Addr that provides a lot of helpers
/// for working with this.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct CwTemplateContract(pub Addr);

impl CwTemplateContract {
    pub fn addr(&self) -> Addr {
        self.0.clone()
    }

    pub fn call<T: Into<ExecuteMsg>>(&self, msg: T) -> StdResult<CosmosMsg> {
        let msg = to_json_binary(&msg.into())?;
        Ok(WasmMsg::Execute {
            contract_addr: self.addr().into(),
            msg,
            funds: vec![],
        }
        .into())
    }
}

impl Game {
    pub fn new(id: u64, config: GameConfig, creator: Addr) -> Self {
        Self {
            id,
            creator,
            players: vec![], // TODO: should the creator be auto joined? if yes, what's the join fee?
            rounds: vec![],
            current_round: 0,
            status: GameStatus::Created,
            config,
            total_escrow: Uint128::zero(),
            player_escrow: vec![],
        }
    }
}

/// Trait for calculating winners and distributing rewards in a game.
/// 
/// # Implementation Requirements
/// 
/// Implementors must:
/// - Calculate winners based on game-specific rules
/// - Determine reward distribution among winners
/// - Update relevant game state with results
pub trait GameRewards {
    type Scores: Into<HashMap<Addr, u64>>;
    type Rewards: Into<HashMap<Addr, Uint128>>;

    /// Calculates winners and their corresponding rewards for the game
    fn calculate_winners_and_rewards(&mut self) -> StdResult<(Self::Scores, Self::Rewards)>;
}

impl Default for GameConfig {
    fn default() -> Self {
        Self {
            game_joining_fee: None,
            min_deposit: Uint128::zero(),
            max_players: Some(5),
            min_players: 2,
            round_expiry_duration: Some(100),
            max_rounds: 3,
            round_reward_multiplier: None,
            has_turns: false,
            skip_reveal: false,
        }
    }
}

impl GameRound {
    pub fn new(id: u8, expires_at: Option<u64>) -> Self {
        Self { id, expires_at, commits: vec![], reveals: vec![], status: GameRoundStatus::Pending }
    }
}
