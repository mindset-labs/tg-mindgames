use my_adapter::{
    contract::interface::MyAdapterInterface,
    msg::{ConfigResponse, ExecuteMsg, MyAdapterInstantiateMsg, MyAdapterQueryMsgFns},
    MyAdapterExecuteMsg, MY_ADAPTER_ID, XION_WALLET_NAMESPACE,
};

use abstract_adapter::std::{adapter::AdapterRequestMsg, objects::namespace::Namespace};
use abstract_client::{AbstractClient, Application, Publisher};
use cosmwasm_std::coins;
// Use prelude to get all the necessary imports
use cw_orch::{anyhow, prelude::*};

struct TestEnv<Env: CwEnv> {
    publisher: Publisher<Env>,
    abs: AbstractClient<Env>,
    adapter: Application<Env, MyAdapterInterface<Env>>,
}

impl TestEnv<MockBech32> {
    /// Set up the test environment with an Account that has the Adapter installed
    #[allow(clippy::type_complexity)]
    fn setup() -> anyhow::Result<TestEnv<MockBech32>> {
        // Create a sender and mock env
        let mock = MockBech32::new("mock");
        let sender = mock.sender_addr();
        let namespace = Namespace::new(XION_WALLET_NAMESPACE)?;

        // You can set up Abstract with a builder.
        let abs_client = AbstractClient::builder(mock).build_mock()?;
        // The adapter supports setting balances for addresses and configuring ANS.
        abs_client.set_balance(&sender, &coins(123, "ucosm"))?;

        // Publish the adapter
        let publisher = abs_client
            .account_builder()
            .namespace(namespace)
            .build()?
            .publisher()?;
        publisher.publish_adapter::<MyAdapterInstantiateMsg, MyAdapterInterface<_>>(
            MyAdapterInstantiateMsg {},
        )?;

        let adapter = publisher
            .account()
            .install_adapter::<MyAdapterInterface<_>>(&[])?;

        Ok(TestEnv {
            abs: abs_client,
            publisher,
            adapter,
        })
    }
}

#[test]
fn successful_install() -> anyhow::Result<()> {
    let env = TestEnv::setup()?;
    let adapter = env.adapter;

    let config = adapter.config()?;
    assert_eq!(config, ConfigResponse {});
    Ok(())
}

#[test]
fn update_config() -> anyhow::Result<()> {
    let env = TestEnv::setup()?;
    let adapter = env.adapter;

    // Executing it on publisher account
    // Note that it's not a requirement to have it installed in this case
    let publisher_account = env
        .abs
        .fetch_account(Namespace::new(XION_WALLET_NAMESPACE).unwrap())?
        .publisher()?;

    adapter.execute(
        &AdapterRequestMsg {
            account_address: Some(publisher_account.account().address()?.to_string()),
            request: MyAdapterExecuteMsg::UpdateConfig {},
        }
        .into(),
        &[],
    )?;

    let config = adapter.config()?;
    let expected_response = my_adapter::msg::ConfigResponse {};
    assert_eq!(config, expected_response);
    Ok(())
}

#[test]
fn set_status() -> anyhow::Result<()> {
    let env = TestEnv::setup()?;
    let adapter = env.adapter;

    let first_status = "my_status".to_owned();
    let second_status = "my_second_status".to_owned();

    let account = &env.publisher.account();

    account.as_ref().execute_on_module(
        MY_ADAPTER_ID,
        ExecuteMsg::Module(AdapterRequestMsg {
            account_address: Some(account.address()?.to_string()),
            request: MyAdapterExecuteMsg::SetStatus {
                status: first_status.clone(),
            },
        }),
        vec![]
    )?;

    let new_account = env
        .abs
        .account_builder()
        .install_adapter::<MyAdapterInterface<MockBech32>>()
        .build()?;

    new_account.as_ref().execute_on_module(
        MY_ADAPTER_ID,
        ExecuteMsg::Module(AdapterRequestMsg {
            account_address: Some(new_account.address()?.to_string()),
            request: MyAdapterExecuteMsg::SetStatus {
                status: second_status.clone(),
            },
        }),
        vec![]
    )?;

    let status_response = adapter.status(adapter.account().id()?)?;
    assert_eq!(status_response.status, Some(first_status));

    let status_response = adapter.status(new_account.id()?)?;
    assert_eq!(status_response.status, Some(second_status));

    Ok(())
}