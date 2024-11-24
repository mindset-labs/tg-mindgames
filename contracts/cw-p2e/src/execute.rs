use cosmwasm_std::{attr, DepsMut, Env, MessageInfo, Response, Uint128};
use cw20_base::{contract::execute_mint, state::BALANCES};

use crate::{query::query_reward, state::{StakedBalance, STAKED_BALANCES}, ContractError};

pub fn execute_stake(deps: DepsMut, env: Env, info: MessageInfo, amount: Uint128) -> Result<Response, ContractError> {
    BALANCES.update(deps.storage, &info.sender, |balance| -> Result<Uint128, ContractError> {
        match balance {
            Some(bal) => {
                bal.checked_sub(amount)
                    .map_err(|_| ContractError::InsufficientFunds { available: bal })?;
                Ok(bal)
            },
            None => Err(ContractError::InsufficientFunds { available: Uint128::zero() }),
        }
    })?;

    let total_staked = STAKED_BALANCES.update(deps.storage, &info.sender, |staked_balance| -> Result<StakedBalance, ContractError> {
        let new_staked_balance = staked_balance
            .unwrap_or_default()
            .amount
            .checked_add(amount)
            .map_err(|_| ContractError::Overflow {})?;
        
        Ok(StakedBalance { amount: new_staked_balance, last_reward_claim_block: env.block.height })
    })?;

    let claim_response = execute_claim_rewards(deps, env, info)?;

    Ok(claim_response.add_attributes(vec![
        attr("action", "stake"),
        attr("amount", amount),
        attr("total_staked", total_staked.amount),
    ]))
}

pub fn execute_unstake(_deps: DepsMut, _env: Env, _info: MessageInfo, _amount: Uint128) -> Result<Response, ContractError> {
    unimplemented!()
}

pub fn execute_claim_rewards(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    let reward_response = query_reward(&deps.as_ref(), &env, info.sender.clone())?;
    if reward_response.reward.is_zero() {
        return Ok(Response::new().add_attributes(vec![
            attr("action", "claim_rewards"),
            attr("claim_amount", Uint128::zero()),
        ]));
    }

    let mint_msg = MessageInfo { sender: env.contract.address.clone(), funds: vec![] };
    execute_mint(deps, env, mint_msg, info.sender.to_string(), reward_response.reward)?;
    
    Ok(Response::new().add_attributes(vec![
        attr("action", "claim_rewards"),
        attr("claim_amount", reward_response.reward),
    ]))
}

pub fn execute_unlock(_deps: DepsMut, _env: Env, _info: MessageInfo) -> Result<Response, ContractError> {
    unimplemented!()
}