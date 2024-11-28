use cosmwasm_std::{StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Cw20 error: {0}")]
    Cw20(#[from] cw20_base::ContractError),

    #[error("Insufficient funds: available {available}")]
    InsufficientFunds { available: Uint128 },

    #[error("Overflow")]
    Overflow {},

    #[error("Unauthorized")]
    Unauthorized {},
    // Add any other custom errors you like here.
    // Look at https://docs.rs/thiserror/1.0.21/thiserror/ for details.
}
