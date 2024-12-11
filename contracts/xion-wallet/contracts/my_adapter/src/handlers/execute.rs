use crate::{
    contract::{
        AdapterResult, MyAdapter
    },
    msg::MyAdapterExecuteMsg,
    state::{CONFIG, STATUS},
    MyAdapterError, XION_WALLET_NAMESPACE,
};

use abstract_adapter::{
    objects::namespace::Namespace,
    sdk::{AccountVerification, ModuleRegistryInterface},
    traits::AbstractResponse,
};
use cosmwasm_std::{ensure_eq, DepsMut, Env, MessageInfo};

pub fn execute_handler(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    module: MyAdapter,
    msg: MyAdapterExecuteMsg,
) -> AdapterResult {
    match msg {
        MyAdapterExecuteMsg::UpdateConfig {} => update_config(deps, env, info, module),
        MyAdapterExecuteMsg::SetStatus { status } => set_status(deps, env, module, status),
    }
}

/// Update the configuration of the adapter
fn update_config(deps: DepsMut, env: Env, _msg_info: MessageInfo, module: MyAdapter) -> AdapterResult {
    // Only admin(namespace owner) can change recipient address
    let namespace = module
        .module_registry(deps.as_ref(), &env)?
        .query_namespace(Namespace::new(XION_WALLET_NAMESPACE)?)?;

    // unwrap namespace, since it's unlikely to have unclaimed namespace as this adapter installed
    let namespace_info = namespace.unwrap();
    ensure_eq!(
        namespace_info.account,
        module.target_account.clone().unwrap(),
        MyAdapterError::Unauthorized {}
    );
    let mut _config = CONFIG.load(deps.storage)?;

    Ok(module.response("update_config"))
}

fn set_status(deps: DepsMut, env: Env, module: MyAdapter, status: String) -> AdapterResult {
    let account_registry = module.account_registry(deps.as_ref(), &env)?;

    let account_id = account_registry.account_id(module.target()?)?;
    STATUS.save(deps.storage, &account_id, &status)?;

    Ok(module
        .response("set_status")
        .add_attribute("new_status", &status)
        .add_attribute("account_id", account_id.to_string()))
}
