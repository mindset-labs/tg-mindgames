use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Unsupported chain ID: {chain_id}")]
    UnsupportedChain { chain_id: String },

    #[error("Invalid address format: {address}")]
    InvalidAddress { address: String },

    #[error("Failed to derive address")]
    AddressDerivationError,
    // Add any other custom errors you like here.
    // Look at https://docs.rs/thiserror/1.0.21/thiserror/ for details.
}
