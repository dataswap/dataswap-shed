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
import * as countries from "i18n-iso-countries"
import { DatasetState } from "@dataswapjs/dataswapjs"
import { handleEvmError, logMethodCall } from "../../../shared/utils/utils"
import { chainSuccessInterval, blockPeriod } from "../../../shared/constant"
import { DatasetMetadata, DatasetReplicaRequirements } from "../types"
import { Context } from "../../../shared/context"

/**
 * Represents a collection of dataset metadata related operations.
 */
export class DatasetMetadatas {
    /**
     * Submits dataset metadata to the blockchain.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async submitDatasetMetadata(options: {
        context: Context
        path: string
    }): Promise<{
        datasetId: number
        proofBlockCount: bigint
        auditBlockCount: bigint
    }> {
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
            datasetId = Number(
                await handleEvmError(
                    options.context.evm.datasetMetadata.getDatasetIdForAccessMethod(
                        datasetMetadata.accessMethod
                    )
                )
            )
        } else {
            options.context.evm.datasetMetadata
                .getWallet()
                .add(process.env.storageClientPrivateKey!)
            const tx = await handleEvmError(
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

            // Get transaction receipt and event arguments
            const receipt =
                await options.context.evm.datasetMetadata.getTransactionReceipt(
                    tx.hash
                )

            const ret = options.context.evm.datasetMetadata.getEvmEventArgs(
                receipt!,
                "DatasetMetadataSubmitted"
            )

            datasetId = Number(ret.data.datasetId)
        }

        const datasetTimeoutParameters =
            await this.updateDatasetTimeoutParameters({
                context: options.context,
                datasetId,
                proofBlockCount: datasetMetadata.proofBlockCount,
                auditBlockCount: datasetMetadata.auditBlockCount,
            })

        return {
            datasetId,
            proofBlockCount: datasetTimeoutParameters.proofBlockCount,
            auditBlockCount: datasetTimeoutParameters.auditBlockCount,
        }
    }

    /**
     * Update dataset timeout parameters to the blockchain.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async updateDatasetTimeoutParameters(options: {
        context: Context
        datasetId: number
        proofBlockCount: bigint
        auditBlockCount: bigint
    }): Promise<{
        state: boolean
        proofBlockCount: bigint
        auditBlockCount: bigint
    }> {
        options.context.evm.datasetMetadata
            .getWallet()
            .add(process.env.storageClientPrivateKey!)

        const minProofBlockCount = await handleEvmError(
            options.context.evm.filplus.datasetRuleMinProofTimeout()
        )
        const minAuditBlockCount = await handleEvmError(
            options.context.evm.filplus.datasetRuleMinAuditTimeout()
        )

        options.proofBlockCount =
            options.proofBlockCount > minProofBlockCount
                ? options.proofBlockCount
                : minProofBlockCount + BigInt(1)
        options.auditBlockCount =
            options.auditBlockCount > minAuditBlockCount
                ? options.auditBlockCount
                : minAuditBlockCount + BigInt(1)

        const tx = await handleEvmError(
            options.context.evm.datasetMetadata.updateDatasetTimeoutParameters(
                options.datasetId,
                options.proofBlockCount,
                options.auditBlockCount
            )
        )
        // Wait chain success interval
        await options.context.evm.datasetMetadata.waitForBlockHeight(
            tx.blockNumber + chainSuccessInterval,
            blockPeriod
        )

        const datasetTimeoutParameters = await handleEvmError(
            options.context.evm.datasetMetadata.getDatasetTimeoutParameters(
                options.datasetId
            )
        )
        const state =
            options.proofBlockCount ==
                datasetTimeoutParameters.proofBlockCount &&
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
    @logMethodCall(["context"])
    async submitDatasetReplicaRequirements(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const datasetReplicaRequirements = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as DatasetReplicaRequirements

        if (
            !(await this.checkSubmissionRequirementsCriteria({
                context: options.context,
                datasetReplicaRequirements,
            }))
        ) {
            return false
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
                datasetReplicaRequirements.countries,
                datasetReplicaRequirements.cities,
                datasetReplicaRequirements.amount
            )
        )

        return true
    }

    /**
     * Get dataset state from the blockchain.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async getDatasetState(options: {
        context: Context
        datasetId: number
    }): Promise<DatasetState> {
        return await handleEvmError(
            options.context.evm.datasetMetadata.getDatasetState(
                options.datasetId
            )
        )
    }

    @logMethodCall(["context"])
    async getAllCountriesCallingCode(): Promise<{
        [numericKey: string]: string
    }> {
        return countries.getNumericCodes()
    }

    private async checkSubmissionRequirementsCriteria(options: {
        context: Context
        datasetReplicaRequirements: DatasetReplicaRequirements
    }): Promise<boolean> {
        const state = await handleEvmError(
            options.context.evm.datasetMetadata.getDatasetState(
                options.datasetReplicaRequirements.datasetId
            )
        )
        if (state != DatasetState.MetadataSubmitted) {
            console.log("Dataset state is not MetadataSubmitted, do nothing~")
            return false
        }
        for (const country of options.datasetReplicaRequirements.countries) {
            if (!countries.isValid(Number(country))) {
                console.log(
                    "Dataset replic requirements countries invalid:",
                    country
                )
                return false
            }
        }

        return true
    }
}
