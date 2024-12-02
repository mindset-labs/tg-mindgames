import dotenv from 'dotenv'
import { program, command } from 'bandersnatch'
import REPLConnect from './repl/REPLConnect'
import { instantiateP2E } from './repl/commands'

dotenv.config()

const RPC_URL = process.env.RPC_URL!
const P2E_CODE_ID = parseInt(process.env.P2E_CODE_ID!)
const P2E_CONTRACT_ADDRESS = process.env.P2E_CONTRACT_ADDRESS!
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!

let replConnect: REPLConnect

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
        command('instantiate')
            .option('contract', { default: 'p2e', options: ['p2e', 'dilemma'] })
            .option('code-id', { default: P2E_CODE_ID })
            .option('supply', { default: '1000000000000', description: 'The initial supply of the P2E token', optional: true })
            .action(async (args) => {
                switch (args['contract']) {
                    case 'p2e':
                        const result = await instantiateP2E(replConnect, args['code-id'])
                        console.log(result)
                        break
                    case 'dilemma':
                        // await instantiateDilemma(replConnect, args['code-id'])
                        break
                    default:
                        throw new Error(`Unknown contract: ${args['contract']}`)
                }
            })
            .description('Instantiate a contract'),
    )

repl.repl()