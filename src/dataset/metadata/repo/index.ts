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

import fs from "fs"
import { DatasetState } from "@dataswapjs/dataswapjs"
import { handleEvmError } from "../../../shared/utils/utils"
import { chainSuccessInterval } from "../../../shared/constant"
import { DatasetMetadata, DatasetReplicaRequirements } from "../types"
import { Context } from "../../../shared/context"

/**
 * Submits dataset metadata to the blockchain.
 * @param options - The options object containing the context and file path.
 * @returns A promise indicating whether the submission was successful.
 */
export async function submitDatasetMetadata(options: {
    context: Context
    path: string
}): Promise<void> {
    console.log(
        "Start submitDatasetMetadata:",
        "network:",
        options.context.network,
        "path:",
        options.path
    )

    const datasetMetadata = JSON.parse(
        fs.readFileSync(options.path).toString()
    ) as DatasetMetadata

    let datasetId
    if (
        await handleEvmError(
            options.context.evm.datasetMetadata.hasDatasetMetadata(
                datasetMetadata.accessMethod
            )
        )
    ) {
        console.log("Dataset metadata had submited")
        datasetId = await handleEvmError(
            options.context.evm.datasetMetadata.getDatasetIdForAccessMethod(
                datasetMetadata.accessMethod
            )
        )
    } else {
        options.context.evm.datasetMetadata
            .getWallet()
            .add(process.env.storageClientPrivateKey!)
        datasetId = await handleEvmError(
            options.context.evm.datasetMetadata.submitDatasetMetadata(
                datasetMetadata.client,
                datasetMetadata.title,
                datasetMetadata.industry,
                datasetMetadata.name,
                datasetMetadata.description,
                datasetMetadata.source,
                datasetMetadata.accessMethod,
                datasetMetadata.sizeInBytes,
                datasetMetadata.isPublic,
                datasetMetadata.version
            )
        )
    }

    const datasetTimeoutParameters = await updateDatasetTimeoutParameters({
        context: options.context,
        datasetId,
        proofBlockCount: datasetMetadata.proofBlockCount,
        auditBlockCount: datasetMetadata.auditBlockCount,
    })

    console.log({
        datasetId,
        proofBlockCount: datasetTimeoutParameters.proofBlockCount,
        auditBlockCount: datasetTimeoutParameters.auditBlockCount,
    })
}

/**
 * Update dataset timeout parameters to the blockchain.
 * @param options - The options object containing the context and file path.
 * @returns A promise indicating whether the submission was successful.
 */
export async function updateDatasetTimeoutParameters(options: {
    context: Context
    datasetId: number
    proofBlockCount: bigint
    auditBlockCount: bigint
}): Promise<{
    state: boolean
    proofBlockCount: bigint
    auditBlockCount: bigint
}> {
    console.log(
        "Start updateDatasetTimeoutParameters:",
        "network:",
        options.context.network,
        "datasetId",
        options.datasetId,
        "proofBlockCount:",
        options.proofBlockCount,
        "auditBlockCount",
        options.auditBlockCount
    )

    options.context.evm.datasetMetadata
        .getWallet()
        .add(process.env.storageClientPrivateKey!)

    if (await isDatasetTimeoutParametersValid(options)) {
        const tx = await handleEvmError(
            options.context.evm.datasetMetadata.updateDatasetTimeoutParameters(
                options.datasetId,
                options.proofBlockCount,
                options.auditBlockCount
            )
        )
        // Wait chain success interval
        await handleEvmError(
            options.context.evm.datasetMetadata.waitForBlockHeight(
                tx.height + chainSuccessInterval
            )
        )
    }

    const datasetTimeoutParameters = await handleEvmError(
        options.context.evm.datasetMetadata.getDatasetTimeoutParameters(
            options.datasetId
        )
    )
    const state =
        options.proofBlockCount == datasetTimeoutParameters.proofBlockCount &&
        options.auditBlockCount == datasetTimeoutParameters.auditBlockCount
            ? true
            : false
    return {
        state,
        proofBlockCount: datasetTimeoutParameters.proofBlockCount,
        auditBlockCount: datasetTimeoutParameters.auditBlockCount,
    }
}

/**
 * Submits dataset replica requirements to the blockchain.
 * @param options - The options object containing the context and file path.
 * @returns A promise indicating whether the submission was successful.
 */
export async function submitDatasetReplicaRequirements(options: {
    context: Context
    path: string
}): Promise<boolean> {
    console.log(
        "Start submitDatasetReplicaRequirements:",
        "network:",
        options.context.network,
        "path:",
        options.path
    )

    const datasetReplicaRequirements = JSON.parse(
        fs.readFileSync(options.path).toString()
    ) as DatasetReplicaRequirements

    const state = await handleEvmError(
        options.context.evm.datasetMetadata.getDatasetState(
            datasetReplicaRequirements.datasetId
        )
    )
    if (state != DatasetState.MetadataSubmitted) {
        console.log("Dataset state is not MetadataSubmitted, do nothing~")
        return true
    }

    options.context.evm.datasetRequirement
        .getWallet()
        .add(process.env.storageClientPrivateKey!)
    await handleEvmError(
        options.context.evm.datasetRequirement.submitDatasetReplicaRequirements(
            datasetReplicaRequirements.datasetId,
            datasetReplicaRequirements.dataPreparers,
            datasetReplicaRequirements.storageProviders,
            datasetReplicaRequirements.regions,
            datasetReplicaRequirements.countrys,
            datasetReplicaRequirements.citys,
            datasetReplicaRequirements.amount
        )
    )

    return true
}

async function isDatasetTimeoutParametersValid(options: {
    context: Context
    proofBlockCount: bigint
    auditBlockCount: bigint
}): Promise<boolean> {
    const minProofBlockCount = await handleEvmError(
        options.context.evm.filplus.datasetRuleMinProofTimeout()
    )
    const minAuditBlockCount = await handleEvmError(
        options.context.evm.filplus.datasetRuleMinAuditTimeout()
    )

    return options.proofBlockCount >= minProofBlockCount &&
        options.auditBlockCount >= minAuditBlockCount
        ? true
        : false
}
