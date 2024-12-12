use cosmwasm_std::StdError;
use cw_game_lifecycle::error::ContractError as GameLifecycleError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid choice")]
    InvalidChoice {},

    #[error("Game lifecycle error: {0}")]
    GameLifecycle(#[from] GameLifecycleError),
}
