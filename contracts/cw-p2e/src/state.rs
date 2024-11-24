use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct StakingConfigs {
    pub reward_per_block: Uint128,
}

#[cw_serde]
#[derive(Default)]
pub struct StakedBalance {
    pub amount: Uint128,
    pub last_reward_claim_block: u64,
}

// Map<Staker Address, (Staked Balance, Last Reward Claim Block)>
pub const STAKED_BALANCES: Map<&Addr, StakedBalance> = Map::new("staked_balances");

// Reward per block
pub const STAKING_CONFIGS: Item<StakingConfigs> = Item::new("staking_configs");

#[cw_serde]
#[derive(Default)]
pub struct LockedBalance {
    pub amount: Uint128,
    pub unlock_time: u64,
}

// Locked Balances
pub const LOCKED_BALANCES: Map<&Addr, LockedBalance> = Map::new("locked_balances");
