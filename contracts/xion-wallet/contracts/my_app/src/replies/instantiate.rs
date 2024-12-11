use crate::contract::{
    MyApp, MyAppResult
};

use abstract_app::traits::AbstractResponse;
use cosmwasm_std::{DepsMut, Env, Reply};

pub fn instantiate_reply(_deps: DepsMut, _env: Env, module: MyApp, _reply: Reply) -> MyAppResult {
    Ok(module.response("instantiate_reply"))
}
