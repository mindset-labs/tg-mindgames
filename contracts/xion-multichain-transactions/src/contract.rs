#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
// use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

use anybuf::Anybuf;
use bech32::FromBase32;
use bech32::{self, ToBase32};
use cosmwasm_std::CosmosMsg::Stargate;
use sha2::{Digest, Sha256};

/*
// version info for migration info
const CONTRACT_NAME: &str = "crates.io:xion-multichain-transactions";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
*/

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::SendWithinHostChain {
            chain_id,
            receiver,
            denom,
            amount,
        } => send_within_host_chain(deps, env, info, chain_id, receiver, denom, amount), // ... other message handlers ...
    }
}

/// Handles the transfer of tokens within the host chain using IBC hooks
pub fn send_within_host_chain(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    chain_id: String,
    receiver: String,
    denom: String,
    amount: u128,
) -> Result<Response, ContractError> {
    // Derive the receiving chain address based on chain ID
    let receiving_chain_address = derive_chain_address(chain_id, &info)?;

    // Create IBC hooks message for token transfer
    let msg = Stargate {
        type_url: "/ibc.applications.transfer.v1.MsgTransfer".to_string(),
        value: Anybuf::new()
            .append_string(1, "transfer")
            .append_string(2, receiving_chain_address.channel)
            .append_message(
                3,
                &Anybuf::new()
                    .append_string(1, denom)
                    .append_string(2, amount.to_string()),
            )
            .append_string(4, env.contract.address.to_string())
            .append_string(5, receiver.clone())
            .append_message(6, &Anybuf::new().append_uint64(1, 0).append_uint64(2, 0))
            .append_uint64(7, env.block.time.plus_seconds(3600).nanos())
            .append_string(8, "") // empty memo
            .into_vec()
            .into(),
    };

    // Create response with IBC message
    Ok(Response::new()
        .add_message(msg)
        .add_attribute("action", "send_within_host_chain")
        .add_attribute("sender", info.sender)
        .add_attribute("receiver", receiver.clone())
        .add_attribute("amount", amount.to_string()))
}

/// Derives the corresponding address on a target chain from a Xion address
fn derive_chain_address(
    chain_id: String,
    info: &MessageInfo,
) -> Result<ChainAddress, ContractError> {
    // Get the HRP (Human Readable Part) prefix for the target chain
    let (prefix, channel) = match chain_id.as_str() {
        "osmosis-1" => ("osmo", "channel-490"),
        "cosmoshub-4" => ("cosmos", "channel-1"),
        // Add more chains as needed
        _ => return Err(ContractError::UnsupportedChain { chain_id }),
    };

    // Get the public key bytes from the sender's address
    // This assumes the address is a valid bech32 address
    let (_, sender_pubkey, variant) =
        bech32::decode(&info.sender.to_string()).map_err(|_| ContractError::InvalidAddress {
            address: info.sender.to_string(),
        })?;

    // Convert back to bytes
    let sender_bytes =
        Vec::<u8>::from_base32(&sender_pubkey).map_err(|_| ContractError::InvalidAddress {
            address: info.sender.to_string(),
        })?;

    // Create the new address with the target chain's prefix
    let new_address = bech32::encode(prefix, sender_bytes.to_base32(), variant)
        .map_err(|_| ContractError::AddressDerivationError)?;

    Ok(ChainAddress {
        address: new_address,
        prefix: prefix.to_string(),
        channel: channel.to_string(),
    })
}

// Add this struct to hold chain address information
#[derive(Debug)]
struct ChainAddress {
    address: String,
    prefix: String,
    channel: String,
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, _msg: QueryMsg) -> StdResult<Binary> {
    unimplemented!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::StdError;

    #[test]
    fn test_derive_chain_address() {
        // Test cases with different source addresses and target chains
        let test_cases = vec![(
            "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr",
            "osmosis-1",
            "osmo1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqku8nx7",
        )];

        for (source_address, chain_id, expected_address) in test_cases {
            let info = mock_info(source_address, &[]);
            let result = derive_chain_address(chain_id.to_string(), &info);

            match result {
                Ok(chain_address) => {
                    assert_eq!(
                        chain_address.address, expected_address,
                        "Derived address doesn't match expected for chain {}",
                        chain_id
                    );
                }
                Err(e) => panic!("Failed to derive address for chain {}: {:?}", chain_id, e),
            }
        }
    }

    #[test]
    fn test_derive_chain_address_invalid_chain() {
        let info = mock_info("xion1w6vm4peace0f5z6q0am9zqz7xqrv5jyepars9g", &[]);
        let result = derive_chain_address("invalid-chain".to_string(), &info);

        assert!(matches!(
            result,
            Err(ContractError::UnsupportedChain { chain_id }) if chain_id == "invalid-chain"
        ));
    }

    #[test]
    fn test_derive_chain_address_invalid_address() {
        let info = mock_info("invalid-address", &[]);
        let result = derive_chain_address("osmosis-1".to_string(), &info);

        assert!(matches!(
            result,
            Err(ContractError::InvalidAddress { address }) if address == "invalid-address"
        ));
    }

    #[test]
    fn test_send_within_host_chain() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let sender = "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr";
        let info = mock_info(sender, &[]);

        let result = send_within_host_chain(
            deps.as_mut(),
            env,
            info,
            "osmosis-1".to_string(),
            "osmo1receiver".to_string(),
            "uxion".to_string(),
            1000u128,
        );

        // Check if the execution was successful
        assert!(result.is_ok());

        let response = result.unwrap();

        // Verify the message attributes
        assert_eq!(response.attributes.len(), 4);
        assert_eq!(response.attributes[0].key, "action");
        assert_eq!(response.attributes[0].value, "send_within_host_chain");
        assert_eq!(response.attributes[1].key, "sender");
        assert_eq!(response.attributes[1].value, sender);
        assert_eq!(response.attributes[2].key, "receiver");
        assert_eq!(response.attributes[2].value, "osmo1receiver");
        assert_eq!(response.attributes[3].key, "amount");
        assert_eq!(response.attributes[3].value, "1000");

        // Verify that a Stargate message was created
        assert_eq!(response.messages.len(), 1);
        match &response.messages[0].msg {
            Stargate { type_url, .. } => {
                assert_eq!(type_url, "/ibc.applications.transfer.v1.MsgTransfer");
            }
            _ => panic!("Expected Stargate message"),
        }
    }
}
