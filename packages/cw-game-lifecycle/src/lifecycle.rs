use cosmwasm_std::{to_json_binary, Addr, Binary, Deps, DepsMut, Env, Event, MessageInfo, Response, StdResult, Uint128, WasmMsg};
use cw_p2e::msg::ExecuteMsg as P2EExecuteMsg;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::*;
use hex;
use sha2::{Digest, Sha256};

pub trait GameLifecycle {
    // Entry points
    fn instantiate(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: InstantiateMsg,
    ) -> Result<Response, ContractError> {
        GAME_METADATA.save(
            deps.storage,
            &GameMetadata {
                base_url: msg.base_url,
                image_url: msg.image_url,
                token_contract: msg.token_contract,
            },
        )?;
        OWNER.save(deps.storage, &info.sender)?;
        GAME_ID_COUNTER.save(deps.storage, &0)?;

        Ok(Response::new().add_attribute("action", "instantiate"))
    }

    fn execute(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        msg: ExecuteMsg,
    ) -> Result<Response, ContractError> {
        match msg {
            ExecuteMsg::CreateGame { config } => Self::create_game(deps, info, config),
            ExecuteMsg::JoinGame {
                game_id,
                telegram_id,
            } => Self::join_game(deps, info, game_id, telegram_id),
            ExecuteMsg::StartGame { game_id } => Self::start_game(deps, env, info, game_id),
            ExecuteMsg::CommitRound {
                game_id,
                value,
                amount,
            } => Self::commit_round(deps, env, info, game_id, value, amount),
            ExecuteMsg::CommitRoundAsAdmin {
                game_id,
                value,
                amount,
                player,
            } => Self::commit_round_as_admin(deps, env, info, game_id, player, value, amount),
            ExecuteMsg::RevealRound {
                game_id,
                value,
                nonce,
            } => Self::reveal_round(deps, env, info, game_id, value, nonce),
            ExecuteMsg::EndGame { game_id } => Self::end_game(deps, env, info, game_id),
        }
    }

    fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
        match msg {
            QueryMsg::GetGame { game_id } => Self::get_game(deps, game_id),
            QueryMsg::GetLeaderboard {} => Self::get_leaderboard(deps),
            QueryMsg::GetCurrentRound { game_id } => Self::get_current_round(deps, game_id),
            QueryMsg::GetGameStatus { game_id } => Self::get_game_status(deps, game_id),
            QueryMsg::GetGamesCount {} => Self::get_games_count(deps),
        }
    }

    // Game lifecycle
    fn create_game(
        deps: DepsMut,
        info: MessageInfo,
        config: GameConfig,
    ) -> Result<Response, ContractError> {
        // Increment the game ID counter and use current value as the new game ID
        let game_id = GAME_ID_COUNTER.load(deps.storage)?;
        GAME_ID_COUNTER.save(deps.storage, &(game_id + 1))?;

        let game = Game::new(game_id, config, info.sender);
        GAMES.save(deps.storage, game_id, &game)?;

        Ok(Response::new()
            .add_attribute("action", "create_game")
            .add_attribute("game_id", game_id.to_string()))
    }

    fn start_game(
        deps: DepsMut,
        _env: Env,
        _info: MessageInfo,
        game_id: u64,
    ) -> Result<Response, ContractError> {
        let mut game = GAMES.load(deps.storage, game_id)?;

        if game.status != GameStatus::Ready {
            return Err(ContractError::GameNotInReadyState { game_id });
        }

        game.status = GameStatus::InProgress;
        game.current_round = 1;
        game.rounds
            .push(GameRound::new(1, game.config.round_expiry_duration));

        GAMES.save(deps.storage, game_id, &game)?;

        Ok(Response::new()
            .add_attribute("action", "start_game")
            .add_attribute("game_id", game_id.to_string()))
    }

    fn join_game(
        deps: DepsMut,
        info: MessageInfo,
        game_id: u64,
        telegram_id: String,
    ) -> Result<Response, ContractError> {
        let mut game = GAMES.load(deps.storage, game_id)?;

        if game.status != GameStatus::Created {
            // game cannot be joined since it's either already started or ended
            return Err(ContractError::GameNotInCreatedState { game_id });
        } else if game.players.iter().any(|p| p.0 == info.sender) {
            // player has already joined the game
            return Err(ContractError::PlayerAlreadyJoined {
                game_id,
                player: info.sender.clone(),
            });
        } else if game.players.len() >= game.config.max_players.unwrap_or(u8::MAX) as usize {
            // game is full and cannot be joined
            return Err(ContractError::GameFull { game_id });
        }

        // TODO: handle player joining fee by reading `game.config.min_deposit`
        //         * should lock a certain amount of the player's funds if `min_deposit` is greater than 0
        //         *
        //         * should create an allowance for the game contract to spend some amount of the player's (locked) funds
        //         * this can be done by calling `lock_funds` and `increase_allowance` on the cw20 token contract from here
        //         * this contract will be whitelisted on the cw20 token contract as a minter / admin / spender

        // add the player to the game
        game.players.push((info.sender.clone(), telegram_id));
        // check if the game is ready to start and update the game status accordingly
        if game.players.len() >= game.config.min_players as usize {
            game.status = GameStatus::Ready;
        }

        GAMES.save(deps.storage, game_id, &game)?;

        Ok(Response::new()
            .add_attribute("action", "join_game")
            .add_attribute("game_id", game_id.to_string())
            .add_attribute("player", info.sender.clone().to_string()))
    }

    fn _commit_round(
        deps: DepsMut,
        env: Env,
        game_id: u64,
        player: Addr,
        value: String,
        amount: Option<Uint128>,
    ) -> Result<Response, ContractError> {
        let mut game = GAMES.load(deps.storage, game_id)?;

        if !game.players.iter().any(|p| p.0 == player) {
            // player is not in the game, throw an error
            return Err(ContractError::PlayerNotInGame { game_id, player });
        }

        let round = game
            .rounds
            .iter_mut()
            .find(|r| r.id == game.current_round)
            .ok_or(ContractError::RoundNotFound {
                game_id,
                round: game.current_round,
            })?;

        if round.commits.iter().any(|c| c.0 == player) {
            // player has already committed to the round
            return Err(ContractError::RoundAlreadyCommitted { game_id, player });
        }

        // check block_expired < current_block and status
        if env.block.height >= round.expires_at.unwrap_or(u64::MAX) {
            // round has expired
            return Err(ContractError::RoundExpired {
                game_id,
                round: round.id,
            });
        }

        round.commits.push((player, value, amount));

        if round.commits.len() >= game.players.len() {
            // round is full, all players have committed
            round.status = GameRoundStatus::Committed;
        }

        GAMES.save(deps.storage, game_id, &game)?;
        Ok(Response::new())
    }

    fn commit_round(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game_id: u64,
        value: String,
        amount: Option<Uint128>,
    ) -> Result<Response, ContractError> {
        Self::_commit_round(deps, env, game_id, info.sender, value, amount)
    }

    fn commit_round_as_admin(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game_id: u64,
        player: Addr,
        value: String,
        amount: Option<Uint128>,
    ) -> Result<Response, ContractError> {
        if !ADMINS.load(deps.storage)?.contains(&info.sender)
            && OWNER.load(deps.storage)? != info.sender
        {
            return Err(ContractError::Unauthorized {});
        }

        Self::_commit_round(deps, env, game_id, player, value, amount)
    }

    fn reveal_round(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game_id: u64,
        value: String,
        nonce: u64,
    ) -> Result<Response, ContractError> {
        let mut events: Vec<Event> = vec![];
        let mut game = GAMES.load(deps.storage, game_id)?;

        if game.config.skip_reveal {
            // skip reveal, just calculate the winner
            return Ok(Response::new()
                .add_events(events)
                .add_attribute("action", "reveal_round")
                .add_attribute("game_id", game_id.to_string())
                .add_attribute("round_id", game.current_round.to_string()));
        }

        let round = game
            .rounds
            .iter_mut()
            .find(|r| r.id == game.current_round)
            .ok_or(ContractError::RoundNotFound {
                game_id,
                round: game.current_round,
            })?;

        // Not all players committed and the round has not expired
        if round.status != GameRoundStatus::Committed
            && round.expires_at.unwrap_or(u64::MAX) > env.block.height
        {
            return Err(ContractError::RoundNotCommitted {
                game_id,
                round: round.id,
            });
        }

        let player_commit = round
            .commits
            .iter()
            .find(|c| c.0 == info.sender)
            .map(|c| c.1.clone());

        let mut hasher = Sha256::new();
        hasher.update(value.as_bytes());
        hasher.update(nonce.to_be_bytes());
        let hash = hex::encode(hasher.finalize());

        //Check if the reveal_commit match the previously submitted hashed commit
        if hash != player_commit.unwrap_or_default() {
            return Err(ContractError::RoundRevealMismatch {
                game_id: game_id,
                round: game.current_round,
            });
        }

        // push the revealed value and optionally close the round
        round.reveals.push((info.sender.clone(), value));

        // if all players revealed or the round has expired, close the round
        if round.reveals.len() >= game.players.len()
            || round.expires_at.unwrap_or(u64::MAX) < env.block.height
        {
            round.status = GameRoundStatus::Ended;
            game.current_round += 1;
        }

        // if all rounds are finished, set the game status to RoundsFinished
        if game.current_round >= game.config.max_rounds {
            game.status = GameStatus::RoundsFinished;
            events.push(Event::new("game_rounds_finished")
                .add_attribute("game_id", game_id.to_string()));
        }

        GAMES.save(deps.storage, game_id, &game)?;

        Ok(Response::new()
            .add_events(events)
            .add_attribute("action", "reveal_round")
            .add_attribute("game_id", game_id.to_string())
            .add_attribute("round_id", game.current_round.to_string())
            .add_attribute("player", info.sender.clone().to_string()))
    }

    fn end_game(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        game_id: u64,
    ) -> Result<Response, ContractError> {
        let is_admin = ADMINS.load(deps.storage)?.contains(&info.sender)
            || OWNER.load(deps.storage)? == info.sender;
        let mut game = GAMES.load(deps.storage, game_id)?;

        // check if the game can be ended (must be in progress and max rounds, if set, is reached)
        match (game.status, is_admin) {
            // admin can end the game at any time or if rounds are finished
            (GameStatus::RoundsFinished, _) | (_, true) => {
                game.status = GameStatus::Ended;
                GAMES.save(deps.storage, game_id, &game)?;
            }
            _ => {
                return Err(ContractError::CannotCloseGame {
                    reason: String::from("Rounds not finished!"),
                });
            }
        }

        Ok(Response::new()
            .add_attribute("action", "end_game")
            .add_attribute("game_id", game_id.to_string()))
    }

    // Queries
    fn get_current_round(deps: Deps, game_id: u64) -> StdResult<Binary> {
        let game = GAMES.load(deps.storage, game_id)?;
        to_json_binary(&game.current_round)
    }

    fn get_leaderboard(deps: Deps) -> StdResult<Binary> {
        let leaderboard = LEADERBOARD.load(deps.storage, "leaderboard".to_string())?;
        to_json_binary(&leaderboard)
    }

    fn get_game(deps: Deps, game_id: u64) -> StdResult<Binary> {
        let game = GAMES.load(deps.storage, game_id)?;
        to_json_binary(&game)
    }

    fn get_game_status(deps: Deps, game_id: u64) -> StdResult<Binary> {
        let game = GAMES.load(deps.storage, game_id)?;
        to_json_binary(&game.status)
    }

    fn get_games_count(deps: Deps) -> StdResult<Binary> {
        let games_count = GAME_ID_COUNTER.load(deps.storage)?;
        to_json_binary(&games_count)
    }

    // Helpers
    fn process_joining_fee(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game: &mut Game,
    ) -> Result<Option<WasmMsg>, ContractError> {
        let metadata = GAME_METADATA.load(deps.storage)?;

        if let Some(joining_fee) = game.config.game_joining_fee {
            // transfer the joining fee to the game contract in the P2E token contract
            let msg = WasmMsg::Execute {
                contract_addr: metadata.token_contract.to_string(),
                msg: to_json_binary(&P2EExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                    amount: joining_fee,
                })?,
                funds: vec![],
            };
            // keep track of the joining fee in the game's escrow
            game.total_escrow += joining_fee;
            game.player_escrow.push((info.sender, joining_fee));

            return Ok(Some(msg));
        }

        Ok(None)
    }

    fn process_round_deposit(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game: &Game,
        round_id: u64,
        player: Addr,
    ) -> Result<bool, ContractError> {
        //TODO: check what currency is used for the deposit
        //       * if it's not the native token $COREUM, we need to check if the Smart Token contract is whitelisted
        //       * if it's not whitelisted, return an error

        // // Check if min_deposit is required and validate user's deposit
        // if config_clone.min_deposit > Uint128::zero() {
        //     // Check if user sent any funds
        //     if info.funds.is_empty() {
        //         return Err(ContractError::NoFundsProvided {});
        //     }

        //     // Find matching deposit denomination
        //     let deposit = info
        //         .funds
        //         .iter()
        //         .find(|coin| coin.denom == config_clone.min_deposit.denom)
        //         .ok_or(ContractError::InvalidDenom {
        //             expected: config_clone.min_deposit.denom.clone(),
        //         })?;

        //     // Validate deposit amount meets minimum
        //     if deposit.amount < config_clone.min_deposit {
        //         return Err(ContractError::InsufficientFunds {
        //             expected: config_clone.min_deposit,
        //             received: deposit.amount,
        //         });
        //     }

        //     // Deposit the funds in the escrow
        //     let escrow_key = (game_id, sender);
        //     let escrow = ESCROW
        //         .load(deps.storage, escrow_key.clone())
        //         .unwrap_or_default();
        //     ESCROW.save(
        //         deps.storage,
        //         escrow_key,
        //         &Coin {
        //             denom: deposit.denom.clone(),
        //             amount: escrow.amount + deposit.amount,
        //         },
        //     )?;

        //     // Set initial escrow amount
        //     game.total_escrow = config_clone.min_deposit.clone();
        // }

        Ok(true)
    }

    fn calculate_rewards_and_winners(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        game: &Game,
    ) -> Result<bool, ContractError> {
        Ok(true)
    }
}
