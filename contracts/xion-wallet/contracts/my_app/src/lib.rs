pub mod contract;
pub mod error;
mod handlers;
pub mod msg;
mod replies;
pub mod state;

pub mod ibc;

pub use error::MyAppError;

/// The version of your app
pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

pub use contract::interface::MyAppInterface;

pub const XION_WALLET_NAMESPACE: &str = "xion-wallet";
pub const MY_APP_NAME: &str = "my-app";
pub const MY_APP_ID: &str = const_format::concatcp!(XION_WALLET_NAMESPACE, ":", MY_APP_NAME);
