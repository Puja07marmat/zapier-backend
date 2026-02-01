"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSol = sendSol;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com", "finalized");
async function sendSol(to, amount) {
    const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode((process.env.SOL_PRIVATE_KEY ?? "")));
    console.log(keypair.publicKey);
    const transferTransaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new web3_js_1.PublicKey(to),
        lamports: parseFloat(amount) * web3_js_1.LAMPORTS_PER_SOL, // 0.1 => 10 ^ 8
    }));
    await (0, web3_js_1.sendAndConfirmTransaction)(connection, transferTransaction, [keypair]);
    console.log("sol Sent!");
}
