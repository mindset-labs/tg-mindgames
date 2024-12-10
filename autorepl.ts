import path from 'path'
import fs from 'fs'
import { program, command } from 'bandersnatch'
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'

const PATH_TO_WASM_CONTRACT = './cw_p2e.wasm'
const CODE_GEN_TYPES_PATH = './codegen/CwP2e.types.ts'
const CODE_GEN_CLIENT_PATH = './codegen/CwP2e.client.ts'


// Generic function to create a REPL for any CosmWasm contract
function createContractRepl(clientPath: string) {
    // Dynamically import the client
    const clientModule = require(clientPath)
    const clientClassName = Object.keys(clientModule).find(key => key.endsWith('Client'))
    if (!clientClassName) {
        throw new Error('Could not find client class in module')
    }
    const ClientClass = clientModule[clientClassName]

    let replConnect: SigningCosmWasmClient
    let contractClient: any

    const repl = program()
        .add(
            command('connect')
                .description('Connect to a contract')
                .option('address', { prompt: 'Enter the contract address', type: 'string' })
                .action(async (args) => {
                    if (!replConnect) {
                        throw new Error('Client not initialized')
                    }
                    if (!args.address) {
                        throw new Error('Address is required')
                    }
                    // Create new client instance with the provided address
                    contractClient = new ClientClass(replConnect, args.address, "")
                    console.log('Connected to contract at', args.address)
                })
        )

    // Get all methods from the client prototype
    const clientMethods = Object.getOwnPropertyNames(ClientClass.prototype)
        .filter(name => name !== 'constructor')

    // For each method, create a command
    for (const methodName of clientMethods) {
        const method = ClientClass.prototype[methodName]

        // Skip if not a function
        if (typeof method !== 'function') continue

        // Create command
        const cmd = command(methodName)
            .description(`Execute ${methodName} on the contract`)

        // Get parameter info from the first parameter if it's an object
        const firstParam = method.toString().match(/\(([^)]*)\)/)?.[1]
        if (firstParam && firstParam.includes('{')) {
            // Extract parameters from the destructured object
            const params = firstParam
                .match(/{([^}]*)}/)?.[1]
                .split(',')
                .map((p: string) => p.trim())
                .filter((p: string) => p && !p.includes('?'))

            // Add options for each parameter
            params?.forEach((param: any) => {
                cmd.option(param, {
                    prompt: `Enter value for ${param}`,
                    type: 'string',
                    required: true
                })
            })
        }

        // Add action
        cmd.action(async (args) => {
            if (!contractClient) {
                throw new Error('Not connected to a contract')
            }

            try {
                // Convert args to parameters object if needed
                const params = Object.keys(args).length > 0 ? { ...args } : undefined
                const result = await contractClient[methodName](params)
                console.log(result)
            } catch (error) {
                console.error(`Error executing ${methodName}:`, error)
            }
        })

        repl.add(cmd)
    }

    return repl
}

// Create and start the REPL
const repl = createContractRepl(
    CODE_GEN_CLIENT_PATH,
)

repl.repl()

