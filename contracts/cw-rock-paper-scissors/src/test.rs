#[cfg(test)]
mod tests {
    use cosmwasm_std::{coins, Addr, Uint128};
    use cw_multi_test::{error::AnyResult, App, ContractWrapper, Executor};
    use sha2::{Sha256, Digest};
    use hex;

    use crate::rock_paper_scissors::{RockPaperScissors, RockPaperScissorsChoices, RockPaperScissorsWinner};

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

    pub struct RockPaperScissorsCodeId(u64);

    impl RockPaperScissorsCodeId {
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
        ) -> AnyResult<RockPaperScissorsContract> {
            RockPaperScissorsContract::instantiate(app, self, sender, label, p2e_contract)
        }
    }

    pub struct RockPaperScissorsContract(Addr);

    impl RockPaperScissorsContract {
        pub fn addr(&self) -> Addr {
            self.0.clone()
        }

        #[allow(clippy::too_many_arguments)]
        #[track_caller]
        pub fn instantiate(
            app: &mut App,
            code_id: RockPaperScissorsCodeId,
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

    impl From<Addr> for RockPaperScissorsContract {
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
    ) -> (P2ETokenContract, RockPaperScissorsContract) {
        let owner = app.api().addr_make(&"owner".to_string());
        let p2e_token_code_id = P2ETokenCodeId::store_code(app);
        let p2e_contract = p2e_token_code_id
            .instantiate(app, owner.clone(), "test", p2e_initial_balances)
            .unwrap();
        let rock_paper_scissors_code_id = RockPaperScissorsCodeId::store_code(app);
        let rock_paper_scissors_contract = rock_paper_scissors_code_id
            .instantiate(app, owner.clone(), "test", &p2e_contract)
            .unwrap();
        // set allowance for the game contract to transfer tokens from the owner to players (for rewards)
        let msg = cw_p2e::msg::ExecuteMsg::AuthorizeRewardsIssuer { address: rock_paper_scissors_contract.addr().to_string() };
        app.execute_contract(owner.clone(), p2e_contract.addr(), &msg, &[]).unwrap();

        (p2e_contract, rock_paper_scissors_contract)
    }

    fn join_game(app: &mut App, game_contract: &RockPaperScissorsContract, p2e_contract: &P2ETokenContract, players: Vec<Addr>) {
        players.iter().for_each(|p| {
            // increase allowance for the game contract
            let msg = cw_p2e::msg::ExecuteMsg::IncreaseAllowance {
                spender: game_contract.addr().to_string(),
                amount: Uint128::new(10_000),
                expires: None,
            };
            app.execute_contract(p.clone(), p2e_contract.addr(), &msg, &[]).unwrap();

            // join the game
            let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
                game_id: 0,
                telegram_id: p.to_string(),
            });
            app.execute_contract(p.clone(), game_contract.addr(), &msg, &[]).unwrap();
        });
    }

    #[test]
    fn rock_paper_scissors_contract_initialization() {
        let mut app = mock_app();
        let owner = app.api().addr_make(&"owner".to_string());
        let p2e_token_code_id = P2ETokenCodeId::store_code(&mut app);
        let p2e_contract = p2e_token_code_id
            .instantiate(&mut app, owner.clone(), "test", None)
            .unwrap();
        let rock_paper_scissors_code_id = RockPaperScissorsCodeId::store_code(&mut app);
        rock_paper_scissors_code_id
            .instantiate(&mut app, owner.clone(), "test", &p2e_contract)
            .unwrap();
    }

    #[test]
    fn rock_paper_scissors_contract_create_game() {
        let mut app = mock_app();
        let (_p2e_contract, rock_paper_scissors_contract) = setup_contracts(&mut app, None);
        let p1 = app.api().addr_make(&"player_1".to_string());

        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config: cw_game_lifecycle::state::GameConfig::default_with_join_fee(Uint128::new(100)),
            });

        app
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        let counter: u64 = app
            .wrap()
            .query_wasm_smart(rock_paper_scissors_contract.addr(), &crate::msg::QueryMsg::GetGamesCount {})
            .unwrap();

        assert_eq!(counter, 1);

        let game: cw_game_lifecycle::state::Game = app
            .wrap()
            .query_wasm_smart(rock_paper_scissors_contract.addr(), &crate::msg::QueryMsg::GetGame { game_id: 0 })
            .unwrap();

        assert_eq!(game.id, 0);
        assert_eq!(game.config.game_joining_fee, Some(Uint128::new(100)));
    }

    #[test]
    fn rock_paper_scissors_contract_join_game_basic() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let (_p2e_contract, rock_paper_scissors_contract) = setup_contracts(
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
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // player 1 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "1234567890".to_string(),
        });
        app
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // player 2 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "0987654321".to_string(),
        });
        app
            .execute_contract(p2.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();
    }

    #[test]
    fn rock_paper_scissors_contract_join_game_with_allowance() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let (p2e_contract, rock_paper_scissors_contract) = setup_contracts(
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
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // player 1 and 2 increase allowance for the game contract to start joining the game
        // and pay the game joining fee
        let msg = cw_p2e::msg::ExecuteMsg::IncreaseAllowance {
            spender: rock_paper_scissors_contract.addr().to_string(),
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
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // player 2 can join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: "0987654321".to_string(),
        });
        app
            .execute_contract(p2.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // check if balances are updated in the P2E contract
        let balance: cw20::BalanceResponse = app.wrap().query_wasm_smart(p2e_contract.addr(), &cw_p2e::msg::QueryMsg::Balance {
            address: p1.to_string(),
        }).unwrap();
        assert_eq!(balance.balance, Uint128::new(99_900));
        let balance: cw20::BalanceResponse = app.wrap().query_wasm_smart(p2e_contract.addr(), &cw_p2e::msg::QueryMsg::Balance {
            address: p2.to_string(),
        }).unwrap();
        assert_eq!(balance.balance, Uint128::new(99_900));
    }

    #[test]
    fn rock_paper_scissors_contract_cannot_join_max_players() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let p3 = app.api().addr_make(&"player_3".to_string());
        let (_p2e_contract, rock_paper_scissors_contract) = setup_contracts(&mut app, None);

        let mut config = cw_game_lifecycle::state::GameConfig::default();
        config.max_players = Some(2);
        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config,
            });

        // player 1 creates the game
        app
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();

        // player 1 can join the game
        vec![p1, p2].iter().for_each(|p| {
            let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
                game_id: 0,
                telegram_id: p.to_string(),
            });
            app.execute_contract(p.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();
        });

        // player 3 cannot join the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::JoinGame {
            game_id: 0,
            telegram_id: p3.to_string(),
        });
        let res = app.execute_contract(p3.clone(), rock_paper_scissors_contract.addr(), &msg, &[]);
        assert!(res.is_err());
    }

    #[test]
    fn rock_paper_scissors_contract_basic_game_flow() {
        let mut app = mock_app();
        let p1 = app.api().addr_make(&"player_1".to_string());
        let p2 = app.api().addr_make(&"player_2".to_string());
        let (p2e_contract, rock_paper_scissors_contract) = setup_contracts(&mut app, None);

        // create the game
        let mut config = cw_game_lifecycle::state::GameConfig::default();
        config.max_players = Some(2);
        config.max_rounds = 1;
        let msg =
            crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CreateGame {
                config,
            });

        // player 1 creates the game
        app
            .execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[])
            .unwrap();
        // 2 players join the game
        join_game(&mut app, &rock_paper_scissors_contract, &p2e_contract, vec![p1.clone(), p2.clone()]);
        
        // player 1 can start the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::StartGame {
            game_id: 0,
        });
        app.execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // prepare value to commit, both players will commit the same value for test simplicity
        let nonce = 123u64;
        let mut rock_hasher = Sha256::new();
        rock_hasher.update("rock".as_bytes());
        rock_hasher.update(nonce.to_be_bytes());
        let rock_hash = hex::encode(rock_hasher.finalize());

        let mut paper_hasher = Sha256::new();
        paper_hasher.update("paper".as_bytes());
        paper_hasher.update(nonce.to_be_bytes());
        let paper_hash = hex::encode(paper_hasher.finalize());

        let mut scissors_hasher = Sha256::new();
        scissors_hasher.update("scissors".as_bytes());
        scissors_hasher.update(nonce.to_be_bytes());
        let scissors_hash = hex::encode(scissors_hasher.finalize());

        // player 1 commits to the round
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CommitRound {
            game_id: 0,
            value: rock_hash.clone(),
            amount: Some(Uint128::new(100)),
        });
        app.execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // player 2 commits to the round
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::CommitRound {
            game_id: 0,
            value: paper_hash.clone(),
            amount: Some(Uint128::new(100)),
        });
        app.execute_contract(p2.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // player 1 reveals the round
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::RevealRound {
            game_id: 0,
            value: "rock".to_string(),
            nonce,
        });
        app.execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // player 2 reveals the round
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::RevealRound {
            game_id: 0,
            value: "paper".to_string(),
            nonce,
        });
        app.execute_contract(p2.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // check game status, since the game has only one round, it should be finished
        let game_status: cw_game_lifecycle::state::GameStatus = app
            .wrap()
            .query_wasm_smart(rock_paper_scissors_contract.addr(), &crate::msg::QueryMsg::GetGameStatus { game_id: 0 })
            .unwrap();
        assert_eq!(game_status, cw_game_lifecycle::state::GameStatus::RoundsFinished);

        // player 1 can end the game
        let msg = crate::msg::ExecuteMsg::Lifecycle(cw_game_lifecycle::msg::ExecuteMsg::EndGame {
            game_id: 0,
        });
        app.execute_contract(p1.clone(), rock_paper_scissors_contract.addr(), &msg, &[]).unwrap();

        // check if the game rewards are distributed by querying the p2e contract
        let balance: cw20::BalanceResponse = app.wrap().query_wasm_smart(p2e_contract.addr(), &cw_p2e::msg::QueryMsg::Balance {
            address: p1.to_string(),
        }).unwrap();
        assert_eq!(balance.balance, Uint128::new(0));
        let balance: cw20::BalanceResponse = app.wrap().query_wasm_smart(p2e_contract.addr(), &cw_p2e::msg::QueryMsg::Balance {
            address: p2.to_string(),
        }).unwrap();
        assert_eq!(balance.balance, Uint128::new(100));
    }

    #[test]
    fn rock_paper_scissors_player_choice_winner_calculation() {
        let choice_a = RockPaperScissorsChoices::Rock;
        let choice_b = RockPaperScissorsChoices::Paper;
        
        let winner = RockPaperScissors::determine_winner(&choice_a, &choice_b);
        assert_eq!(winner, RockPaperScissorsWinner::Player2);

        let choice_a = RockPaperScissorsChoices::Rock;
        let choice_b = RockPaperScissorsChoices::Scissors;
        
        let winner = RockPaperScissors::determine_winner(&choice_a, &choice_b);
        assert_eq!(winner, RockPaperScissorsWinner::Player1);

        let choice_a = RockPaperScissorsChoices::Paper;
        let choice_b = RockPaperScissorsChoices::Rock;
        
        let winner = RockPaperScissors::determine_winner(&choice_a, &choice_b);
        assert_eq!(winner, RockPaperScissorsWinner::Player1);

        let choice_a = RockPaperScissorsChoices::Rock;
        let choice_b = RockPaperScissorsChoices::Rock;
        
        let winner = RockPaperScissors::determine_winner(&choice_a, &choice_b);
        assert_eq!(winner, RockPaperScissorsWinner::Draw);
    }
}
