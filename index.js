const BufferLayout = require("@solana/buffer-layout")
const solanaWeb3 = require("@solana/web3.js")
const bs58 = require("bs58")
const { Buffer } = require("buffer")

const enc = new TextEncoder()
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed')

const SEED = "cream lazy drastic tongue dances"
const seedEncoded =  enc.encode(SEED)
const keyPair = solanaWeb3.Keypair.fromSeed(seedEncoded)

const anotherKeyPair = solanaWeb3.Keypair.generate()

// request airdrop
async function getAirdrop() {
    const airdropSign = await connection.requestAirdrop(
        keyPair.publicKey,
        solanaWeb3.LAMPORTS_PER_SOL
    )

    await connection.confirmTransaction(airdropSign);

    console.log(airdropSign)
}
//getAirdrop()

// return buffer type: encoded data as base58 type
function encode(type, fields) {
    const allocLength = type.layout.span 
    const data = Buffer.alloc(allocLength)
    const layoutFields = Object.assign({instruction: type.index}, fields)
    type.layout.encode(layoutFields, data)

    return data
}

// return object type: data decode
function decode(type, buffer) {
    let data
    try {
        data = type.layout.decode(buffer)
    } catch (err) {
        throw new Error("invalid instruction: " + err)
    }
    
    if (data.instruction != type.index) {
        throw new Error(`invalid instruction; instruction index mismatch ${data.instruction} != ${type.index}`)
    }

    return data
}

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
    lamports: 1
}

const dataEncoded = encode(type, fields)
//const dataDecoded = decode(type, dataEncoded)

// keys
const keys = [
    {pubkey: keyPair.publicKey, isSigner: true, isWritable: true},
    {pubkey: anotherKeyPair.publicKey, isSigner: false, isWritable: true},
]

// create instruction
const transferInstruction =  new solanaWeb3.TransactionInstruction({
    keys,
    programId: solanaWeb3.SystemProgram.programId,
    data: dataEncoded
})

// create transaction
const transaction = new solanaWeb3.Transaction().add(transferInstruction)

// send transaction
async function sendTransaction() {
    const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [keyPair])
    console.log("signature:", signature)
}

sendTransaction()
