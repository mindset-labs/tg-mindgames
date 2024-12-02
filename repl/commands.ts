import fs from 'fs'
import { coin } from '@cosmjs/proto-signing'
import REPLConnect from './REPLConnect'
import * as CWP2E from '../codegen/CwP2e.types'

interface InstantiateP2EResult {
    contractAddress: string
    remainingBalance: string
    txHash: string
}

interface UploadContractResult {
    txHash: string
    codeId: number
}

export type InstantiateP2EOptions = Partial<CWP2E.InstantiateMsg>

export async function instantiateP2E(replConnect: REPLConnect, codeId: number, options: InstantiateP2EOptions): Promise<InstantiateP2EResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const instantiateMsg: CWP2E.InstantiateMsg = {
        decimals: 2,
        initial_balances: [],
        initial_supply: '1000000000000',
        name: 'P2E Test',
        symbol: 'PTEX',
        reward_per_block: '10',
        ...options,
    }

    console.log('Instantiate message:', instantiateMsg)

    const result = await replConnect.signingClient.instantiate(accounts[0].address, codeId, instantiateMsg, 'P2E Test', {
        amount: [coin(0, 'uxion')],
        gas: '200000',
    })

    const balance = await replConnect.signingClient.getBalance(accounts[0].address, 'uxion')

    return {
        contractAddress: result.contractAddress,
        remainingBalance: balance.amount,
        txHash: result.transactionHash,
    }
}

// export async function instantiateDilemma(replConnect: REPLConnect, codeId: number, options: InstantiateDilemmaOptions): Promise<InstantiateDilemmaResult> {
//     replConnect.checkConnection()
// }

export async function uploadContract(replConnect: REPLConnect, wasmPath: string): Promise<UploadContractResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()
    const result = await replConnect.signingClient.upload(accounts[0].address, fs.readFileSync(wasmPath), 'auto')

    return {
        txHash: result.transactionHash,
        codeId: result.codeId,
    }
}
