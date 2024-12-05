import ReplConnect from './REPLConnect'
import * as DilemmaClient from '../codegen/CwCooperationDilemma.client'
import * as DilemmaTypes from '../codegen/CwCooperationDilemma.types'

enum DilemmaChoice {
    COOPERATE = 'cooperate',
    DEFECT = 'defect',
}

export default class Dilemma {
    private gameClient!: DilemmaClient.CwCooperationDilemmaClient
    private nonce = 0
    private choice: DilemmaChoice | null = null
    private gameId: number | null = null
    
    constructor(private readonly replConnect: ReplConnect, private readonly gameContractAddress: string) {}

    private async setGameClient() {
        const accounts = await this.replConnect.wallet.getAccounts()
        this.gameClient = new DilemmaClient.CwCooperationDilemmaClient(this.replConnect.signingClient, accounts[0]!.address, this.gameContractAddress)
    }

    async createGame(config: Partial<DilemmaTypes.GameConfig> = {}) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        const gameConfig: DilemmaTypes.GameConfig = {
            game_joining_fee: null,
            has_turns: true,
            min_players: 2,
            max_players: 2,
            max_rounds: 3,
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

        this.gameId = gameId ?? this.gameId

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

    async commitRound(choice: DilemmaChoice) {
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
            gas: '200000',
        })

        return result
    }

    async getGame(gameId?: number) {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        return this.gameClient.getGame({ gameId: gameId ?? this.gameId! })
    }

    async getCurrentRound() {
        if (!this.gameClient) {
            await this.setGameClient()
        }

        return this.gameClient.getCurrentRound({ gameId: this.gameId! })
    }
}
