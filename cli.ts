import * as CWP2E from './codegen/CwP2e.types'
import dotenv from 'dotenv'
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AccountData, coin, DirectSecp256k1Wallet } from "@cosmjs/proto-signing"

dotenv.config()

const RPC_URL = process.env.RPC_URL!
const P2E_CODE_ID = parseInt(process.env.P2E_CODE_ID!)
const P2E_CONTRACT_ADDRESS = process.env.P2E_CONTRACT_ADDRESS!

async function cli() {
    const client = await CosmWasmClient.connect(RPC_URL)
    const privateKey = Buffer.from(process.env.SIGNER_PRIVATE_KEY!, 'hex')
    const wallet: DirectSecp256k1Wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'xion')
    const accounts = await wallet.getAccounts()
    const signingClient = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet)

    // const codes = await client.getCodes()
    // console.log(codes)

    // const p2eContract = await client.getCodeDetails(P2E_CODE_ID)
    // console.log(p2eContract)

    const instantiateMsg: CWP2E.InstantiateMsg = {
        decimals: 2,
        initial_balances: [],
        initial_supply: '1000000000000',
        name: 'P2E Test',
        symbol: 'PTEX',
        reward_per_block: '10',
    }

    const result = await signingClient.instantiate(accounts[0].address, P2E_CODE_ID, instantiateMsg, 'P2E Test', {
        amount: [coin(0, 'uxion')],
        gas: '200000',
    })
    console.log('Instantiate P2E Result:', result)

    const balance = await signingClient.getBalance(accounts[0].address, 'uxion')
    console.log('Remaining Account Balance:', balance)
}

cli()
