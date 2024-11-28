use cosmwasm_std::{Addr, Deps, Env, StdResult, Uint128};
use cw20_base::state::BALANCES;

use crate::{
    msg::{AvailableBalanceResponse, RewardResponse, StakedBalanceResponse}, 
    state::{StakedBalance, LOCKED_BALANCES, STAKED_BALANCES, STAKING_CONFIGS}
};

pub fn query_staked_balance(deps: &Deps, _env: &Env, address: Addr) -> StdResult<StakedBalanceResponse> {
    let staked_balance = STAKED_BALANCES.may_load(deps.storage, &address)?.unwrap_or_default();
    Ok(StakedBalanceResponse { balance: staked_balance.amount })
}

pub fn query_reward(deps: &Deps, env: &Env, address: Addr) -> StdResult<RewardResponse> {
    let height = env.block.height;
    let staking_configs = STAKING_CONFIGS.load(deps.storage)?;
    let staked_balance = STAKED_BALANCES.may_load(deps.storage, &address)?;

    // TODO: this method of calculating rewards is a placeholder and does not take into account the amount staked
    if let Some(StakedBalance { amount, last_reward_claim_block }) = staked_balance {
        let reward = staking_configs.reward_per_block * Uint128::from(height - last_reward_claim_block);
        Ok(RewardResponse { reward })
    } else {
        Ok(RewardResponse { reward: Uint128::zero() })
    }
}

pub fn query_available_balance(deps: &Deps, _env: &Env, address: Addr) -> StdResult<AvailableBalanceResponse> {
    let total_balance = BALANCES.may_load(deps.storage, &address)?.unwrap_or_default();
    let staked_balance = STAKED_BALANCES.may_load(deps.storage, &address)?.unwrap_or_default();
    let locked_balance = LOCKED_BALANCES.may_load(deps.storage, &address)?.unwrap_or_default();

    Ok(AvailableBalanceResponse {
        balance: total_balance - staked_balance.amount - locked_balance.amount
    })
}