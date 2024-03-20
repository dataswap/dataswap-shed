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
import {
    submitDatasetMetadata,
    updateDatasetTimeoutParameters,
    submitDatasetReplicaRequirements,
} from "./dataset/metadata/repo"
import {
    submitDatasetProof,
    submitDatasetChallengeProofs,
} from "./dataset/proof/repo"
import { getEscrowRequirement, deposit } from "./finance/repo"

import { Context } from "./shared/context"

/**
 * Parses the command line arguments and executes the corresponding command.
 */
const argv = yargs
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
            description: "Data size",
            alias: "s",
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

/**
 * Executes the command based on the parsed command-line arguments.
 */
export async function run(context: Context) {
    switch (argv._[0]) {
        case "submitDatasetMetadata":
            await submitDatasetMetadata({
                context,
                path: String(argv.path),
            })
            break
        case "updateDatasetTimeoutParameters":
            console.log(
                await updateDatasetTimeoutParameters({
                    context,
                    datasetId: Number(argv.datasetId),
                    proofBlockCount: argv.proofBlockCount as bigint,
                    auditBlockCount: argv.auditBlockCount as bigint,
                })
            )
            break
        case "submitDatasetReplicaRequirements":
            await submitDatasetReplicaRequirements({
                context,
                path: String(argv.path),
            })
            break
        case "submitDatasetProof":
            await submitDatasetProof({
                context,
                datasetId: Number(argv.datasetId),
                dataType: Number(argv.dataType),
                mappingFilesAccessMethod: String(argv.mappingFilesAccessMethod),
                path: String(argv.path),
                chunk: Number(argv.chunk),
            })
            break
        case "submitDatasetChallengeProofs":
            await submitDatasetChallengeProofs({
                context,
                datasetId: Number(argv.datasetId),
                path: String(argv.path),
            })
            break
        case "deposit":
            await deposit({
                context,
                datasetId: Number(argv.datasetId),
                matchingId: Number(argv.matchingId),
                owner: String(argv.owner),
                token: String(argv.token),
                amount: argv.amount as bigint,
            })
            break
        case "getEscrowRequirement":
            console.log(
                "amount: ",
                await getEscrowRequirement({
                    context,
                    datasetId: Number(argv.datasetId),
                    size: Number(argv.size),
                    type: Number(argv.type),
                })
            )
            break
        default:
            console.log("Unknown command.")
    }
}
