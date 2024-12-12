use std::collections::HashMap;

use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_game_lifecycle::{lifecycle::GameLifecycle, state::Game, error::ContractError as LifecycleError};

use crate::ContractError;

#[cw_serde]
pub struct RockPaperScissors {
    pub choices: Vec<RockPaperScissorsChoices>,
}

impl RockPaperScissors {
    // returns 0 if p1 wins, 1 if p2 wins, 2 if draw
    pub fn determine_winner(p1_choice: &RockPaperScissorsChoices, p2_choice: &RockPaperScissorsChoices) -> RockPaperScissorsWinner {
        match (p1_choice, p2_choice) {
            (RockPaperScissorsChoices::Rock, RockPaperScissorsChoices::Scissors) => RockPaperScissorsWinner::Player1,
            (RockPaperScissorsChoices::Paper, RockPaperScissorsChoices::Rock) => RockPaperScissorsWinner::Player1,
            (RockPaperScissorsChoices::Scissors, RockPaperScissorsChoices::Paper) => RockPaperScissorsWinner::Player1,
            (RockPaperScissorsChoices::Scissors, RockPaperScissorsChoices::Rock) => RockPaperScissorsWinner::Player2,
            (RockPaperScissorsChoices::Rock, RockPaperScissorsChoices::Paper) => RockPaperScissorsWinner::Player2,
            (RockPaperScissorsChoices::Paper, RockPaperScissorsChoices::Scissors) => RockPaperScissorsWinner::Player2,
            _ => RockPaperScissorsWinner::Draw,
        }
    }
}

#[cw_serde]
pub enum RockPaperScissorsChoices {
    Rock,
    Paper,
    Scissors,
}

#[cw_serde]
pub enum RockPaperScissorsWinner {
    Player1,
    Player2,
    Draw,
}

impl TryFrom<String> for RockPaperScissorsChoices {
    type Error = ContractError;

    fn try_from(choice: String) -> Result<Self, Self::Error> {
        match choice.as_str() {
            "rock" => Ok(RockPaperScissorsChoices::Rock),
            "paper" => Ok(RockPaperScissorsChoices::Paper),
            "scissors" => Ok(RockPaperScissorsChoices::Scissors),
            _ => Err(ContractError::InvalidChoice {}),
        }
    }
}

impl GameLifecycle for RockPaperScissors {
    fn is_valid_reveal_choice(value: &String) -> bool {
        let choice = RockPaperScissorsChoices::try_from(value.clone());
        choice.is_ok()
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
                    // it's safe to unwrap because we've already checked the choice is valid in the reveal step
                    let p1_choice = RockPaperScissorsChoices::try_from(p1_reveal.1.clone()).unwrap();
                    let p2_choice = RockPaperScissorsChoices::try_from(p2_reveal.1.clone()).unwrap();
                    let winner = RockPaperScissors::determine_winner(&p1_choice, &p2_choice);

                    match winner {
                        RockPaperScissorsWinner::Player1 => {
                            winnings.insert(
                                p1_reveal.0.clone(),
                                winnings.get(&p1_reveal.0).unwrap() + Uint128::from(100u128),
                            );
                        }
                        RockPaperScissorsWinner::Player2 => {
                            winnings.insert(
                                p2_reveal.0.clone(),
                                winnings.get(&p2_reveal.0).unwrap() + Uint128::from(100u128),
                            );
                        }
                        RockPaperScissorsWinner::Draw => {}
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

