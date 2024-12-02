import REPLConnect from './REPLConnect'
import { coin } from '@cosmjs/proto-signing'
import * as CWP2E from '../codegen/CwP2e.types'

interface InstantiateP2EResult {
    contractAddress: string
    remainingBalance: string
    txHash: string
}

export async function instantiateP2E(replConnect: REPLConnect, codeId: number): Promise<InstantiateP2EResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const instantiateMsg: CWP2E.InstantiateMsg = {
        decimals: 2,
        initial_balances: [],
        initial_supply: '1000000000000',
        name: 'P2E Test',
        symbol: 'PTEX',
        reward_per_block: '10',
    }

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
