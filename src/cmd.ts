/*******************************************************************************
 *   (c) 2023 dataswap
 *
 *  Licensed under either the MIT License (the "MIT License") or the Apache License, Version 2.0
 *  (the "Apache License"). You may not use this file except in compliance with one of these
 *  licenses. You may obtain a copy of the MIT License at
 *
 *      https://opensource.org/licenses/MIT
 *
 *  Or the Apache License, Version 2.0 at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the MIT License or the Apache License for the specific language governing permissions and
 *  limitations under the respective licenses.
 ********************************************************************************/

import yargs from "yargs"
import { DatasetMetadatas } from "./dataset/metadata/repo"
import { DatasetProofs } from "./dataset/proof/repo"
import { Matching } from "./matching/repo"
import { Storages } from "./storages/repo"
import { Finance } from "./finance/repo"

import { Context } from "./shared/context"

/**
 * Executes the command based on the parsed command-line arguments.
 */
export async function run(context: Context) {
    switch (argv._[0]) {
        case "dataset":
            await dataset(context, argv)
            break
        case "matching":
            await matching(context, argv)
            break
        case "storage":
            await storage(context, argv)
            break
        case "finance":
            await finance(context, argv)
            break
        default:
            console.log("Unknown command.")
    }
}

/**
 * Parses the command line arguments and executes the corresponding command.
 */
var argv = yargs
    .command("dataset", "dataset [options] [command]", function (yargs) {
        argv = datasetCommand(yargs)
    })
    .command("matching", "matching [options] [command]", function (yargs) {
        argv = matchingCommand(yargs)
    })
    .command("storage", "storage [options] [command]", function (yargs) {
        argv = storageCommand(yargs)
    })
    .command("finance", "finance [options] [command]", function (yargs) {
        argv = financeCommand(yargs)
    })
    .help()
    .alias("help", "h")
    .parseSync()

/**
 * Defines and configures the command-line interface for dataset-related commands.
 * @param yargs The yargs instance to configure.
 * @returns The parsed command-line options.
 */
function datasetCommand(yargs: yargs.Argv<{}>): {
    [x: string]: unknown
    _: (string | number)[]
    $0: string
} {
    return yargs
        .command("submitDatasetMetadata", "Submit dataset metadata", {
            path: {
                description: "Dataset metadata file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command(
            "updateDatasetTimeoutParameters",
            "Update dataset timeout parameters",
            {
                datasetId: {
                    description: "Dataset Id",
                    alias: "i",
                    demandOption: true,
                    type: "number",
                },
                proofBlockCount: {
                    description: "Proof block count",
                    alias: "p",
                    demandOption: true,
                    type: "string",
                },
                auditBlockCount: {
                    description: "Audit block count",
                    alias: "a",
                    demandOption: true,
                    type: "string",
                },
            }
        )
        .command(
            "submitDatasetReplicaRequirements",
            "Submit dataset replica requirements",
            {
                path: {
                    description: "Dataset ReplicaRequirements file path",
                    alias: "p",
                    demandOption: true,
                    type: "string",
                },
            }
        )
        .command("submitDatasetProof", "Submit dataset proof", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                demandOption: true,
                type: "number",
            },
            dataType: {
                description: "Dataset type",
                alias: "t",
                demandOption: true,
                type: "number",
            },
            mappingFilesAccessMethod: {
                description: "Mapping files access method",
                alias: "m",
                demandOption: true,
                type: "string",
            },
            path: {
                description: "Dataset proof file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
            chunk: {
                description: "One-time submission proof count",
                alias: "c",
                demandOption: true,
                type: "number",
            },
        })
        .command("completeEscrow", "completeEscrow", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                demandOption: true,
                type: "number",
            },
        })
        .command(
            "submitDatasetProofCompleted",
            "Submit dataset proof completed",
            {
                datasetId: {
                    description: "Dataset Id",
                    alias: "i",
                    demandOption: true,
                    type: "number",
                },
            }
        )
        .command("nominateAsDatasetAuditorCandidate", "auditor stake amount", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                demandOption: true,
                type: "number",
            },
        })
        .command(
            "getAuditorElectionState",
            "Get auditor election state: end=true,processing=false",
            {
                datasetId: {
                    description: "Dataset Id",
                    alias: "i",
                    demandOption: true,
                    type: "number",
                },
            }
        )
        .command("isWinner", "The account is the dataset auditor winner", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                demandOption: true,
                type: "number",
            },
            account: {
                description: "winner account",
                alias: "a",
                demandOption: true,
                type: "string",
            },
        })
        .command(
            "submitDatasetChallengeProofs",
            "Submit dataset challenge proofs",
            {
                datasetId: {
                    description: "Dataset Id",
                    alias: "i",
                    demandOption: true,
                    type: "number",
                },
                path: {
                    description: "Dataset challenge proof file path",
                    alias: "p",
                    demandOption: true,
                    type: "string",
                },
            }
        )
        .command("getDatasetState", "Get dataset state", {
            datasetId: {
                description:
                    "dataset state: None = 0,MetadataSubmitted=1,RequirementSubmitted=2,WaitEscrow=3,ProofSubmitted=4,Approved=5,Rejected=6",
                alias: "i",
                demandOption: true,
                type: "number",
            },
        })
        .help()
        .alias("help", "h")
        .parseSync()
}

/**
 * Defines and configures the command-line interface for matching-related commands.
 * @param yargs The yargs instance to configure.
 * @returns The parsed command-line options.
 */
function matchingCommand(yargs: yargs.Argv<{}>): {
    [x: string]: unknown
    _: (string | number)[]
    $0: string
} {
    return yargs
        .command("createMatching", "Create matching", {
            path: {
                description: "Matching metadata file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command("createTarget", "Create target", {
            path: {
                description: "Matching target file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command("publishMatching", "Publish matching", {
            path: {
                description: "Matching publish file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command("getCarsIds", "Get cars Ids", {
            path: {
                description: "cars Ids file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command("bidding", "Bidding matching", {
            matchingId: {
                description: "Matching Id",
                alias: "m",
                demandOption: true,
                type: "number",
            },
            amount: {
                description: "Bidding amount",
                alias: "a",
                demandOption: true,
                type: "string",
            },
        })
        .command("getMatchingState", "Get matching state", {
            matchingId: {
                description:
                    "matching state: None = 0,Published = 1,InProgress = 2,Paused = 3,Closed = 4,Completed=5,Cancelled=6,Failed=7",
                alias: "m",
                demandOption: true,
                type: "number",
            },
        })
        .help()
        .alias("help", "h")
        .parseSync()
}

/**
 * Defines and configures the command-line interface for storage-related commands.
 * @param yargs The yargs instance to configure.
 * @returns The parsed command-line options.
 */
function storageCommand(yargs: yargs.Argv<{}>): {
    [x: string]: unknown
    _: (string | number)[]
    $0: string
} {
    return yargs
        .command("registDataswapDatacap", "Regist dataswap datacap", {
            size: {
                description: "The regist dataswap datacap size",
                alias: "s",
                demandOption: true,
                type: "number",
            },
        })
        .command("requestAllocateDatacap", "Request allocate datacap", {
            matchingId: {
                description: "The matching Id",
                alias: "m",
                demandOption: true,
                type: "number",
            },
        })
        .command("submitStorageClaimIds", "Submit storage claimIds", {
            path: {
                description: "Storage claimIds file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command("completeStorage", "Complete storage", {
            path: {
                description: "Complete storage invalid claimIds file path",
                alias: "p",
                demandOption: true,
                type: "string",
            },
        })
        .command(
            "isNextDatacapAllocationValid",
            "Next datacap allocation valid state",
            {
                matchingId: {
                    description: "The matching Id",
                    alias: "m",
                    demandOption: true,
                    type: "number",
                },
            }
        )
        .command("isStorageCompleted", "Storage is Completed state", {
            matchingId: {
                description: "The matching Id",
                alias: "m",
                demandOption: true,
                type: "number",
            },
        })
        .command("isStorageExpiration", "Storage is expiration state", {
            matchingId: {
                description: "The matching Id",
                alias: "m",
                demandOption: true,
                type: "number",
            },
        })
        .help()
        .alias("help", "h")
        .parseSync()
}

/**
 * Defines and configures the command-line interface for finance-related commands.
 * @param yargs The yargs instance to configure.
 * @returns The parsed command-line options.
 */
function financeCommand(yargs: yargs.Argv<{}>): {
    [x: string]: unknown
    _: (string | number)[]
    $0: string
} {
    return yargs
        .command("deposit", "deposit amount", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                demandOption: true,
                type: "number",
            },
            matchingId: {
                description: "Matching Id",
                alias: "m",
                demandOption: true,
                type: "number",
            },
            owner: {
                description: "The finance account user",
                alias: "o",
                demandOption: true,
                type: "string",
            },
            token: {
                description: "The finance token type",
                alias: "t",
                type: "string",
                default: "0x0000000000000000000000000000000000000000",
            },
            amount: {
                description: "deposit amount",
                alias: "a",
                demandOption: true,
                type: "string",
            },
        })
        .command("getEscrowRequirement", "Get escrow requirement", {
            datasetId: {
                description: "Dataset Id",
                alias: "i",
                type: "number",
            },
            size: {
                description:
                    "Data size, when DatacapCollateralRequirment and DatacapChunkLandRequirment",
                alias: "s",
                type: "number",
            },
            replicasCount: {
                description: "Replicas count, when DatacapCollateralRequirment",
                alias: "r",
                type: "number",
            },
            type: {
                description:
                    "escrow type:(DatacapCollateralRequirment=0; DatacapChunkLandRequirment=1; ChallengeCommissionRequirment=2; ChallengeAuditCollateralRequirment=3; ProofAuditCollateralRequirment=4; DisputeAuditCollateralRequirment=5)",
                alias: "t",
                demandOption: true,
                type: "number",
            },
        })
        .help()
        .alias("help", "h")
        .parseSync()
}

/**
 * Handles dataset-related operations.
 * @param context The context object.
 * @param argv The argument object containing command-line inputs.
 */
async function dataset(
    context: Context,
    argv: {
        [x: string]: unknown
        _: (string | number)[]
        $0: string
    }
) {
    switch (argv._[1]) {
        case "submitDatasetMetadata":
            await new DatasetMetadatas().submitDatasetMetadata({
                context,
                path: String(argv.path),
            })
            break
        case "updateDatasetTimeoutParameters":
            console.log(
                await new DatasetMetadatas().updateDatasetTimeoutParameters({
                    context,
                    datasetId: Number(argv.datasetId),
                    proofBlockCount: BigInt(String(argv.proofBlockCount)),
                    auditBlockCount: BigInt(String(argv.auditBlockCount)),
                })
            )
            break
        case "submitDatasetReplicaRequirements":
            await new DatasetMetadatas().submitDatasetReplicaRequirements({
                context,
                path: String(argv.path),
            })
            break
        case "submitDatasetProof":
            await new DatasetProofs().submitDatasetProof({
                context,
                datasetId: Number(argv.datasetId),
                dataType: Number(argv.dataType),
                mappingFilesAccessMethod: String(argv.mappingFilesAccessMethod),
                path: String(argv.path),
                chunk: Number(argv.chunk),
            })
            break
        case "completeEscrow":
            await new DatasetProofs().completeEscrow({
                context,
                datasetId: Number(argv.datasetId),
            })
            break
        case "submitDatasetProofCompleted":
            await new DatasetProofs().submitDatasetProofCompleted({
                context,
                datasetId: Number(argv.datasetId),
            })
            break
        case "nominateAsDatasetAuditorCandidate":
            await new DatasetProofs().nominateAsDatasetAuditorCandidate({
                context,
                datasetId: Number(argv.datasetId),
            })
            break
        case "getAuditorElectionState":
            await new DatasetProofs().getAuditorElectionState({
                context,
                datasetId: Number(argv.datasetId),
            })
            break
        case "isWinner":
            await new DatasetProofs().isWinner({
                context,
                datasetId: Number(argv.datasetId),
                account: String(argv.account),
            })
            break
        case "submitDatasetChallengeProofs":
            await new DatasetProofs().submitDatasetChallengeProofs({
                context,
                datasetId: Number(argv.datasetId),
                path: String(argv.path),
            })
            break
        case "getDatasetState":
            await new DatasetMetadatas().getDatasetState({
                context,
                datasetId: Number(argv.datasetId),
            })
            break
    }
}

/**
 * Handles matching-related operations.
 * @param context The context object.
 * @param argv The argument object containing command-line inputs.
 */
async function matching(
    context: Context,
    argv: {
        [x: string]: unknown
        _: (string | number)[]
        $0: string
    }
) {
    switch (argv._[1]) {
        case "createMatching":
            await new Matching().createMatching({
                context,
                path: String(argv.path),
            })
            break
        case "createTarget":
            await new Matching().createTarget({
                context,
                path: String(argv.path),
            })
            break
        case "publishMatching":
            await new Matching().publishMatching({
                context,
                path: String(argv.path),
            })
            break
        case "getCarsIds":
            await new Matching().getCarsIds({
                context,
                path: String(argv.path),
            })
            break
        case "bidding":
            await new Matching().bidding({
                context,
                matchingId: Number(argv.matchingId),
                amount: BigInt(String(argv.amount)),
            })
            break
        case "getMatchingState":
            await new Matching().getMatchingState({
                context,
                matchingId: Number(argv.matchingId),
            })
            break
    }
}

/**
 * Handles storage-related operations.
 * @param context The context object.
 * @param argv The argument object containing command-line inputs.
 */
async function storage(
    context: Context,
    argv: {
        [x: string]: unknown
        _: (string | number)[]
        $0: string
    }
) {
    switch (argv._[1]) {
        case "registDataswapDatacap":
            await new Storages().registDataswapDatacap({
                context,
                size: Number(argv.size),
            })
            break
        case "requestAllocateDatacap":
            await new Storages().requestAllocateDatacap({
                context,
                matchingId: Number(argv.matchingId),
            })
            break
        case "submitStorageClaimIds":
            await new Storages().submitStorageClaimIds({
                context,
                path: String(argv.path),
            })
            break
        case "completeStorage":
            await new Storages().completeStorage({
                context,
                path: String(argv.path),
            })
            break
        case "isNextDatacapAllocationValid":
            await new Storages().isNextDatacapAllocationValid({
                context,
                matchingId: Number(argv.matchingId),
            })
            break
        case "isStorageCompleted":
            await new Storages().isStorageCompleted({
                context,
                matchingId: Number(argv.matchingId),
            })
            break
        case "isStorageExpiration":
            await new Storages().isStorageExpiration({
                context,
                matchingId: Number(argv.matchingId),
            })
            break
    }
}

/**
 * Handles finance-related operations.
 * @param context The context object.
 * @param argv The argument object containing command-line inputs.
 */
async function finance(
    context: Context,
    argv: {
        [x: string]: unknown
        _: (string | number)[]
        $0: string
    }
) {
    switch (argv._[1]) {
        case "deposit":
            await new Finance().deposit({
                context,
                datasetId: Number(argv.datasetId),
                matchingId: Number(argv.matchingId),
                owner: String(argv.owner),
                token: String(argv.token),
                amount: BigInt(String(argv.amount)),
            })
            break
        case "getEscrowRequirement":
            console.log(
                "amount: ",
                await new Finance().getEscrowRequirement({
                    context,
                    datasetId: Number(argv.datasetId),
                    size: Number(argv.size),
                    type: Number(argv.type),
                    replicasCount: Number(argv.replicasCount),
                })
            )
            break
    }
}
