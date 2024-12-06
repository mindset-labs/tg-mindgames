use abstract_app::std::ibc::ModuleIbcInfo;
use cosmwasm_std::{Binary, DepsMut, Env, Response, from_json};

use crate::{
    contract::{
        MyApp, MyAppResult
    },
    msg::IbcMsg,
};

pub fn receive_module_ibc(
    _deps: DepsMut,
    _env: Env,
    _module: MyApp,
    _source_module: ModuleIbcInfo,
    msg: Binary,
) -> MyAppResult {
    let _msg: IbcMsg = from_json(&msg)?;
    // do something with received _msg
    Ok(Response::new())
}
