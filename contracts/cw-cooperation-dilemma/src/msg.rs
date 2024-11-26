use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;
use cw_game_lifecycle::msg::{
    ExecuteMsg as LifecycleExecuteMsg, InstantiateMsg as LifecycleInstantiateMsg,
    QueryMsg as LifecycleQueryMsg,
};

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
pub enum ExecuteMsg {
    Lifecycle(LifecycleExecuteMsg),
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(cw_game_lifecycle::state::Game)]
    GetGame { game_id: u64 },
    #[returns(Vec<(Addr, String, u64)>)]
    GetLeaderboard {},
    #[returns(u8)]
    GetCurrentRound { game_id: u64 },
    #[returns(cw_game_lifecycle::state::GameStatus)]
    GetGameStatus { game_id: u64 },
    #[returns(u64)]
    GetGamesCount {},
}

// Even though the query messages are the same, we need to implement this because the
// the return types cannot be inherited easily and therefore each query must be specified
// independently. While this is not a perfect solution, it is a simple one.
impl From<QueryMsg> for LifecycleQueryMsg {
    fn from(msg: QueryMsg) -> Self {
        match msg {
            QueryMsg::GetGame { game_id } => LifecycleQueryMsg::GetGame { game_id },
            QueryMsg::GetLeaderboard {} => LifecycleQueryMsg::GetLeaderboard {},
            QueryMsg::GetCurrentRound { game_id } => LifecycleQueryMsg::GetCurrentRound { game_id },
            QueryMsg::GetGameStatus { game_id } => LifecycleQueryMsg::GetGameStatus { game_id },
            QueryMsg::GetGamesCount {} => LifecycleQueryMsg::GetGamesCount {},
        }
    }
}

#[cw_serde]
pub struct MigrateMsg {}
