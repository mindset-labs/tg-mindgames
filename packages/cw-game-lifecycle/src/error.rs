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

    #[error("Player is not in the game")]
    PlayerNotInGame { game_id: u64, player: Addr },

    #[error("Round has already been committed")]
    RoundAlreadyCommitted { game_id: u64, player: Addr },

    #[error("Round not found")]
    RoundNotFound { game_id: u64, round: u8 },

    #[error("Round has expired")]
    RoundExpired { game_id: u64, round: u8 },

    #[error("Round has not been committed")]
    RoundNotCommitted { game_id: u64, round: u8 },

    #[error("Insufficient funds for deposit")]
    InsufficientFunds {
        expected: Uint128,
        received: Uint128,
    },

    #[error("Cannot close game {reason}")]
    CannotCloseGame { reason: String },

    #[error("Round reveal mismatch")]
    RoundRevealMismatch{game_id: u64, round: u8},

    #[error("Invalid reveal choice")]
    InvalidRevealChoice { game_id: u64, round: u8 },
}
