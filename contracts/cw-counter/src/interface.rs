use cw_orch::{interface, prelude::*};

use crate::msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg};

pub const CONTRACT_ID: &str = "counter";

#[interface(InstantiateMsg, ExecuteMsg, QueryMsg, MigrateMsg, id = CONTRACT_ID)]
pub struct CounterContract;

impl<Chain> Uploadable for CounterContract<Chain> {
    /// Return the path to the wasm file corresponding to the contract
    fn wasm(_chain: &ChainInfoOwned) -> WasmPath {
        artifacts_dir_from_workspace!()
            .find_wasm_path("cw_counter")
            .unwrap()
    }
    /// Returns a CosmWasm contract wrapper
    fn wrapper() -> Box<dyn MockContract<Empty>> {
        Box::new(
            ContractWrapper::new_with_empty(
                crate::contract::execute,
                crate::contract::instantiate,
                crate::contract::query,
            )
            // .with_migrate(crate::contract::migrate),
        )
    }
}