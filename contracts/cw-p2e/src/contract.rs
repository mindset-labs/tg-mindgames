#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw20::MinterResponse;
use cw20_base::msg::QueryMsg as Cw20BaseQueryMsg;
use cw20_base::contract::{
    execute_burn, execute_mint, execute_send, execute_transfer, execute_update_marketing, execute_upload_logo, instantiate as cw20_instantiate, query as cw20_query
};
use cw20_base::allowances::{
    execute_increase_allowance, execute_decrease_allowance,
    execute_transfer_from, execute_burn_from, execute_send_from,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::execute::{execute_authorize_rewards_issuer, execute_claim_rewards, execute_mint_rewards, execute_stake, execute_unlock};
use crate::helpers::check_available_balance;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::query::{query_available_balance, query_reward, query_staked_balance};
use crate::state::{StakingConfigs, STAKING_CONFIGS};

const CONTRACT_NAME: &str = "crates.io:cw20-token-staking";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let minter = env.contract.address.to_string();
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    STAKING_CONFIGS.save(deps.storage, &StakingConfigs { reward_per_block: msg.reward_per_block })?;
    cw20_instantiate(deps, env, info, cw20_base::msg::InstantiateMsg {
        name: msg.name,
        symbol: msg.symbol,
        decimals: msg.decimals,
        initial_balances: msg.initial_balances,
        mint: Some(MinterResponse {
            minter,
            cap: None,
        }),
        marketing: msg.marketing,
    })?;
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    let response = match msg {
        // handled by cw20_base
        ExecuteMsg::Transfer { recipient, amount } => {
            check_available_balance(&deps, &env, &info.sender, amount)?;
            execute_transfer(deps, env, info, recipient, amount)?
        },
        ExecuteMsg::Burn { amount } => {
            check_available_balance(&deps, &env, &info.sender, amount)?;
            execute_burn(deps, env, info, amount)?
        },
        ExecuteMsg::Send { contract, amount, msg } => {
            check_available_balance(&deps, &env, &info.sender, amount)?;
            execute_send(deps, env, info, contract, amount, msg)?
        },
        ExecuteMsg::IncreaseAllowance { spender, amount, expires } => 
            execute_increase_allowance(deps, env, info, spender, amount, expires)?,
        ExecuteMsg::DecreaseAllowance { spender, amount, expires } => 
            execute_decrease_allowance(deps, env, info, spender, amount, expires)?,
        ExecuteMsg::TransferFrom { owner, recipient, amount } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            check_available_balance(&deps, &env, &owner_addr, amount)?;
            execute_transfer_from(deps, env, info, owner, recipient, amount)?
        },
        ExecuteMsg::BurnFrom { owner, amount } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            check_available_balance(&deps, &env, &owner_addr, amount)?;
            execute_burn_from(deps, env, info, owner, amount)?
        },
        ExecuteMsg::SendFrom { owner, contract, amount, msg } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            check_available_balance(&deps, &env, &owner_addr, amount)?;
            execute_send_from(deps, env, info, owner, contract, amount, msg)?
        },
        ExecuteMsg::UpdateMarketing { project, description, marketing } => 
            execute_update_marketing(deps, env, info, project, description, marketing)?,
        ExecuteMsg::UploadLogo(logo) => 
            execute_upload_logo(deps, env, info, logo)?,
        
        // custom messages related to staking
        ExecuteMsg::Stake { amount } => {
            check_available_balance(&deps, &env, &info.sender, amount)?;
            execute_stake(deps, env, info, amount)?
        },
        ExecuteMsg::Unstake { amount } => unimplemented!(),
        ExecuteMsg::ClaimRewards {} => 
            execute_claim_rewards(deps, env, info)?,
        ExecuteMsg::Unlock {} => 
            execute_unlock(deps, env, info)?,
        ExecuteMsg::AuthorizeRewardsIssuer { address } => 
            execute_authorize_rewards_issuer(deps, env, info, address)?,
        ExecuteMsg::MintRewards { amount, recipient } => 
            execute_mint_rewards(deps, env, info, amount, recipient)?,
    };

    Ok(response)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::StakedBalance { address } => 
            to_json_binary(&query_staked_balance(&deps, &env, address)?),
        QueryMsg::Reward { address } => 
            to_json_binary(&query_reward(&deps, &env, address)?),
        QueryMsg::Balance { address } => 
            cw20_query(deps, env, Cw20BaseQueryMsg::Balance { address }),
        QueryMsg::TokenInfo {} => 
            cw20_query(deps, env, Cw20BaseQueryMsg::TokenInfo {}),
        QueryMsg::Allowance { owner, spender } => 
            cw20_query(deps, env, Cw20BaseQueryMsg::Allowance { owner, spender }),
        QueryMsg::Minter {} =>  
            cw20_query(deps, env, Cw20BaseQueryMsg::Minter {}),
        QueryMsg::MarketingInfo {} => 
            cw20_query(deps, env, Cw20BaseQueryMsg::MarketingInfo {}),
        QueryMsg::DownloadLogo {} => 
            cw20_query(deps, env, Cw20BaseQueryMsg::DownloadLogo {}),
        QueryMsg::AllAllowances { owner, start_after, limit } => 
            cw20_query(deps, env, Cw20BaseQueryMsg::AllAllowances { owner, start_after, limit }),
        QueryMsg::AllAccounts { start_after, limit } => 
            cw20_query(deps, env, Cw20BaseQueryMsg::AllAccounts { start_after, limit }),
        QueryMsg::AvailableBalance { address } => 
            to_json_binary(&query_available_balance(&deps, &env, address)?),
    }
}

#[cfg(test)]
mod tests {
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coin, coins, from_json, Addr, Uint128};
    use cw20::Cw20Coin;
    use cw20_base::state::TokenInfo;
    use cw_multi_test::{App, AppResponse, Contract, ContractWrapper, Executor};
    use crate::msg::{AvailableBalanceResponse, ExecuteMsg, InstantiateMsg, QueryMsg, RewardResponse, StakedBalanceResponse};
    use crate::ContractError;

    fn mock_app() -> App {
        App::new(|router, _api, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked("owner"),
                    coins(1_000_000, "utoken"),
                )
                .unwrap();
        })
    }

    fn do_instantiate(initial_balances: Option<Vec<Cw20Coin>>, initial_supply: Option<Uint128>) -> (App, Addr) {
        let mut app = mock_app();

        let owner = app.api().addr_make(&"owner".to_string());
        let cw20_id = app.store_code(contract_cw20());
        let initial_supply = initial_supply.unwrap_or(Uint128::from(1_000_000u128));
        let initial_balances = initial_balances.unwrap_or(vec![
            Cw20Coin {
                address: owner.to_string(),
                amount: initial_supply,
            }
        ]);

        let msg = InstantiateMsg {
            name: "Test Token".to_string(),
            symbol: "TEST".to_string(),
            decimals: 6,
            initial_supply,
            initial_balances,
            reward_per_block: Uint128::new(100),
            mint: None,
            marketing: None,
        };

        let addr = app
            .instantiate_contract(cw20_id, owner, &msg, &[], "test", None)
            .unwrap();

        (app, addr)
    }

    fn contract_cw20() -> Box<dyn Contract<cosmwasm_std::Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    #[test]
    fn basic_initialization() {
        let mut app = mock_app();

        let owner = app.api().addr_make(&"owner".to_string());
        let cw20_id = app.store_code(contract_cw20());

        let msg = InstantiateMsg {
            name: "Test Token".to_string(),
            symbol: "TEST".to_string(),
            decimals: 6,
            initial_supply: Uint128::from(1_000_000u128),
            initial_balances: vec![
                Cw20Coin {
                    address: owner.to_string(),
                    amount: Uint128::from(1_000_000u128),
                }
            ],
            reward_per_block: Uint128::new(100),
            mint: None,
            marketing: None,
        };

        let addr = app
            .instantiate_contract(cw20_id, owner, &msg, &[], "test", None)
            .unwrap();

        let token_info: TokenInfo = app
            .wrap()
            .query_wasm_smart(&addr, &QueryMsg::TokenInfo {})
            .unwrap();

        assert_eq!(token_info.name, "Test Token");
        assert_eq!(token_info.symbol, "TEST");
        assert_eq!(token_info.decimals, 6);
        assert_eq!(token_info.total_supply, Uint128::from(1_000_000u128));
    }

    #[test]
    fn test_transfer() {
        let (mut app, contract_addr) = do_instantiate(None, None);
        let owner = app.api().addr_make(&"owner".to_string());
        let receiver = app.api().addr_make(&"receiver".to_string());

        let transfer_msg = ExecuteMsg::Transfer {
            recipient: receiver.to_string(),
            amount: Uint128::from(100_000u128),
        };

        app.execute_contract(owner.clone(), contract_addr.clone(), &transfer_msg, &[])
            .unwrap();

        let balance: cw20::BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                &contract_addr,
                &QueryMsg::Balance {
                    address: receiver.to_string(),
                },
            )
            .unwrap();

        assert_eq!(balance.balance, Uint128::from(100_000u128));

        let balance: cw20::BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                &contract_addr,
                &QueryMsg::Balance {
                    address: owner.to_string(),
                },
            )
            .unwrap();

        assert_eq!(balance.balance, Uint128::from(900_000u128));
    }

    #[test]
    fn test_stake() {
        let (mut app, addr) = do_instantiate(None, None);
        let owner = app.api().addr_make(&"owner".to_string());

        // Stake tokens
        let stake_msg = ExecuteMsg::Stake {
            amount: Uint128::new(100_000),
        };

        app.execute_contract(owner.clone(), addr.clone(), &stake_msg, &[])
            .unwrap();

        // Simulate passage of time (10 blocks)
        app.update_block(|b| {
            b.height += 10;
            b.time = b.time.plus_seconds(50);
        });

        let available_balance: AvailableBalanceResponse = app
            .wrap()
            .query_wasm_smart(
                &addr,
                &QueryMsg::AvailableBalance { address: owner.clone() },
            )
            .unwrap();

        assert_eq!(available_balance.balance, Uint128::new(900_000));

        let staked_balance: StakedBalanceResponse = app
            .wrap()
            .query_wasm_smart(
                &addr,
                &QueryMsg::StakedBalance { address: owner.clone() },
            )
            .unwrap();

        assert_eq!(staked_balance.balance, Uint128::new(100_000));
    }

    #[test]
    fn test_stake_locks_balance() {
        let (mut app, addr) = do_instantiate(None, None);
        let owner = app.api().addr_make(&"owner".to_string());

        // Stake tokens
        let stake_msg = ExecuteMsg::Stake {
            amount: Uint128::new(100_000),
        };

        app.execute_contract(owner.clone(), addr.clone(), &stake_msg, &[])
            .unwrap();

        let transfer_msg = ExecuteMsg::Transfer {
            recipient: owner.to_string(),
            amount: Uint128::new(1_000_000),
        };

        let result = app.execute_contract(
            owner.clone(), addr.clone(), &transfer_msg, &[]
        );

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().root_cause().to_string(),
            ContractError::InsufficientFunds { available: Uint128::new(900_000) }.to_string()
        );
    }

    #[test]
    fn test_stake_and_calculate_rewards() {
        let (mut app, addr) = do_instantiate(None, None);
        let owner = app.api().addr_make(&"owner".to_string());

        // Stake tokens
        let stake_msg = ExecuteMsg::Stake {
            amount: Uint128::new(100_000),
        };

        app.execute_contract(owner.clone(), addr.clone(), &stake_msg, &[])
            .unwrap();

        // Simulate passage of time (10 blocks)
        app.update_block(|b| {
            b.height += 10;
            b.time = b.time.plus_seconds(50);
        });

        let reward_response: RewardResponse = app
            .wrap()
            .query_wasm_smart(
                &addr,
                &QueryMsg::Reward { address: owner.clone() },
            )
            .unwrap();

        assert_eq!(reward_response.reward, Uint128::new(1_000));
    }
}

