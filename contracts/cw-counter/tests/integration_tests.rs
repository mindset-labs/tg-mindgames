use cw_counter::{
    interface::CounterContract,
    msg::{ExecuteMsgFns, GetCountResponse, InstantiateMsg, QueryMsg, QueryMsgFns},
    ContractError,
};
// Use prelude to get all the necessary imports
use cw_orch::{anyhow, prelude::*};

use cosmwasm_std::Addr;

// consts for testing
const USER: &str = "user";
const ADMIN: &str = "admin";

#[test]
fn count() -> anyhow::Result<()> {
    // Create a user
    let user = Addr::unchecked(USER);
    let admin = Addr::unchecked(ADMIN);
    // Create the mock. This will be our chain object throughout
    let mock = Mock::new(admin.clone());

    // Set up the contract (Definition below) ↓↓
    let contract = setup(mock.clone())?;

    // Increment the count of the contract
    contract
        // Set the caller to user
        .call_as(&user)
        // Call the increment function (auto-generated function provided by CounterExecuteMsgFns)
        .increment()?;

    // Get the count.
    let count1 = contract.get_count()?;

    // or query it manually
    let count2: GetCountResponse = contract.query(&QueryMsg::GetCount {})?;
    assert_eq!(count1.count, count2.count);

    // Or get it manually from the chain
    let count3: GetCountResponse = mock.query(&QueryMsg::GetCount {}, &contract.address()?)?;
    assert_eq!(count1.count, count3.count);

    // Check the count
    assert_eq!(count1.count, 1);
    // Reset
    contract
        .call_as(&admin)
        .reset(0)?;

    let count = contract.get_count()?;
    assert_eq!(count.count, 0);

    // Check negative case
    let exec_res: Result<cw_orch::mock::cw_multi_test::AppResponse, CwOrchError> =
        contract.call_as(&user).reset(0);

    let expected_err = ContractError::Unauthorized {
        admin: ADMIN.to_string(),
        sender: user.to_string(),
    };

    assert_eq!(
        exec_res.unwrap_err().downcast::<ContractError>()?,
        expected_err
    );

    Ok(())
}

/// Instantiate the contract in any CosmWasm environment
fn setup<Chain: CwEnv>(chain: Chain) -> anyhow::Result<CounterContract<Chain>> {
    // Construct the counter interface
    let contract = CounterContract::new(chain.clone());
    let admin = Addr::unchecked(ADMIN);

    // Upload the contract
    let upload_resp = contract.upload()?;

    // Get the code-id from the response.
    let code_id = upload_resp.uploaded_code_id()?;
    // or get it from the interface.
    assert_eq!(code_id, contract.code_id()?);

    // Instantiate the contract
    let msg = InstantiateMsg {};
    let init_resp = contract.instantiate(&msg, Some(&admin), &[])?;

    // Get the address from the response
    let contract_addr = init_resp.instantiated_contract_address()?;
    // or get it from the interface.
    assert_eq!(contract_addr, contract.address()?);

    // Return the interface
    Ok(contract)
}