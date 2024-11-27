use std::collections::HashMap;
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_game_lifecycle::{lifecycle::GameLifecycle, state::Game, ContractError as LifecycleError};

use crate::ContractError;

#[cw_serde]
pub struct CooperationDilemma {
    pub choices: Vec<CooperationDilemmaChoices>,
}

#[cw_serde]
pub enum CooperationDilemmaChoices {
    Cooperate,
    Defect,
}

impl TryFrom<String> for CooperationDilemmaChoices {
    type Error = ContractError;

    fn try_from(choice: String) -> Result<Self, Self::Error> {
        match choice.as_str() {
            "cooperate" => Ok(CooperationDilemmaChoices::Cooperate),
            "defect" => Ok(CooperationDilemmaChoices::Defect),
            _ => Err(ContractError::InvalidChoice {}),
        }
    }
}

impl GameLifecycle for CooperationDilemma {
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
                    let p1_choice = CooperationDilemmaChoices::try_from(p1_reveal.1.clone());
                    let p2_choice = CooperationDilemmaChoices::try_from(p2_reveal.1.clone());

                    match (p1_choice, p2_choice) {
                        // both cooperate, both get 50
                        (Ok(CooperationDilemmaChoices::Cooperate), Ok(CooperationDilemmaChoices::Cooperate)) => {
                            winnings.insert(
                                reveals[0].0.clone(),
                                winnings.get(&reveals[0].0).unwrap() + Uint128::from(50u128),
                            );
                            winnings.insert(
                                reveals[1].0.clone(),
                                winnings.get(&reveals[1].0).unwrap() + Uint128::from(50u128),
                            );
                        },
                        // p1 cooperates, p2 defects, p2 gets 100
                        (Ok(CooperationDilemmaChoices::Cooperate), Ok(CooperationDilemmaChoices::Defect)) => {
                            winnings.insert(
                                reveals[1].0.clone(),
                                winnings.get(&reveals[1].0).unwrap() + Uint128::from(100u128),
                            );
                        },
                        // p1 defects, p2 cooperates, p1 gets 100
                        (Ok(CooperationDilemmaChoices::Defect), Ok(CooperationDilemmaChoices::Cooperate)) => {
                            winnings.insert(
                                reveals[0].0.clone(),
                                winnings.get(&reveals[0].0).unwrap() + Uint128::from(100u128),
                            );
                        },
                        // both defect, both get 0
                        _ => {}
                    }
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
