import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const CONTRACT_ABI = [
    {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                components: [
                    {
                        components: [
                            {
                                internalType: "bytes32",
                                name: "x",
                                type: "bytes32",
                            },
                            {
                                internalType: "bytes32",
                                name: "y",
                                type: "bytes32",
                            },
                        ],
                        internalType: "struct PrivateTreasury.Point",
                        name: "P",
                        type: "tuple",
                    },
                    {
                        components: [
                            {
                                internalType: "bytes32",
                                name: "x",
                                type: "bytes32",
                            },
                            {
                                internalType: "bytes32",
                                name: "y",
                                type: "bytes32",
                            },
                        ],
                        internalType: "struct PrivateTreasury.Point",
                        name: "Q",
                        type: "tuple",
                    },
                    {
                        internalType: "uint256",
                        name: "v",
                        type: "uint256",
                    },
                ],
                indexed: false,
                internalType: "struct PrivateTreasury.Leaf",
                name: "lf",
                type: "tuple",
            },
        ],
        name: "NewLeaf",
        type: "event",
    },
    {
        inputs: [],
        name: "POSEIDON_T3_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "POSEIDON_T6_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "VERIFIER_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            {
                                internalType: "bytes32",
                                name: "x",
                                type: "bytes32",
                            },
                            {
                                internalType: "bytes32",
                                name: "y",
                                type: "bytes32",
                            },
                        ],
                        internalType: "struct PrivateTreasury.Point",
                        name: "P",
                        type: "tuple",
                    },
                    {
                        components: [
                            {
                                internalType: "bytes32",
                                name: "x",
                                type: "bytes32",
                            },
                            {
                                internalType: "bytes32",
                                name: "y",
                                type: "bytes32",
                            },
                        ],
                        internalType: "struct PrivateTreasury.Point",
                        name: "Q",
                        type: "tuple",
                    },
                    {
                        internalType: "uint256",
                        name: "v",
                        type: "uint256",
                    },
                ],
                internalType: "struct PrivateTreasury.Leaf",
                name: "lf",
                type: "tuple",
            },
        ],
        name: "_hashLeaf",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "l",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "r",
                type: "uint256",
            },
        ],
        name: "_hashLeftRight",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "pk",
                type: "tuple",
            },
            {
                internalType: "string",
                name: "label",
                type: "string",
            },
        ],
        name: "create",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "P",
                type: "tuple",
            },
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "Q",
                type: "tuple",
            },
        ],
        name: "deposit",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "directory",
        outputs: [
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "pk",
                type: "tuple",
            },
            {
                internalType: "string",
                name: "label",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getDirectoryLength",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getNumDeposits",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "root",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "changeP",
                type: "tuple",
            },
            {
                components: [
                    {
                        internalType: "bytes32",
                        name: "x",
                        type: "bytes32",
                    },
                    {
                        internalType: "bytes32",
                        name: "y",
                        type: "bytes32",
                    },
                ],
                internalType: "struct PrivateTreasury.Point",
                name: "changeQ",
                type: "tuple",
            },
            {
                internalType: "uint256[2]",
                name: "a",
                type: "uint256[2]",
            },
            {
                internalType: "uint256[2][2]",
                name: "b",
                type: "uint256[2][2]",
            },
            {
                internalType: "uint256[2]",
                name: "c",
                type: "uint256[2]",
            },
            {
                internalType: "uint256[11]",
                name: "publicSignals",
                type: "uint256[11]",
            },
        ],
        name: "withdraw",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
];

function App() {
    const [managerBalance, setManagerBalance] = useState(0);
    const [contributorBalance, setContributorBalance] = useState(0);
    const [leaves, setLeaves] = useState([]);

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const privateTreasury = new ethers.Contract(
        CONTRACT_ADDR,
        CONTRACT_ABI,
        provider.getSigner(1)
    );

    function formatBalance(b) {
        return Math.round(ethers.utils.formatEther(b));
    }

    async function updateBalance() {
        setManagerBalance(
            formatBalance(await provider.getSigner(1).getBalance())
        );
        setContributorBalance(
            formatBalance(await provider.getSigner(2).getBalance())
        );
    }

    async function updateLeaves() {
        const newLeafEvents = await privateTreasury.queryFilter(
            privateTreasury.filters.NewLeaf()
        );
        const leafHistory = newLeafEvents.map((e) => {
            const solLf = e.args?.lf;
            return {
                P: `${solLf.P.toString(16).substring(0, 8)}...`,
                Q: `${solLf.Q.toString(16).substring(0, 8)}...`,
                v: ethers.utils.formatEther(solLf["v"]),
            };
        });
        setLeaves(leafHistory);
    }

    useEffect(() => {
        setInterval(() => {
            updateBalance();
            updateLeaves();
        }, 5000);
    });

    return (
        <div className="row">
            <div className="column">
                <h1>Create</h1>
            </div>
            <div className="column">
                <h1>Deposit</h1>
                <table>
                    <tr>
                        <th>P</th>
                        <th>Q</th>
                        <th>v</th>
                    </tr>
                    {leaves.map((lf) => (
                        <tr>
                            <td>{lf.P}</td>
                            <td>{lf.Q}</td>
                            <td>{lf.v}</td>
                        </tr>
                    ))}
                </table>
            </div>
            <div className="column">
                <h1>Withdraw</h1>
                <h3>Account Balance</h3>
                <ul>
                    <li>Manager: {managerBalance} ETH</li>
                    <li>Contributor: {contributorBalance} ETH</li>
                </ul>
            </div>
        </div>
    );
}

export default App;
