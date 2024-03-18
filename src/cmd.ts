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
    submitDatasetProof,
    submitDatasetChallengeProofs,
} from "./dataset/proof/repo"
import { getEscrowRequirement } from "./finance/repo"

import { Context } from "./shared/context"

/**
 * Parses the command line arguments and executes the corresponding command.
 */
const argv = yargs
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
        case "getEscrowRequirement":
            console.log(
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
