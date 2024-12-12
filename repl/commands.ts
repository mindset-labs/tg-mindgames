import fs from 'fs'
import { coin } from '@cosmjs/proto-signing'
import REPLConnect from './REPLConnect'
import * as CWP2E from '../codegen/CwP2e.types'
import * as CWDilemma from '../codegen/CwCooperationDilemma.types'

interface InstantiateResult {
    contractAddress: string
    remainingBalance: string
    txHash: string
}

interface UploadContractResult {
    txHash: string
    codeId: number
}

interface FeeOptions {
    amount?: number
    gas?: string
}

export type InstantiateP2EOptions = Partial<CWP2E.InstantiateMsg>
export type InstantiateGameOptions = {
    token_contract: string
    base_url?: string
    image_url?: string
}

/**
 * Instantiates a play-to-earn token contract.
 * @param replConnect - The REPL connection object.
 * @param codeId - The code ID of the contract to instantiate.
 * @param options - The options for the instantiation.
 * @returns The result of the instantiation.
 */
export async function instantiateP2E(
    replConnect: REPLConnect,
    codeId: number | string,
    options: InstantiateP2EOptions,
): Promise<InstantiateResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const instantiateMsg: CWP2E.InstantiateMsg = {
        decimals: 2,
        initial_balances: [
            {
                address: accounts[0].address,
                amount: '10000000000',
            },
        ],
        initial_supply: '10000000000',
        name: 'P2E Test',
        symbol: 'PTEX',
        reward_per_block: '0',
        mint: {
            minter: accounts[0].address,
        },
        ...options,
    }

    console.log('Instantiate message:', instantiateMsg)

    const codeIdParsed = typeof codeId === 'number' ? codeId : parseInt(codeId)
    const result = await replConnect.signingClient.instantiate(accounts[0].address, codeIdParsed, instantiateMsg, 'P2E Test', {
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

/**
 * Instantiates a cooperation dilemma contract.
 * @param replConnect - The REPL connection object.
 * @param codeId - The code ID of the contract to instantiate.
 * @param options - The options for the instantiation.
 * @returns The result of the instantiation.
 */
export async function instantiateGameContract(
    replConnect: REPLConnect,
    codeId: number | string,
    options: InstantiateGameOptions,
): Promise<InstantiateResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const instantiateMsg: CWDilemma.InstantiateMsg = {
        base_url: 'https://mindgames.mindsetlabs.io/dilemma',
        image_url: 'https://mindgames.mindsetlabs.io/dilemma/image.png',
        ...options,
    }

    console.log('Instantiate message:', instantiateMsg)

    const codeIdParsed = typeof codeId === 'number' ? codeId : parseInt(codeId)
    const result = await replConnect.signingClient.instantiate(accounts[0].address, codeIdParsed, instantiateMsg, 'Dilemma', {
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

/**
 * Uploads a contract to the chain.
 * @param replConnect - The REPL connection object.
 * @param wasmPath - The absolute path to the WASM file to upload.
 * @param options - Gas and fee options.
 * @returns The result of the upload.
 */
export async function uploadContract(
    replConnect: REPLConnect,
    wasmPath: string,
    options?: FeeOptions,
): Promise<UploadContractResult> {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()
    const result = await replConnect.signingClient.upload(accounts[0].address, fs.readFileSync(wasmPath), {
        amount: [coin(options?.amount ?? 0, 'uxion')],
        gas: options?.gas ?? '200000',
    })

    return {
        txHash: result.transactionHash,
        codeId: result.codeId,
    }
}

export async function executeContract(replConnect: REPLConnect, contractAddress: string, msg: Record<string, unknown>, options?: FeeOptions) {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()
    const result = await replConnect.signingClient.execute(accounts[0].address, contractAddress, msg, {
        amount: [coin(options?.amount ?? 0, 'uxion')],
        gas: options?.gas ?? '200000',
    })

    return {
        txHash: result.transactionHash,
    }
}

export async function authorizeP2EMinter(replConnect: REPLConnect, contractAddress: string, minterAddress: string) {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const msg: CWP2E.ExecuteMsg = {
        authorize_rewards_issuer: {
            address: minterAddress,
        },
    }

    const result = await replConnect.signingClient.execute(accounts[0].address, contractAddress, msg, {
        amount: [coin(0, 'uxion')],
        gas: '200000',
    })

    console.log('Authorize P2E minter result: ', result)

    return {
        txHash: result.transactionHash,
    }
}

export async function airdropP2ETokens(replConnect: REPLConnect, contractAddress: string, recipient: string, amount: string) {
    replConnect.checkConnection()
    const accounts = await replConnect.wallet.getAccounts()

    const msg: CWP2E.ExecuteMsg = {
        transfer: {
            recipient,
            amount,
        }
    }

    const result = await replConnect.signingClient.execute(accounts[0].address, contractAddress, msg, {
        amount: [coin(0, 'uxion')],
        gas: '200000',
    })

    console.log('Airdrop P2E tokens result: ', result)

    return {
        txHash: result.transactionHash,
    }
}
