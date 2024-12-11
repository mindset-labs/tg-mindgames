use std::{collections::HashMap};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_game_lifecycle::{lifecycle::GameLifecycle, state::Game, ContractError as LifecycleError};

use crate::ContractError;

#[cw_serde]
pub struct TradeGainsChoice(u8);

impl TryFrom<String> for TradeGainsChoice {
    type Error = ContractError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let choice = value.parse::<u8>().map_err(|_| ContractError::InvalidChoice {
            choice: value,
        })?;
        Ok(TradeGainsChoice(choice))
    }
}

#[cw_serde]
pub struct TradeGains;

impl GameLifecycle for TradeGains {
    fn is_valid_reveal_choice(value: &String) -> bool {
        // 0-10 is valid
        let choice = TradeGainsChoice::try_from(value.to_string());
        choice.is_ok() && choice.unwrap().0 <= 10
    }

    fn calculate_rewards_and_winners(
        game: &mut Game,
    ) -> Result<bool, LifecycleError> {
        let mut winnings: HashMap<Addr, Uint128> = HashMap::from([
            (game.players[0].0.clone(), Uint128::zero()),
            (game.players[1].0.clone(), Uint128::zero()),
        ]);

        game.rounds.iter().for_each(|round| {
            let reveals = round.reveals.as_slice();
            
            match (reveals.get(0), reveals.get(1)) {
                (Some(p1_reveal), Some(p2_reveal)) => {
                    let p1_choice = TradeGainsChoice::try_from(p1_reveal.1.clone()).unwrap();
                    let p2_choice = TradeGainsChoice::try_from(p2_reveal.1.clone()).unwrap();

                    if p1_choice.0 + p2_choice.0 > 10 {
                        return;
                    }

                    // rewards are 10x the selected amount
                    let p1_reward = Uint128::from(p1_choice.0) * Uint128::from(10u128);
                    let p2_reward = Uint128::from(p2_choice.0) * Uint128::from(10u128);

                    winnings.insert(reveals[0].0.clone(), winnings.get(&p1_reveal.0).unwrap() + p1_reward);
                    winnings.insert(reveals[1].0.clone(), winnings.get(&p2_reveal.0).unwrap() + p2_reward);
                }
                // p1 revealed, p2 did not reveal, p1 gets 100
                (Some(p1_reveal), None) => {
                    winnings.insert(
                        p1_reveal.0.clone(),
                        winnings.get(&p1_reveal.0).unwrap() + Uint128::from(100u128),
                    );
                }
                // p2 revealed, p1 did not reveal, p2 gets 100
                (None, Some(p2_reveal)) => {
                    winnings.insert(
                        p2_reveal.0.clone(),
                        winnings.get(&p2_reveal.0).unwrap() + Uint128::from(100u128),
                    );
                }
                _ => {}
            }
        });

        game.scores = winnings;
        Ok(true)
    }
}
