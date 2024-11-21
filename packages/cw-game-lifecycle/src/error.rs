use cosmwasm_std::{Addr, StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Game not in created state and cannot be joined")]
    GameNotInCreatedState { game_id: u64 },

    #[error("Player already joined the game")]
    PlayerAlreadyJoined { game_id: u64, player: Addr },

    #[error("Game is full and cannot be joined")]
    GameFull { game_id: u64 },

    #[error("Game not in ready state and cannot be started")]
    GameNotInReadyState { game_id: u64 },

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("No funds provided")]
    NoFundsProvided {},

    #[error("Wrong denom for deposit")]
    InvalidDenom { expected: String },

    #[error("Insufficient funds for deposit")]
    InsufficientFunds {
        expected: Uint128,
        received: Uint128,
    },
    // Add any other custom errors you like here.
    // Look at https://docs.rs/thiserror/1.0.21/thiserror/ for details.
}
