import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing"

class REPLConnect {
    rpcUrl: string
    signerPrivateKey: string
    client!: CosmWasmClient
    wallet!: DirectSecp256k1Wallet
    signingClient!: SigningCosmWasmClient

    constructor(rpcUrl: string, signerPrivateKey: string) {
        this.rpcUrl = rpcUrl
        this.signerPrivateKey = signerPrivateKey
    }

    checkConnection(): boolean {
        if (this.client !== undefined && this.wallet !== undefined && this.signingClient !== undefined) {
            return true
        }

        throw new Error('Not connected to the network')
    }

    async connect() {
        this.client = await CosmWasmClient.connect(this.rpcUrl)
        this.wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(this.signerPrivateKey, 'hex'), 'xion')
        this.signingClient = await SigningCosmWasmClient.connectWithSigner(this.rpcUrl, this.wallet)
    }
}

export default REPLConnect
