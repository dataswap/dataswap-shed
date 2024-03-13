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

import {
    DataType,
    datasetProofEvm_Calibration,
    datasetProofEvm_Main,
} from "@dataswapjs/dataswapjs"
import fs from "fs"

import {
    chainSuccessInterval,
    defaultEthAddress,
} from "../../../shared/constant"
import { handleEvmError, FileLock } from "../../../shared/utils/utils"
import { DatasetProof, DatasetProofSubmitInfo } from "../types"

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
export async function submitDatasetProof(
    network: string,
    datasetId: number,
    dataType: DataType,
    mappingFilesAccessMethod: string,
    path: string,
    chunk: number
): Promise<boolean> {
    const lock = new FileLock(String(datasetId) + String(dataType))
    if (!lock.acquireLock()) {
        console.log(
            "Failed to acquire lock, another process may be using the file"
        )
    }

    try {
        console.log(
            "Start submitDatasetProof:",
            "network:",
            network,
            "datasetId:",
            datasetId,
            "dataType:",
            dataType,
            "mappingFilesAccessMethod:",
            mappingFilesAccessMethod,
            "path:",
            path,
            "chunk:",
            chunk
        )

        const submitInfo = new DatasetProofSubmitInfo({
            datasetProofEvm:
                network === "calibration"
                    ? datasetProofEvm_Calibration
                    : datasetProofEvm_Main,
            datasetId: datasetId,
            dataType: dataType,
            mappingFilesAccessMethod: mappingFilesAccessMethod,
            chunk: chunk,
            completed: false,
            leafIndex: 0,
            leafHashes: [],
            leafSizes: [],
        })

        if (
            !(await checkSubmissionProofsCriteria(
                submitInfo.datasetProofEvm,
                datasetId,
                dataType
            ))
        ) {
            return true
        }

        const datasetProof = JSON.parse(fs.readFileSync(path).toString())

        return await handlerSubmitDatasetProof(submitInfo, datasetProof)
    } finally {
        lock.releaseLock()
    }
}

/**
 * Checks if the criteria for submitting dataset proofs are met.
 * @param datasetProofEvm - The Ethereum Virtual Machine instance for dataset proofs.
 * @param datasetId - The ID of the dataset.
 * @param dataType - The type of the dataset.
 * @returns A Promise that resolves to a boolean indicating whether the criteria are met (true) or not (false).
 */
async function checkSubmissionProofsCriteria(
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

/**
 * Handles the submission of the dataset proof.
 * @param submitInfo Information about the dataset proof submission.
 * @param datasetProof The dataset proof data.
 * @returns A promise that resolves to true if the submission is successful, otherwise false.
 */
async function handlerSubmitDatasetProof(
    submitInfo: DatasetProofSubmitInfo,
    datasetProof: DatasetProof
): Promise<boolean> {
    submitInfo.datasetProofEvm
        .getWallet()
        .add(process.env.PRIVATE_KEY as string)

    if (!handlerSubmitDatasetProofRoot(submitInfo, datasetProof)) {
        return false
    }

    const index = await handleEvmError(
        submitInfo.datasetProofEvm.getDatasetProofCount(
            submitInfo.datasetId,
            submitInfo.dataType
        )
    )
    submitInfo.updateleafIndex(index)

    while (!submitInfo.completed) {
        submitInfo.updateDatasetProof(datasetProof)
        console.log(
            "Start submitDatasetProof, leafIndex:",
            submitInfo.leafIndex
        )
        const tx = await handleEvmError(
            submitInfo.datasetProofEvm.submitDatasetProof(
                submitInfo.datasetId,
                submitInfo.dataType,
                submitInfo.leafHashes,
                submitInfo.leafIndex,
                submitInfo.leafSizes,
                submitInfo.completed
            )
        )

        // Wait chain success interval
        await handleEvmError(
            submitInfo.datasetProofEvm.waitForBlockHeight(
                tx.height + chainSuccessInterval
            )
        )
        const index = await handleEvmError(
            submitInfo.datasetProofEvm.getDatasetProofCount(
                submitInfo.datasetId,
                submitInfo.dataType
            )
        )

        const current = Math.min(
            submitInfo.leafIndex + submitInfo.chunk,
            datasetProof.LeafHashes.length
        )
        if (index !== current) {
            console.log("SubmitDatasetProof fail, leafIndex:", index)
            return false
        }

        submitInfo.updateleafIndex(index)
        console.log("SubmitDatasetProof success, leafIndex:", index)
        console.log("submitInfo", submitInfo)
    }

    return true
}

/**
 * Handles the submission of the dataset proof root to the Ethereum Virtual Machine (EVM).
 * @param submitInfo - Information about the dataset proof submission.
 * @param datasetProof - The dataset proof data.
 * @returns A promise resolving to true if the submission is successful, otherwise false.
 */
async function handlerSubmitDatasetProofRoot(
    submitInfo: DatasetProofSubmitInfo,
    datasetProof: DatasetProof
): Promise<boolean> {
    const submitter = await handleEvmError(
        submitInfo.datasetProofEvm.getDatasetProofSubmitter(
            submitInfo.datasetId
        )
    )
    if (submitter == defaultEthAddress) {
        console.log("Submitter is null, start submitDatasetProofRoot~")

        const tx = await handleEvmError(
            submitInfo.datasetProofEvm.submitDatasetProofRoot(
                submitInfo.datasetId,
                submitInfo.dataType,
                submitInfo.mappingFilesAccessMethod,
                datasetProof.Root
            )
        )

        // Wait chain success interval
        await handleEvmError(
            submitInfo.datasetProofEvm.waitForBlockHeight(
                tx.height + chainSuccessInterval
            )
        )

        const submitter = await handleEvmError(
            submitInfo.datasetProofEvm.getDatasetProofSubmitter(
                submitInfo.datasetId
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
