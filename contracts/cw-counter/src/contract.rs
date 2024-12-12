use crate::state::COUNT;
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult}; // use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-counter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    COUNT.save(_deps.storage, &0)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match _msg {
        ExecuteMsg::Increment {} => increment(_deps),
    }
}

pub fn increment(_deps: DepsMut) -> Result<Response, ContractError> {
    let count = COUNT.load(_deps.storage)?;
    COUNT.save(_deps.storage, &(count + 1))?;
    Ok(Response::new().add_attribute("action", "increment"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, _msg: QueryMsg) -> StdResult<Binary> {
    match _msg {
        QueryMsg::GetCount {} => get_count(_deps),
    }
}

pub fn get_count(_deps: Deps) -> StdResult<Binary> {
    let count = COUNT.load(_deps.storage)?;
    to_binary(&count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies();
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "ucosm"));
        let res = super::instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes.len(), 1);
        assert_eq!(res.attributes[0].key, "action");
        assert_eq!(res.attributes[0].value, "instantiate");
    }

    #[test]
    fn get_count() {
        let mut deps = mock_dependencies();

        // First initialize the contract to set the initial count
        let init_msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "ucosm"));
        instantiate(deps.as_mut(), mock_env(), info, init_msg).unwrap();

        // Then query the count
        let msg = QueryMsg::GetCount {};
        let res = query(deps.as_ref(), mock_env(), msg).unwrap();
        let count: u64 = from_binary(&res).unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_increment() {
        let mut deps = mock_dependencies();
        let init_msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "ucosm"));
        instantiate(deps.as_mut(), mock_env(), info.clone(), init_msg).unwrap();

        let msg = ExecuteMsg::Increment {};
        execute(deps.as_mut(), mock_env(), info, msg).unwrap();

        let msg = QueryMsg::GetCount {};
        let res = query(deps.as_ref(), mock_env(), msg).unwrap();
        let count: u64 = from_binary(&res).unwrap();
        assert_eq!(count, 1);
    }
}
