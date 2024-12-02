import dotenv from 'dotenv'
import { program, command } from 'bandersnatch'
import REPLConnect from './repl/REPLConnect'
import { instantiateP2E, InstantiateP2EOptions } from './repl/commands'

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
            .add(
                command('p2e')
                    .description('Instantiate a P2E contract')
                    .option('msg', { description: 'The instantiate message to use', optional: true })
                    .option('code-id', { default: P2E_CODE_ID, prompt: 'Enter the code ID of the contract to instantiate' })
                    .action(async (args) => {
                        const parsedMsg = JSON.parse(args['msg'] as string) as InstantiateP2EOptions
                        const result = await instantiateP2E(replConnect, args['code-id'], parsedMsg)
                        console.log(result)
                    }),
            )
            .add(
                command('other')
                    .description('Instantiate a P2E contract')
                    .option('msg', { description: 'The instantiate message to use', optional: true })
                    .option('code-id', { default: P2E_CODE_ID, prompt: 'Enter the code ID of the contract to instantiate' })
                    .action(async (args) => {
                        console.log(args)
                    }),
            )
            .description('Instantiate a contract'),
    )

repl.repl()