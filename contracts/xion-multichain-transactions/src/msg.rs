use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    SendWithinHostChain {
        chain_id: String,
        receiver: String,
        denom: String,
        amount: u128,
    },
    // ... other messages ...
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {}
