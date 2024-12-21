import dotenv from 'dotenv'
import path from 'path'
import { program, command } from 'bandersnatch'
import REPLConnect from './repl/REPLConnect'
import { 
    airdropP2ETokens, authorizeP2EMinter, executeContract, instantiateGameContract, 
    instantiateP2E, InstantiateP2EOptions, uploadContract, 
    InstantiateGameOptions
} from './repl/commands'
import Game, { GameType } from './repl/Game'

dotenv.config()

const RPC_URL = process.env.RPC_URL!
const P2E_CODE_ID = parseInt(process.env.P2E_CODE_ID! || '0')
const P2E_CONTRACT_ADDRESS = process.env.P2E_CONTRACT_ADDRESS!
const DILEMMA_CODE_ID = parseInt(process.env.DILEMMA_CODE_ID! || '0')
const DILEMMA_CONTRACT_ADDRESS = process.env.DILEMMA_CONTRACT_ADDRESS!
const ROCK_PAPER_SCISSORS_CODE_ID = parseInt(process.env.ROCK_PAPER_SCISSORS_CODE_ID! || '0')
const ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS = process.env.ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS!
const TRADE_GAINS_CODE_ID = parseInt(process.env.TRADE_GAINS_CODE_ID! || '0')
const TRADE_GAINS_CONTRACT_ADDRESS = process.env.TRADE_GAINS_CONTRACT_ADDRESS!
const ASTEROID_CODE_ID = parseInt(process.env.ASTEROID_CODE_ID! || '0')
const ASTEROID_CONTRACT_ADDRESS = process.env.ASTEROID_CONTRACT_ADDRESS!
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!

let replConnect: REPLConnect
let currentGame: Game | null = null

const getGameContractAddress = (gameType: GameType) => {
    switch (gameType) {
        case GameType.DILEMMA:
            return DILEMMA_CONTRACT_ADDRESS
        case GameType.ROCK_PAPER_SCISSORS:
            return ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS
        case GameType.TRADE_GAINS:
            return TRADE_GAINS_CONTRACT_ADDRESS
        case GameType.ASTEROID:
            return ASTEROID_CONTRACT_ADDRESS
        default:
            throw new Error(`Unknown game type ${gameType}`)
    }
}

const getGameCodeId = (gameType: GameType) => {
    switch (gameType) {
        case GameType.DILEMMA:
            return DILEMMA_CODE_ID
        case GameType.ROCK_PAPER_SCISSORS:
            return ROCK_PAPER_SCISSORS_CODE_ID
        case GameType.TRADE_GAINS:
            return TRADE_GAINS_CODE_ID
        case GameType.ASTEROID:
            return ASTEROID_CODE_ID
        default:
            throw new Error(`Unknown game type ${gameType}`)
    }
}

const repl = program()
    .add(
        command('connect')
            .option('rpc', { default: RPC_URL })
            .option('priv-key', { default: SIGNER_PRIVATE_KEY })
            .action(async (args) => {
                replConnect = new REPLConnect(args.rpc, args['priv-key'])
                await replConnect.connect()
                console.log('Connected to the network')
            })
            .description('Connect to the network and set up the wallet'),
    )
    .add(
        command('upload')
            .description('Upload a WASM contract')
            .option('file', { prompt: 'Enter the path to the WASM file to upload' })
            .option('amount', { prompt: 'The amount of uxion to send with the upload transaction', default: 0 })
            .option('gas', { prompt: 'The gas limit to use for the upload transaction', default: '200000' })
            .action(async (args) => {
                const wasmPath = path.resolve('artifacts', args.file as string)
                console.log('Uploading ', wasmPath)
                const result = await uploadContract(replConnect, wasmPath, {
                    amount: args.amount,
                    gas: args.gas,
                })
                console.log(result)
            })
    )
    .add(
        command('instantiate')
            .add(
                command('p2e')
                    .description('Instantiate a P2E contract')
                    .option('msg', { prompt: 'The instantiate message to use', default: '{}' })
                    .option('code-id', { default: P2E_CODE_ID, prompt: 'Enter the code ID of the contract to instantiate', type: 'number' })
                    .action(async (args) => {
                        const parsedMsg = JSON.parse(args['msg'] as string) as InstantiateP2EOptions
                        const result = await instantiateP2E(replConnect, args['code-id'], parsedMsg)
                        console.log(result)
                    }),
            )
            .add(
                command('game')
                    .description('Instantiate a game contract')
                    .option('p2e-contract', { prompt: 'The play-to-earn contract address to use', type: 'string', default: P2E_CONTRACT_ADDRESS })
                    .option('game-type', { prompt: 'The type of game to instantiate', type: 'string', choices: Object.values(GameType) })
                    .option('base-url', { prompt: 'Enter the base URL of the game', type: 'string', default: 'https://example.com' })
                    .option('image-url', { prompt: 'Enter the image URL of the game', type: 'string', default: 'https://example.com/image.png' })
                    .option('code-id', { prompt: 'Enter the code ID of the contract to instantiate', type: 'number', optional: true })
                    .action(async (args) => {
                        const codeId = args['code-id'] || getGameCodeId(args['game-type'] as GameType)
                        const parsedMsg: InstantiateGameOptions = {
                            token_contract: args['p2e-contract']!,
                            base_url: args['base-url']!,
                            image_url: args['image-url']!,
                        }
                        const result = await instantiateGameContract(replConnect, codeId, parsedMsg)
                        console.log(result)
                    }),
            )
            .description('Instantiate a contract'),
    )
    .add(
        command('authorize-p2e-minter')
            .description('Authorize a contract to be a minter of P2E tokens')
            .option('contract', { default: P2E_CONTRACT_ADDRESS, prompt: 'The contract address to authorize', type: 'string' })
            .option('minter', { default: DILEMMA_CONTRACT_ADDRESS, prompt: 'The minter address to authorize', type: 'string' })
            .action(async (args) => {
                const result = await authorizeP2EMinter(replConnect, args['contract'], args['minter'])
                console.log(result)
            }),
    )
    .add(
        command('airdrop-p2e-tokens')
            .description('Issue some P2E token balance to a specific wallet address')
            .option('contract', { default: P2E_CONTRACT_ADDRESS, prompt: 'The contract address to authorize', type: 'string' })
            .option('recipient', { prompt: 'The address to receive the tokens', type: 'string' })
            .option('amount', { prompt: 'The amount to send to the recipient', default: 10000 })
            .action(async (args) => {
                const result = await airdropP2ETokens(replConnect, args['contract'], args['recipient']!, args['amount'].toString())
                console.log(result)
            }),
    )
    .add(
        command('execute')
            .description('Execute a contract via a transaction')
            .option('contract', { prompt: 'The contract address to execute', type: 'string' })
            .option('msg', { prompt: 'The message to execute the contract with', type: 'string' })
            .option('amount', { prompt: 'The amount of uxion to send with the execute transaction', default: 0, type: 'number' })
            .option('gas', { prompt: 'The gas limit to use for the execute transaction', default: '200000', type: 'string' })
            .action(async (args) => {
                const parsedMsg = JSON.parse(args['msg'] as string)
                const result = await executeContract(replConnect, args['contract']!, parsedMsg, {
                    amount: args.amount,
                    gas: args.gas,
                })
                console.log(result)
            }),
    )
    .add(
        command('game')
            .description('Interact with a game')
            .add(
                command('debug')
                    .description('Print the currentGame object in the REPL')
                    .action(async (args) => {
                        console.log('Current Game: ', currentGame)
                    }),
            )
            .add(
                command('connect')
                    .description('Connect to a game')
                    .option('game-type', { prompt: 'The type of game to connect to', type: 'string', choices: Object.values(GameType) })
                    .option('game-id', { prompt: 'The game ID to connect to', type: 'string' })
                    .action(async (args) => {
                        const contractAddress = getGameContractAddress(args['game-type'] as GameType)
                        if (!currentGame) {
                            currentGame = new Game(replConnect, contractAddress, args['game-type'] as GameType)
                        }
                        await currentGame.connect(args['game-type'] as GameType, Number(args['game-id']))
                        console.log('Connected to game', currentGame.getGameId())
                    }),
            )
            .add(
                command('join')
                    .description('Join a game')
                    .option('game-id', { prompt: 'The game ID to join', type: 'number' })
                    .option('telegram-id', { prompt: 'The telegram ID to use for the game', type: 'string' })
                    .option('game-type', { prompt: 'The type of game to join', type: 'string', choices: Object.values(GameType) })
                    .action(async (args) => {
                        const contractAddress = getGameContractAddress(args['game-type'] as GameType)
                        if (!currentGame) {
                            currentGame = new Game(replConnect, contractAddress, args['game-type'] as GameType)
                        }
                        const result = await currentGame.joinGame(args['game-id'], args['telegram-id']!)
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('create')
                    .description('Create a game')
                    .option('telegram-id', { prompt: 'The telegram ID to use for the game', type: 'string' })
                    .option('game-type', { prompt: 'The type of game to create', type: 'string', choices: Object.values(GameType) })
                    .action(async (args) => {
                        const contractAddress = getGameContractAddress(args['game-type'] as GameType)
                        currentGame = new Game(replConnect, contractAddress, args['game-type'] as GameType)
                        const result = await currentGame.createGame()
                        const joinResult = await currentGame.joinGame(null, args['telegram-id']!)
                        console.dir(result, { depth: null })
                        console.dir(joinResult, { depth: null })
                    }),
            )
            .add(
                command('details')
                    .description('Get the details of the current game')
                    .action(async (args) => {
                        if (!currentGame?.getGameId() && currentGame?.getGameId() !== 0) {
                            console.log('currentGame', currentGame)
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const result = await currentGame?.getGame()
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('start')
                    .description('Start a game')
                    .action(async (args) => {
                        if (!currentGame?.getGameId() && currentGame?.getGameId() !== 0) {
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const result = await currentGame?.startGame()
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('play-round')
                    .description('Play a round in a game')
                    .option('choice', { prompt: 'The choice to play', type: 'string' })
                    .action(async (args) => {
                        if (!currentGame?.getGameId() && currentGame?.getGameId() !== 0) {
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const choices = currentGame?.getGameChoices()
                        if (choices !== undefined && !choices.includes(args['choice']!)) {
                            throw new Error(`Invalid choice: ${args['choice']}. Valid choices are: ${choices.join(', ')}`)
                        }

                        const result = await currentGame?.commitRound(args['choice']!)
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('reveal-round')
                    .description('Reveal a round in a game')
                    .action(async (args) => {
                        if (!currentGame?.getGameId() && currentGame?.getGameId() !== 0) {
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const result = await currentGame?.revealRound()
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('end-game')
                    .description('End game')
                    .action(async (args) => {
                        if (!currentGame?.getGameId() && currentGame?.getGameId() !== 0) {
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const result = await currentGame?.endGame()
                        console.dir(result, { depth: null })
                    }),
            )
    )

repl.repl()