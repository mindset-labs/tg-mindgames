#[cfg(test)]
mod tests {
    use cosmwasm_std::{coins, Addr, Uint128};
    use cw_multi_test::{error::AnyResult, App, ContractWrapper, Executor};

    ///
    /// A wrapper around the code ID of the P2E token contract
    ///
    pub struct P2ETokenCodeId(u64);

    impl P2ETokenCodeId {
        pub fn store_code(app: &mut App) -> Self {
            let contract = ContractWrapper::new(
                cw_p2e::contract::execute,
                cw_p2e::contract::instantiate,
                cw_p2e::contract::query,
            ); // .with_reply(cw_p2e::contract::reply);
            let code_id = app.store_code(Box::new(contract));
            Self(code_id)
        }

        #[allow(clippy::too_many_arguments)]
        pub fn instantiate(
            self,
            app: &mut App,
            sender: Addr,
            label: &str,
            initial_balances: Option<Vec<cw20::Cw20Coin>>,
        ) -> AnyResult<P2ETokenContract> {
            P2ETokenContract::instantiate(app, self, sender, label, initial_balances.unwrap_or(vec![]))
        }
    }

    pub struct P2ETokenContract(Addr);

    impl P2ETokenContract {
        pub fn addr(&self) -> Addr {
            self.0.clone()
        }

        #[allow(clippy::too_many_arguments)]
        #[track_caller]
        pub fn instantiate(
            app: &mut App,
            code_id: P2ETokenCodeId,
            sender: Addr,
            label: &str,
            initial_balances: Vec<cw20::Cw20Coin>,
        ) -> AnyResult<Self> {
            let init_msg = cw_p2e::msg::InstantiateMsg {
                name: "glitch".to_string(),
                symbol: "glitch".to_string(),
                decimals: 18,
                initial_supply: Uint128::new(1_000_000),
                initial_balances,
                reward_per_block: Uint128::new(1000),
                mint: None,
                marketing: None,
            };
            app.instantiate_contract(code_id.0, sender, &init_msg, &[], label, None)
                .map(Self::from)
        }
    }

    impl From<Addr> for P2ETokenContract {
        fn from(value: Addr) -> Self {
            Self(value)
        }
    }

    pub struct CooperationGameCodeId(u64);

    impl CooperationGameCodeId {
        pub fn store_code(app: &mut App) -> Self {
            let code_id = app.store_code(Box::new(ContractWrapper::new(
                crate::contract::execute,
                crate::contract::instantiate,
                crate::contract::query,
            )));
            Self(code_id)
        }

        #[allow(clippy::too_many_arguments)]
        pub fn instantiate(
            self,
            app: &mut App,
            sender: Addr,
            label: &str,
            p2e_contract: &P2ETokenContract,
        ) -> AnyResult<CooperationGameContract> {
            CooperationGameContract::instantiate(app, self, sender, label, p2e_contract)
        }
    }

    pub struct CooperationGameContract(Addr);

    impl CooperationGameContract {
        pub fn addr(&self) -> Addr {
            self.0.clone()
        }

        #[allow(clippy::too_many_arguments)]
        #[track_caller]
        pub fn instantiate(
            app: &mut App,
            code_id: CooperationGameCodeId,
            sender: Addr,
            label: &str,
            p2e_contract: &P2ETokenContract,
        ) -> AnyResult<Self> {
            let init_msg = crate::msg::InstantiateMsg {
                base_url: "https://example.com".to_string(),
                image_url: "https://example.com/image.png".to_string(),
                token_contract: p2e_contract.addr(),
            };
            app.instantiate_contract(code_id.0, sender, &init_msg, &[], label, None)
                .map(Self::from)
        }
    }

    impl From<Addr> for CooperationGameContract {
        fn from(value: Addr) -> Self {
            Self(value)
        }
    }

    ///
    /// Mock app
    ///
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

    fn setup_contracts(
        app: &mut App,
        p2e_initial_balances: Option<Vec<cw20::Cw20Coin>>,
    ) -> (P2ETokenContract, CooperationGameContract) {
        let owner = app.api().addr_make(&"owner".to_string());
        let p2e_token_code_id = P2ETokenCodeId::store_code(app);
        let p2e_contract = p2e_token_code_id
            .instantiate(app, owner.clone(), "test", p2e_initial_balances)
            .unwrap();
        let cooperation_game_code_id = CooperationGameCodeId::store_code(app);
        let cooperation_game_contract = cooperation_game_code_id
            .instantiate(app, owner.clone(), "test", &p2e_contract)
            .unwrap();
        (p2e_contract, cooperation_game_contract)
    }

    #[test]
    fn dilemma_contract_initialization() {
        let mut app = mock_app();
        let owner = app.api().addr_make(&"owner".to_string());
        let p2e_token_code_id = P2ETokenCodeId::store_code(&mut app);
        let p2e_contract = p2e_token_code_id
            .instantiate(&mut app, owner.clone(), "test", None)
            .unwrap();
        let cooperation_game_code_id = CooperationGameCodeId::store_code(&mut app);
        cooperation_game_code_id
            .instantiate(&mut app, owner.clone(), "test", &p2e_contract)
            .unwrap();
    }

    #[test]
    fn dilemma_contract_create_game() {
        let mut app = mock_app();
        let (_p2e_contract, cooperation_game_contract) = setup_contracts(&mut app, None);
        let p1 = app.api().addr_make(&"player_1".to_string());

        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config: cw_game_lifecycle::state::GameConfig::default_with_join_fee(Uint128::new(100)),
            });

        app
            .execute_contract(p1.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();

        let counter: u64 = app
            .wrap()
            .query_wasm_smart(cooperation_game_contract.addr(), &crate::msg::QueryMsg::GetGamesCount {})
            .unwrap();

        assert_eq!(counter, 1);

        let game: cw_game_lifecycle::state::Game = app
            .wrap()
            .query_wasm_smart(cooperation_game_contract.addr(), &crate::msg::QueryMsg::GetGame { game_id: 0 })
            .unwrap();

        assert_eq!(game.id, 0);
        assert_eq!(game.config.game_joining_fee, Some(Uint128::new(100)));
    }

    #[test]
    fn dilemma_contract_join_game_basic() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let (_p2e_contract, cooperation_game_contract) = setup_contracts(
            &mut app,
            Some(vec![
                cw20::Cw20Coin {
                    address: p1.to_string(),
                    amount: Uint128::new(100_000),
                },
                cw20::Cw20Coin {
                    address: p2.to_string(),
                    amount: Uint128::new(100_000),
                }
            ]),
        );

        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config: cw_game_lifecycle::state::GameConfig::default(),
            });

        // player 1 creates the game
        app
            .execute_contract(p1.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();

        // player 1 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "1234567890".to_string(),
        });
        app
            .execute_contract(p1.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();

        // player 2 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "0987654321".to_string(),
        });
        app
            .execute_contract(p2.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();
    }

    #[test]
    fn dilemma_contract_join_game_with_allowance() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let (p2e_contract, cooperation_game_contract) = setup_contracts(
            &mut app,
            Some(vec![
                cw20::Cw20Coin {
                    address: p1.to_string(),
                    amount: Uint128::new(100_000),
                },
                cw20::Cw20Coin {
                    address: p2.to_string(),
                    amount: Uint128::new(100_000),
                }
            ]),
        );

        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config: cw_game_lifecycle::state::GameConfig::default_with_join_fee(Uint128::new(100)),
            });

        // player 1 creates the game
        app
            .execute_contract(p1.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();

        // player 1 and 2 increase allowance for the game contract to start joining the game
        // and pay the game joining fee
        let msg = cw_p2e::msg::ExecuteMsg::IncreaseAllowance {
            spender: cooperation_game_contract.addr().to_string(),
            amount: Uint128::new(1_000),
            expires: None,
        };
        app.execute_contract(p1.clone(), p2e_contract.addr(), &msg, &[]).unwrap();
        app.execute_contract(p2.clone(), p2e_contract.addr(), &msg, &[]).unwrap();

        // player 1 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "1234567890".to_string(),
        });
        app
            .execute_contract(p1.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();

        // player 2 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "0987654321".to_string(),
        });
        app
            .execute_contract(p2.clone(), cooperation_game_contract.addr(), &msg, &[])
            .unwrap();
    }
}
