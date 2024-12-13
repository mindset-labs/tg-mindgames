/**
 * A generalized class for interacting with any game contract.
 */

import ReplConnect from './REPLConnect'
import * as DilemmaClient from '../codegen/CwCooperationDilemma.client'
import * as DilemmaTypes from '../codegen/CwCooperationDilemma.types'
import * as TradeGainsClient from '../codegen/CwTradeGains.client'
import * as TradeGainsTypes from '../codegen/CwTradeGains.types'
import * as RockPaperScissorsClient from '../codegen/CwRockPaperScissors.client'
import * as RockPaperScissorsTypes from '../codegen/CwRockPaperScissors.types'
import * as AsteroidClient from '../codegen/CwAsteroid.client'
import * as AsteroidTypes from '../codegen/CwAsteroid.types'

export enum GameType {
    DILEMMA = 'dilemma',
    TRADE_GAINS = 'trade-gains',
    ROCK_PAPER_SCISSORS = 'rock-paper-scissors',
    ASTEROID = 'asteroid',
}

export type GameConfig = {
    [GameType.DILEMMA]: DilemmaTypes.GameConfig,
    [GameType.TRADE_GAINS]: TradeGainsTypes.GameConfig,
    [GameType.ROCK_PAPER_SCISSORS]: RockPaperScissorsTypes.GameConfig,
    [GameType.ASTEROID]: AsteroidTypes.GameConfig,
}

export default class Game {
    private gameClient!: 
        DilemmaClient.CwCooperationDilemmaClient | 
        TradeGainsClient.CwTradeGainsClient | 
        RockPaperScissorsClient.CwRockPaperScissorsClient |
        AsteroidClient.CwAsteroidClient
    private nonce = 0
    private choice: unknown | null = null
    private gameId: number | null = null
    
    constructor(private readonly replConnect: ReplConnect, private readonly gameContractAddress: string, private gameType: GameType) {}

    private async setGameClient() {
        const accounts = await this.replConnect.wallet.getAccounts()
        switch (this.gameType) {
            case GameType.DILEMMA:
                this.gameClient = new DilemmaClient.CwCooperationDilemmaClient(this.replConnect.signingClient, accounts[0]!.address, this.gameContractAddress)
                break
            case GameType.TRADE_GAINS:
                this.gameClient = new TradeGainsClient.CwTradeGainsClient(this.replConnect.signingClient, accounts[0]!.address, this.gameContractAddress)
                break
            case GameType.ROCK_PAPER_SCISSORS:
                this.gameClient = new RockPaperScissorsClient.CwRockPaperScissorsClient(this.replConnect.signingClient, accounts[0]!.address, this.gameContractAddress)
                break
            case GameType.ASTEROID:
                this.gameClient = new AsteroidClient.CwAsteroidClient(this.replConnect.signingClient, accounts[0]!.address, this.gameContractAddress)
                break
        }
    }

    getGameId() {
        return this.gameId
    }

    getGameType() {
        return this.gameType
    }

    getGameChoices(): string[] {
        switch (this.gameType) {
            case GameType.DILEMMA:
                return ['cooperate', 'defect']
            case GameType.TRADE_GAINS:
                return new Array(10).fill(0).map((_, i) => i.toString())
            case GameType.ROCK_PAPER_SCISSORS:
                return ['rock', 'paper', 'scissors']
            case GameType.ASTEROID:
                return []
        }
    }

    async connect(gameType: GameType, gameId: number) {
        this.gameType = gameType
        this.gameId = Number(gameId)
        await this.setGameClient()
    }

    async createGame<T extends GameType>(config: Partial<GameConfig[T]> = {} as Partial<GameConfig[T]>) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        const gameConfig: GameConfig[T] = {
            game_joining_fee: null,
            has_turns: true,
            min_players: 2,
            max_players: 2,
            max_rounds: 1,
            min_deposit: '0',
            round_expiry_duration: 1000,
            round_reward_multiplier: 1,
            skip_reveal: false,
            ...config,
        }

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                create_game: {
                    config: gameConfig,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '200000',
        })

        this.gameId = Number(result.events.find(e => e.type === 'wasm')?.attributes.find(a => a.key === 'game_id')?.value)

        return result
    }

    async joinGame(gameId: number | null, telegramId: string) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        this.gameId = Number(gameId ?? this.gameId)

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                join_game: {
                    game_id: this.gameId!,
                    telegram_id: telegramId,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '200000',
        })

        return result
    }

    async startGame(gameId?: number) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        this.gameId = gameId ?? this.gameId

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                start_game: {
                    game_id: this.gameId!,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '200000',
        })

        return result
    }

    async commitRound(choice: string) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        this.choice = choice
        this.nonce = Math.floor(Math.random() * 1000000)
        const encoder = new TextEncoder()
        const choiceBytes = encoder.encode(choice)
        const nonceBytes = new Uint8Array(new BigUint64Array([BigInt(this.nonce)]).buffer).reverse()
        
        const hashValue = await crypto.subtle.digest(
            'SHA-256',
            new Uint8Array([...choiceBytes, ...nonceBytes])
        )
        const hash = Array.from(new Uint8Array(hashValue))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                commit_round: {
                    game_id: this.gameId!,
                    value: hash,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '200000',
        })

        return result
    }

    async revealRound() {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                reveal_round: {
                    game_id: this.gameId!,
                    value: this.choice!,
                    nonce: this.nonce,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '200000',
        })

        return result
    }

    async endGame() {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        const result = await this.gameClient.client.execute(this.gameClient.sender, this.gameContractAddress, {
            lifecycle: {
                end_game: {
                    game_id: this.gameId!,
                }
            }
        }, {
            amount: [{ denom: 'uxion', amount: '0' }],
            gas: '500000',
        })

        return result
    }

    async getGame(gameId?: number) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        console.log('Getting game', gameId ?? this.gameId!)

        return this.gameClient.getGame({ gameId: gameId ?? this.gameId! })
    }

    async getCurrentRound() {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        return this.gameClient.getCurrentRound({ gameId: this.gameId! })
    }
}
