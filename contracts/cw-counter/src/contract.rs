#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult}; // use cw2::set_contract_version;

use crate::state::{ADMIN, COUNT};
use crate::error::ContractError;
use crate::msg::{ExecuteMsg, GetCountResponse, InstantiateMsg, QueryMsg};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-counter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    COUNT.save(deps.storage, &0)?;
    
    let contract_info = deps.querier.query_wasm_contract_info(env.contract.address)?;
    if let Some(admin) = contract_info.admin {
        ADMIN.save(deps.storage, &admin.to_string())?;
    }

    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Increment {} => increment(deps),
        ExecuteMsg::Reset { count } => reset(deps, env, info, count),
    }
}

pub fn increment(deps: DepsMut) -> Result<Response, ContractError> {
    let count = COUNT.load(deps.storage)?;
    COUNT.save(deps.storage, &(count + 1))?;
    Ok(Response::new().add_attribute("action", "increment"))
}

pub fn reset(deps: DepsMut, env: Env, info: MessageInfo, count: u64) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage);
    match admin {
        Ok(admin) => {
            if info.sender.to_string() != admin {
                return Err(ContractError::Unauthorized {
                    admin: admin.to_string(),
                    sender: info.sender.to_string(),
                });
            }
        }
        // no admin set, so we don't need to check
        Err(_) => {}
    }

    COUNT.save(deps.storage, &count)?;
    Ok(Response::new().add_attribute("action", "reset"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetCount {} => get_count(deps),
    }
}

pub fn get_count(deps: Deps) -> StdResult<Binary> {
    let count = COUNT.load(deps.storage)?;
    to_json_binary(&GetCountResponse { count })
}
