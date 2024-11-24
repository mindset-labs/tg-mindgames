use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;
use cw_game_lifecycle::msg::InstantiateMsg as LifecycleInstantiateMsg;

#[cw_serde]
pub struct InstantiateMsg {
    pub base_url: String,
    pub image_url: String,
    pub token_contract: Addr,
}

impl From<InstantiateMsg> for LifecycleInstantiateMsg {
    fn from(msg: InstantiateMsg) -> Self {
        LifecycleInstantiateMsg {
            base_url: msg.base_url,
            image_url: msg.image_url,
            token_contract: msg.token_contract,
        }
    }
}

#[cw_serde]
pub enum ExecuteMsg {}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {}

#[cw_serde]
pub struct MigrateMsg {}
