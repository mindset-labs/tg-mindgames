use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Binary, Uint128};
use cw20::{
    AllAccountsResponse, AllAllowancesResponse, AllowanceResponse, BalanceResponse,
    Cw20Coin, DownloadLogoResponse, Expiration, Logo,
    MarketingInfoResponse, MinterResponse, TokenInfoResponse
};
use cw20_base::msg::InstantiateMarketingInfo;

#[cw_serde]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub initial_supply: Uint128,
    pub initial_balances: Vec<Cw20Coin>,
    pub reward_per_block: Uint128,
    pub mint: Option<MinterResponse>,
    pub marketing: Option<InstantiateMarketingInfo>,
}

#[cw_serde]
pub enum ExecuteMsg {
    // base cw20
    Transfer { recipient: String, amount: Uint128 },
    Burn { amount: Uint128 },
    Send { contract: String, amount: Uint128, msg: Binary },
    IncreaseAllowance { spender: String, amount: Uint128, expires: Option<Expiration> },
    DecreaseAllowance { spender: String, amount: Uint128, expires: Option<Expiration> },
    TransferFrom { owner: String, recipient: String, amount: Uint128 },
    BurnFrom { owner: String, amount: Uint128 },
    SendFrom { owner: String, contract: String, amount: Uint128, msg: Binary },
    UpdateMarketing {
        project: Option<String>,
        description: Option<String>,
        marketing: Option<String>,
    },
    UploadLogo(Logo),
    // staking
    Stake { amount: Uint128 },
    Unstake { amount: Uint128 },
    ClaimRewards {},
    Unlock {},
    AuthorizeRewardsIssuer { address: String },
    MintRewards { amount: Uint128, recipient: String },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    // // base cw20
    #[returns(BalanceResponse)]
    Balance { address: String },
    #[returns(TokenInfoResponse)]
    TokenInfo {},
    #[returns(AllowanceResponse)]
    Allowance { owner: String, spender: String },
    #[returns(MinterResponse)]
    Minter {},
    #[returns(MarketingInfoResponse)]
    MarketingInfo {},
    #[returns(DownloadLogoResponse)]
    DownloadLogo {},
    #[returns(AllAllowancesResponse)]
    AllAllowances {
        owner: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
    #[returns(AllAccountsResponse)]
    AllAccounts {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    // staking
    #[returns(StakedBalanceResponse)]
    StakedBalance { address: Addr },
    #[returns(RewardResponse)]
    Reward { address: Addr },
    #[returns(AvailableBalanceResponse)]
    AvailableBalance { address: Addr },
}

#[cw_serde]
pub struct StakedBalanceResponse {
    pub balance: Uint128,
}

#[cw_serde]
pub struct RewardResponse {
    pub reward: Uint128,
}

#[cw_serde]
pub struct AvailableBalanceResponse {
    pub balance: Uint128,
}
