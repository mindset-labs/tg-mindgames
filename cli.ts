import * as CWP2E from './codegen/CwP2e.types'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'

const RPC_URL = 'https://rpc.xion-testnet-1.burnt.com:443'
const P2E_CODE_ID = 1449
const DILEMMA_CODE_ID = 1450

async function cli() {
    const client = await CosmWasmClient.connect(RPC_URL)

    const codes = await client.getCodes()
    console.log(codes)

    const p2eContract = await client.getCodeDetails(P2E_CODE_ID)
    console.log(p2eContract)

    const instantiateMsg: CWP2E.InstantiateMsg = {
        decimals: 2,
        initial_balances: [],
        initial_supply: '1000000000000',
        name: 'P2E Test',
        symbol: 'P2E',
        reward_per_block: '10',
    }

}

cli()

