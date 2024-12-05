import dotenv from 'dotenv'
import path from 'path'
import { program, command } from 'bandersnatch'
import REPLConnect from './repl/REPLConnect'
import { 
    airdropP2ETokens, authorizeP2EMinter, executeContract, instantiateDilemma, 
    InstantiateDilemmaOptions, instantiateP2E, InstantiateP2EOptions, uploadContract 
} from './repl/commands'
import Dilemma, { DilemmaChoice } from './repl/Dilemma'

dotenv.config()

const RPC_URL = process.env.RPC_URL!
const P2E_CODE_ID = parseInt(process.env.P2E_CODE_ID!)
const P2E_CONTRACT_ADDRESS = process.env.P2E_CONTRACT_ADDRESS!
const DILEMMA_CODE_ID = parseInt(process.env.DILEMMA_CODE_ID!)
const DILEMMA_CONTRACT_ADDRESS = process.env.DILEMMA_CONTRACT_ADDRESS!
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!

let replConnect: REPLConnect
let currentGame: Dilemma | null = null

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
                command('dilemma')
                    .description('Instantiate a Dilemma contract')
                    .option('p2e-contract', { prompt: 'The play-to-earn contract address to use', type: 'string' })
                    .option('code-id', { default: DILEMMA_CODE_ID, prompt: 'Enter the code ID of the contract to instantiate' })
                    .action(async (args) => {
                        const parsedMsg: InstantiateDilemmaOptions = {
                            token_contract: args['p2e-contract']!,
                        }
                        const result = await instantiateDilemma(replConnect, args['code-id'], parsedMsg)
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
        command('dilemma')
            .description('Interact with a game')
            .add(
                command('connect')
                    .description('Connect to a game')
                    .option('game-id', { prompt: 'The game ID to connect to', type: 'number' })
                    .action(async (args) => {
                        if (!currentGame) {
                            currentGame = new Dilemma(replConnect, DILEMMA_CONTRACT_ADDRESS)
                        }
                        await currentGame.connect(args['game-id'])
                        console.log('Connected to game', currentGame.getGameId())
                    }),
            )
            .add(
                command('join')
                    .description('Join a game')
                    .option('game-id', { prompt: 'The game ID to join', type: 'number' })
                    .option('telegram-id', { prompt: 'The telegram ID to use for the game', type: 'string' })
                    .action(async (args) => {
                        if (!currentGame) {
                            currentGame = new Dilemma(replConnect, DILEMMA_CONTRACT_ADDRESS)
                        }
                        const result = await currentGame.joinGame(args['game-id'], args['telegram-id']!)
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('create')
                    .description('Create a game')
                    .option('telegram-id', { prompt: 'The telegram ID to use for the game', type: 'string' })
                    .action(async (args) => {
                        currentGame = new Dilemma(replConnect, DILEMMA_CONTRACT_ADDRESS)
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
                        if (!currentGame?.getGameId()) {
                            throw new Error('You must specifiy a game ID or join / create a game before you can get details')
                        }

                        const result = await currentGame.getGame()
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('start')
                    .description('Start a game')
                    .action(async (args) => {
                        if (!currentGame?.getGameId()) {
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
                        if (!currentGame) {
                            throw new Error('You must connect to a game before you can play a round')
                        }

                        const result = await currentGame.commitRound(args['choice'] as DilemmaChoice)
                        console.dir(result, { depth: null })
                    }),
            )
            .add(
                command('reveal-round')
                    .description('Reveal a round in a game')
                    .action(async (args) => {
                        if (!currentGame) {
                            throw new Error('You must connect to a game before you can reveal a round')
                        }

                        const result = await currentGame.revealRound()
                        console.dir(result, { depth: null })
                    }),
            )
    )

repl.repl()