/*
 * Withdraws a deposit by posting a ZK proof for knowing a witness α s.t.
 * P * α = G. The value of the leaf will be sent in ether to the sender's
 * (manager's) account.
 */

import dotenv from "dotenv";
dotenv.config();

// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { ethers } from "ethers";
import fs from "fs";
// @ts-ignore
import { groth16 } from "snarkjs";
import { NOTHING_UP_MY_SLEEVE, IncrementalQuinTree } from "maci-crypto";
// @ts-ignore
import { PrivateKey } from "babyjubjub";

import {
    Groth16Proof,
    Groth16ProofCalldata,
    WithdrawPubSignals,
} from "./types";
import Leaf from "./Leaf";
import Utils from "./utils";

const LEAF_IDX: number = 1;

const TREE_DEPTH: number = 32;

const PROV_KEY: string = "../circuits/verif-manager.zkey";
const VERIF_KEY: string = "../circuits/verif-manager.vkey.json";
const WASM: string = "../circuits/verif-manager.wasm";

const signer: ethers.Wallet = new ethers.Wallet(
    <string>process.env.MANAGER_ETH_PRIVKEY,
    new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
);
const privateTreasury: ethers.Contract = new ethers.Contract(
    <string>process.env.CONTRACT_ADDR,
    require(<string>process.env.CONTRACT_ABI_PATH).abi,
    signer
);

/*
 * Queries contract for all leaves ever stored. Uses emitted NewLeaf event.
 * Hashes leaves using poseidon hash.
 */
async function getDepositHistory(poseidon: any): Promise<[Leaf[], BigInt[]]> {
    console.log("== Fetching deposit history");
    const newLeafEvents: ethers.Event[] = await privateTreasury.queryFilter(
        privateTreasury.filters.NewLeaf()
    );
    const leafHistory: Leaf[] = newLeafEvents.map((e) =>
        Leaf.fromSol(e.args?.lf)
    );
    const leafHashes: BigInt[] = leafHistory.map((lf) =>
        lf.poseidonHash(poseidon)
    );
    console.log(`- Retrieved ${leafHashes.length} leaves`);
    console.log("==");
    return [leafHistory, leafHashes];
}

/*
 * Finds indices of owned leaves, i.e. the treasury private key at hand
 * satisfies P * α = G
 */
function checkLeafOwnership(leafHistory: Leaf[]): number[] {
    console.log("== Checking leaves for ownership");
    const owned: number[] = leafHistory.reduce(
        (a: number[], lf: Leaf, i: number) => {
            const isOwned: boolean = lf.checkQDerivation(
                new PrivateKey(process.env.TREASURY_PRIVKEY)
            );
            if (isOwned) a.push(i);
            return a;
        },
        []
    );
    console.log(`- Found ${owned.length} leaves recoverable by the privKey.`);
    console.log("==");
    return owned;
}

/*
 * Generates proof w/ public signals P & Q to demonstrate knowledge of the
 * manager's / treasury's private key.
 */
async function genGroth16Proof(lf: Leaf, lfIdx: number, root: BigInt, treasuryPriv: string, inclusionProof: any): Promise<[Groth16Proof, WithdrawPubSignals]> {
    console.log("== Generating proof");
    const lfBase10 = lf.base10();
    const { proof, publicSignals } = await groth16.fullProve(
        {
            v: lfBase10.v,
            root: root.toString(),
            leafIndex: lfIdx,
            P: lfBase10.P,
            Q: lfBase10.Q,
            treasuryPriv: treasuryPriv,
            pathIndex: inclusionProof.indices,
            pathElements: inclusionProof.pathElements
        },
        WASM,
        PROV_KEY
    );
    console.log("- Success");
    console.log("==");
    return [proof, publicSignals];
}

/*
 * Ensures proof verifies client-side with snarkjs before posting on-chain.
 */
async function proveSanityCheck(
    prf: Groth16Proof,
    pubSigs: WithdrawPubSignals
) {
    console.log("== Running sanity check, verifying proof client-side");
    console.log("- Proof:", prf);
    console.log("- Public Signals:", pubSigs);
    const vKey = JSON.parse(fs.readFileSync(VERIF_KEY, "utf8"));
    const res = await groth16.verify(vKey, pubSigs, prf);
    if (res === true) {
        console.log("- Verification OK");
    } else {
        console.log("- Invalid proof");
    }
    console.log("==");
}

/*
 * Posts the ZK proof on-chain and logs the increase in the manager's
 * balance. Need the 60s timeout call for non-local blockchains that don't have
 * instant finality.
 */
async function sendProofTx(prf: Groth16Proof, pubSigs: WithdrawPubSignals) {
    console.log("== Sending tx with withdrawal proof");
    console.log(
        "Manager balance BEFORE:",
        ethers.utils.formatEther(await signer.getBalance())
    );
    const formattedProof: Groth16ProofCalldata =
        await Utils.exportCallDataGroth16(prf, pubSigs);
    console.log("Proof:", formattedProof);
    const result = await privateTreasury.withdraw(
        LEAF_IDX,
        formattedProof.a,
        formattedProof.b,
        formattedProof.c,
        formattedProof.input
    );
    console.log(result);
    // await new Promise(resolve => setTimeout(resolve, 60000));
    console.log(
        "Manager balance AFTER:",
        ethers.utils.formatEther(await signer.getBalance())
    );
    console.log("==");
}

/*
 * Reconstructs Merkle tree of deposits client side for inclusion proof
 * generation.
 */
async function reconstructMerkleTree(
    leafHashes: BigInt[]
): Promise<IncrementalQuinTree> {
    console.log("== Reconstructing Merkle tree");
    let tree: IncrementalQuinTree = new IncrementalQuinTree(
        TREE_DEPTH,
        NOTHING_UP_MY_SLEEVE,
        2
    );
    leafHashes.forEach((lh: BigInt) => {
        tree.insert(lh);
    });
    console.log("- Root:", tree.root);
    console.log(
        "- Same as root stored on contract?",
        tree.root === BigInt(await privateTreasury.root())
    );
    console.log("==");
    return tree;
}

(async () => {
    const poseidon = await buildPoseidon();
    const [leafHistory, leafHashes] = await getDepositHistory(poseidon);
    const ownedLeaves = checkLeafOwnership(leafHistory);
    const tree = await reconstructMerkleTree(leafHashes);
    const merkleProof = tree.genMerklePath(ownedLeaves[LEAF_IDX]);
    const [proof, publicSignals] = await genGroth16Proof(
        leafHistory[ownedLeaves[LEAF_IDX]],
        ownedLeaves[LEAF_IDX],
        tree.root,
        <string>process.env.TREASURY_PRIVKEY,
        merkleProof,
    );
    await proveSanityCheck(proof, publicSignals);
    // await sendProofTx(proof, publicSignals);
    process.exit(0);
})();
