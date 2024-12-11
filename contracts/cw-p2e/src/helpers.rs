use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{to_json_binary, Addr, CosmosMsg, DepsMut, Env, StdResult, Uint128, WasmMsg};

use crate::{msg::ExecuteMsg, query::query_available_balance, ContractError};

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

pub fn check_available_balance(
    deps: &DepsMut,
    env: &Env,
    sender: &Addr,
    amount: Uint128,
) -> Result<(), ContractError> {
    let available_balance = query_available_balance(&deps.as_ref(), env, sender.clone())?;
    if amount > available_balance.balance {
        return Err(ContractError::InsufficientFunds { available: available_balance.balance });
    }
    Ok(())
}
