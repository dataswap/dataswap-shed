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

import { DataType } from "@dataswapjs/dataswapjs"
import fs from "fs"

import {
    chainSuccessInterval,
    blockPeriod,
    defaultEthAddress,
} from "../../../shared/constant"
import {
    handleEvmError,
    FileLock,
    logMethodCall,
} from "../../../shared/utils/utils"
import { DatasetProof, DatasetProofSubmitInfo } from "../types"
import { Context } from "../../../shared/context"

/**
 * Represents a collection of methods for interacting with dataset proofs on the blockchain network.
 */
export class DatasetProofs {
    /**
     * Submits the dataset proof to the blockchain network.
     * @param network The network to submit the dataset proof to.
     * @param datasetId The ID of the dataset.
     * @param dataType The type of the dataset.
     * @param mappingFilesAccessMethod The method to access mapping files.
     * @param path The file path of the dataset proof.
     * @param chunk The number of dataset proof chunks to submit at a time.
     * @returns A promise that resolves to true if the submission is successful, otherwise false.
     */
    @logMethodCall(["context"])
    async submitDatasetProof(options: {
        context: Context
        datasetId: number
        dataType: DataType
        mappingFilesAccessMethod: string
        path: string
        chunk: number
    }): Promise<boolean> {
        const lock = new FileLock(
            String(options.datasetId) + String(options.dataType)
        )
        if (!lock.acquireLock()) {
            console.log(
                "Failed to acquire lock, another process may be using the file"
            )
        }

        try {
            const submitInfo = new DatasetProofSubmitInfo({
                datasetId: options.datasetId,
                dataType: options.dataType,
                mappingFilesAccessMethod: options.mappingFilesAccessMethod,
                chunk: options.chunk,
                completed: false,
                leafIndex: 0,
                leafHashes: [],
                leafSizes: [],
            })

            if (
                !(await this.checkSubmissionProofsCriteria(
                    options.context.evm.datasetProof,
                    options.datasetId,
                    options.dataType
                ))
            ) {
                return false
            }

            const datasetProof = JSON.parse(
                fs.readFileSync(options.path).toString()
            )

            options.context.evm.datasetProof
                .getWallet()
                .add(process.env.datasetPreparerPrivateKey!)

            if (
                !(await this.handlerSubmitDatasetProofRoot({
                    context: options.context,
                    submitInfo,
                    datasetProof,
                }))
            ) {
                return false
            }

            if (
                !(await this.handlerSubmitDatasetProof({
                    context: options.context,
                    submitInfo,
                    datasetProof,
                }))
            ) {
                return false
            }

            return true
        } finally {
            lock.releaseLock()
        }
    }

    /**
     * Submits the completion of dataset proof for a given dataset ID.
     *
     * @param options - The options object containing the context and dataset ID.
     * @returns A Promise that resolves when the dataset proof completion is submitted successfully.
     */
    @logMethodCall(["context"])
    async submitDatasetProofCompleted(options: {
        context: Context
        datasetId: number
    }): Promise<boolean> {
        options.context.evm.datasetProof
            .getWallet()
            .add(process.env.datasetAuditerPrivateKey!)
        await handleEvmError(
            options.context.evm.datasetProof.submitDatasetProofCompleted(
                options.datasetId
            )
        )
        return true
    }

    /**
     * Submits the dataset challenge proof to the blockchain network.
     * @param network The network to submit the dataset proof to.
     * @param datasetId The ID of the dataset.
     * @param path The file path of the dataset proof.
     * @returns A promise that resolves to true if the submission is successful, otherwise false.
     */
    @logMethodCall(["context"])
    async submitDatasetChallengeProofs(options: {
        context: Context
        datasetId: number
        path: string
    }): Promise<boolean> {
        const lock = new FileLock(String(options.datasetId) + options.path)
        if (!lock.acquireLock()) {
            console.log(
                "Failed to acquire lock, another process may be using the file"
            )
        }

        try {
            const datasetChallengeProof = JSON.parse(
                fs.readFileSync(options.path).toString()
            )

            if (
                !(await this.checkSubmissionChallengeProofsCriteria(
                    options.context.evm.datasetChallenge,
                    options.datasetId,
                    process.env.datasetAuditerAccount!,
                    datasetChallengeProof.RandomSeed
                ))
            ) {
                return false
            }

            options.context.evm.datasetChallenge
                .getWallet()
                .add(process.env.datasetAuditerPrivateKey!)
            await handleEvmError(
                options.context.evm.datasetChallenge.submitDatasetChallengeProofs(
                    datasetChallengeProof.DatasetId,
                    datasetChallengeProof.RandomSeed,
                    datasetChallengeProof.Leaves,
                    datasetChallengeProof.Siblings,
                    datasetChallengeProof.Paths
                )
            )

            return true
        } finally {
            lock.releaseLock()
        }
    }

    /**
     * Auditor stake to the blockchain network.
     * @param network The network to submit the dataset proof to.
     * @param datasetId The ID of the dataset.
     * @returns A promise that resolves to true if the submission is successful, otherwise false.
     */
    @logMethodCall(["context"])
    async auditorStake(options: {
        context: Context
        datasetId: number
    }): Promise<boolean> {
        options.context.evm.datasetChallenge
            .getWallet()
            .add(process.env.datasetAuditerPrivateKey!)
        await handleEvmError(
            options.context.evm.datasetChallenge.auditorStake(
                options.datasetId,
                BigInt("1000000000000000000")
            )
        )
        return true
    }

    /**
     * Complete escrow to the blockchain network.
     * @param network The network to submit the dataset proof to.
     * @param datasetId The ID of the dataset.
     * @returns A promise that resolves to true if the submission is successful, otherwise false.
     */
    @logMethodCall(["context"])
    async completeEscrow(options: {
        context: Context
        datasetId: number
    }): Promise<boolean> {
        options.context.evm.datasetProof
            .getWallet()
            .add(process.env.datasetAuditerPrivateKey!)
        await handleEvmError(
            options.context.evm.datasetProof.completeEscrow(options.datasetId)
        )
        return true
    }

    /**
     * Handles the submission of the dataset proof root to the Ethereum Virtual Machine (EVM).
     * @param submitInfo - Information about the dataset proof submission.
     * @param datasetProof - The dataset proof data.
     * @returns A promise resolving to true if the submission is successful, otherwise false.
     */
    private async handlerSubmitDatasetProofRoot(options: {
        context: Context
        submitInfo: DatasetProofSubmitInfo
        datasetProof: DatasetProof
    }): Promise<boolean> {
        const root = ""
        /// TODO: Add getDatasetProofRoot function, https://github.com/dataswap/core/issues/354
        /*await handleEvmError(
            options.context.evm.datasetProof.getDatasetProofRoot(
                options.submitInfo.datasetId,
                options.submitInfo.dataType
            )
        )*/

        if (root == "") {
            console.log("Root is null, start submitDatasetProofRoot~")

            const tx = await handleEvmError(
                options.context.evm.datasetProof.submitDatasetProofRoot(
                    options.submitInfo.datasetId,
                    options.submitInfo.dataType,
                    options.submitInfo.mappingFilesAccessMethod,
                    options.datasetProof.Root
                )
            )

            // Wait chain success interval
            await options.context.evm.datasetMetadata.waitForBlockHeight(
                tx.blockNumber + chainSuccessInterval,
                blockPeriod
            )

            const submitter = await handleEvmError(
                options.context.evm.datasetProof.getDatasetProofSubmitter(
                    options.submitInfo.datasetId
                )
            )
            if (submitter == defaultEthAddress) {
                console.error("submitDatasetProofRoot fail")
                return false
            }
            console.log("submitDatasetProofRoot success")
        } else {
            console.log("submitDatasetProofRoot had submited")
        }

        return true
    }

    /**
     * Handles the submission of the dataset proof.
     * @param submitInfo Information about the dataset proof submission.
     * @param datasetProof The dataset proof data.
     * @returns A promise that resolves to true if the submission is successful, otherwise false.
     */
    private async handlerSubmitDatasetProof(options: {
        context: Context
        submitInfo: DatasetProofSubmitInfo
        datasetProof: DatasetProof
    }): Promise<boolean> {
        const index = Number(
            await handleEvmError(
                options.context.evm.datasetProof.getDatasetProofCount(
                    options.submitInfo.datasetId,
                    options.submitInfo.dataType
                )
            )
        )
        options.submitInfo.updateLeafIndex(index)

        while (!options.submitInfo.completed) {
            options.submitInfo.updateDatasetProof(options.datasetProof)
            console.log(
                "Start submitDatasetProof",
                "submitInfo",
                options.submitInfo
            )
            const tx = await handleEvmError(
                options.context.evm.datasetProof.submitDatasetProof(
                    options.submitInfo.datasetId,
                    options.submitInfo.dataType,
                    options.submitInfo.leafHashes,
                    options.submitInfo.leafIndex,
                    options.submitInfo.leafSizes,
                    options.submitInfo.completed
                )
            )

            // Wait chain success interval
            await options.context.evm.datasetMetadata.waitForBlockHeight(
                tx.blockNumber + chainSuccessInterval,
                blockPeriod
            )
            const index = Number(
                await handleEvmError(
                    options.context.evm.datasetProof.getDatasetProofCount(
                        options.submitInfo.datasetId,
                        options.submitInfo.dataType
                    )
                )
            )

            const current = Math.min(
                options.submitInfo.leafIndex + options.submitInfo.chunk,
                options.datasetProof.LeafHashes.length
            )
            if (index !== current) {
                console.log("SubmitDatasetProof fail, leafIndex:", index)
                return false
            }

            console.log(
                "SubmitDatasetProof success, leafIndex:",
                options.submitInfo.leafIndex
            )

            options.submitInfo.updateLeafIndex(index)
        }

        return true
    }

    /**
     * Checks if the criteria for submitting dataset challenge proofs are met.
     * @param datasetChallengeEvm - The Ethereum Virtual Machine instance for dataset challenge proofs.
     * @param datasetId - The ID of the dataset.
     * @param auditor - The auditor's address who submits the challenge proof.
     * @param randomSeed - The random seed used in generating the challenge.
     * @returns A Promise that resolves to a boolean indicating whether the criteria are met (true) or not (false).
     */
    private async checkSubmissionChallengeProofsCriteria(
        datasetChallengeEvm: any,
        datasetId: number,
        auditor: string,
        randomSeed: bigint
    ): Promise<boolean> {
        if (
            await handleEvmError(
                datasetChallengeEvm.isDatasetChallengeProofDuplicate(
                    datasetId,
                    auditor,
                    randomSeed
                )
            )
        ) {
            console.log("Dataset challenge proof had submited, do nothing~")
            return false
        }

        if (
            !(await handleEvmError(
                datasetChallengeEvm.isWinner(datasetId, auditor)
            ))
        ) {
            console.log(
                "Can't submit the dataset challenge proof(not the winner), do nothing~"
            )
            return false
        }

        return true
    }

    /**
     * Checks if the criteria for submitting dataset proofs are met.
     * @param datasetProofEvm - The Ethereum Virtual Machine instance for dataset proofs.
     * @param datasetId - The ID of the dataset.
     * @param dataType - The type of the dataset.
     * @returns A Promise that resolves to a boolean indicating whether the criteria are met (true) or not (false).
     */
    private async checkSubmissionProofsCriteria(
        datasetProofEvm: any,
        datasetId: number,
        dataType: DataType
    ): Promise<boolean> {
        if (
            await handleEvmError(
                datasetProofEvm.isDatasetProofallCompleted(datasetId, dataType)
            )
        ) {
            console.log("All dataset proof had completed, do nothing~")
            return false
        }

        return true
    }
}
