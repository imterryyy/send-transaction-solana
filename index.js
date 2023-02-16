const BufferLayout = require("@solana/buffer-layout")
const solanaWeb3 = require("@solana/web3.js")
const bs58 = require("bs58")
const { Buffer } = require("buffer")

const enc = new TextEncoder()
const connection = new solanaWeb3.Connection("http://127.0.0.1:8899", 'confirmed')

// request airdrop
async function getAirdrop(publicKey, amount) {
    const airdropSign = await connection.requestAirdrop(
        publicKey,
        amount
    )

    await connection.confirmTransaction(airdropSign);

    console.log("Request Airdrop", amount, "SOL for wallet", publicKey.toString(), "\n")
}

// return buffer type: encoded data as base58 type
function encode(type, fields) {
    const allocLength = type.layout.span 
    const data = Buffer.alloc(allocLength)
    const layoutFields = Object.assign({instruction: type.index}, fields)
    type.layout.encode(layoutFields, data)

    return data
}

// send transaction
async function sendTransaction() {
    const SEED = "cream lazy drastic tongue dances"

    const TerryWallet = solanaWeb3.Keypair.fromSeed(enc.encode(SEED))
    console.log("Terry Address", TerryWallet.publicKey.toString(), "\n")
    await getAirdrop(TerryWallet.publicKey, 2 * solanaWeb3.LAMPORTS_PER_SOL)

    const DaisyWallet = solanaWeb3.Keypair.generate()
    console.log("Daisy Address", DaisyWallet.publicKey.toString(), "\n")


    // create layout
    const layout = BufferLayout.struct([
        BufferLayout.u32('instruction'),
        BufferLayout.ns64('lamports'),
    ])

    // index = 2 is transfer native token in system program
    const type = {
        index: 2,
        layout 
    }

    const fields = {
        lamports: solanaWeb3.LAMPORTS_PER_SOL 
    }

    const dataEncoded = encode(type, fields)
    //const dataDecoded = decode(type, dataEncoded)

    // keys
    const keys = [
        {pubkey: TerryWallet.publicKey, isSigner: true, isWritable: true},
        {pubkey: DaisyWallet.publicKey, isSigner: false, isWritable: true},
    ]

    // create instruction
    const transferInstruction =  new solanaWeb3.TransactionInstruction({
        keys,
        programId: solanaWeb3.SystemProgram.programId,
        data: dataEncoded
    })

    // create transaction
    const transaction = new solanaWeb3.Transaction().add(transferInstruction)
    const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [TerryWallet])

    console.log("Transfer", solanaWeb3.LAMPORTS_PER_SOL,"SOL From Terry To Daisy", signature, "\n")
}

sendTransaction()
