use cw_orch::prelude::*;
use cw_orch::{ExecuteFns, QueryFns};

use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
#[derive(ExecuteFns)]
pub enum ExecuteMsg {
    Increment {},
    Reset { count: u64 },
}

#[cw_serde]
pub struct GetCountResponse {
    pub count: u64,
}

#[cw_serde]
#[derive(QueryFns, QueryResponses)]
pub enum QueryMsg {
    #[returns(GetCountResponse)]
    GetCount {},
}

#[cw_serde]
pub enum MigrateMsg {}
