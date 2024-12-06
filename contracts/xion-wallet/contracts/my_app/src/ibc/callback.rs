use abstract_app::{
    sdk::AbstractResponse,
    std::ibc::{Callback, IbcResult},
};
use cosmwasm_std::{DepsMut, Env};

use crate::contract::{
    MyApp, MyAppResult
};

pub fn ibc_callback(
    _deps: DepsMut,
    _env: Env,
    module: MyApp,
    _callback: Callback,
    _result: IbcResult,
) -> MyAppResult {
    Ok(module.response("callback"))
}