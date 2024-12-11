use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_game_lifecycle::{lifecycle::GameLifecycle, state::Game, ContractError as LifecycleError};
use std::collections::HashMap;

use crate::ContractError;

#[cw_serde]
pub struct Asteroid {
    pub accepted_value: Uint128,
}

impl GameLifecycle for Asteroid {
    fn calculate_rewards_and_winners(game: &mut Game) -> Result<bool, LifecycleError> {
        let mut winnings: HashMap<Addr, Uint128> = HashMap::from([
            (game.players[0].0.clone(), Uint128::zero()),
            (game.players[1].0.clone(), Uint128::zero()),
        ]);

        // Since the game is only 1 round, we directly access the first round
        let round = game
            .rounds
            .get(0)
            .expect("Game must have at least one round");
        let reveals = round.reveals.as_slice();

        match (reveals.get(0), reveals.get(1)) {
            (Some(p1_reveal), Some(p2_reveal)) => {
                // Directly compare the scores
                let p1_score = p1_reveal.1.clone();
                let p2_score = p2_reveal.1.clone();

                if p1_score > p2_score {
                    winnings.insert(
                        reveals[0].0.clone(),
                        winnings.get(&reveals[0].0).unwrap() + Uint128::from(100u128),
                    );
                } else if p2_score > p1_score {
                    winnings.insert(
                        reveals[1].0.clone(),
                        winnings.get(&reveals[1].0).unwrap() + Uint128::from(100u128),
                    );
                } else {
                    // In case of a tie, both players get their score
                    winnings.insert(
                        reveals[0].0.clone(),
                        winnings.get(&reveals[0].0).unwrap() + Uint128::from(50u128),
                    );
                    winnings.insert(
                        reveals[1].0.clone(),
                        winnings.get(&reveals[1].0).unwrap() + Uint128::from(50u128),
                    );
                }
            }
            // p1 revealed, p2 did not reveal, p1 gets their score
            (Some(p1_reveal), None) => {
                winnings.insert(
                    p1_reveal.0.clone(),
                    winnings.get(&p1_reveal.0).unwrap() + Uint128::from(100u128),
                );
            }
            // p2 revealed, p1 did not reveal, p2 gets their score
            (None, Some(p2_reveal)) => {
                winnings.insert(
                    p2_reveal.0.clone(),
                    winnings.get(&p2_reveal.0).unwrap() + Uint128::from(100u128),
                );
            }
            _ => {}
        }

        // Determine the winner based on the highest score
        let winner = winnings
            .iter()
            .max_by_key(|&(_, value)| value)
            .map(|(addr, _)| addr.clone());

        game.scores = winnings;
        Ok(winner.is_some())
    }
}
