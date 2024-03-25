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
import { handleEvmError, logMethodCall } from "../../shared/utils/utils"
import { StorageSubmitInfo } from "../types"
import { Context } from "../../shared/context"

/**
 * Represents a collection of storages related operations.
 */
export class Storages {
    /**
     * Registers dataswap datacap on the blockchain network.
     * @param options - The options object containing the context and size of the datacap to register.
     * @returns A promise indicating whether the registration was successful.
     */
    @logMethodCall(["context"])
    async registDataswapDatacap(options: {
        context: Context
        size: number
    }): Promise<boolean> {
        options.context.evm.storages.getWallet().add(process.env.privateKey!)
        await handleEvmError(
            options.context.evm.storages.registDataswapDatacap(options.size)
        )
        return true
    }

    /**
     * Requests allocation of datacap for a matching from the blockchain network.
     * @param options - The options object containing the context and matching ID.
     * @returns A promise indicating whether the allocation request was successful.
     */
    @logMethodCall(["context"])
    async requestAllocateDatacap(options: {
        context: Context
        matchingId: number
    }): Promise<boolean> {
        if (!(await this.isNextDatacapAllocationValid(options))) {
            return false
        }

        options.context.evm.storages
            .getWallet()
            .add(process.env.storageClientPrivateKey!)
        await handleEvmError(
            options.context.evm.storages.requestAllocateDatacap(
                options.matchingId
            )
        )
        return true
    }

    /**
     * Submits storage claim IDs to the blockchain network.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async submitStorageClaimIds(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const storageSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as StorageSubmitInfo

        if (
            await this.isStorageExpiration({
                context: options.context,
                matchingId: storageSubmitInfo.matchingId,
            })
        ) {
            return false
        }

        options.context.evm.storages
            .getWallet()
            .add(process.env.storageClientPrivateKey!)
        await handleEvmError(
            options.context.evm.storages.submitStorageClaimIds(
                storageSubmitInfo.matchingId,
                storageSubmitInfo.provider,
                storageSubmitInfo.ids,
                storageSubmitInfo.claimIds
            )
        )
        return true
    }

    /**
     * Completes storage on the blockchain network.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the completion was successful.
     */
    @logMethodCall(["context"])
    async completeStorage(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const storageSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as StorageSubmitInfo

        options.context.evm.storages
            .getWallet()
            .add(process.env.storageClientPrivateKey!)
        await handleEvmError(
            options.context.evm.storages.completeStorage(
                storageSubmitInfo.matchingId,
                storageSubmitInfo.ids
            )
        )
        return true
    }

    /**
     * Checks whether the next datacap allocation is valid for a matching on the blockchain network.
     * @param options - The options object containing the context and matching ID.
     * @returns A promise indicating whether the validation was successful.
     */
    @logMethodCall(["context"])
    async isNextDatacapAllocationValid(options: {
        context: Context
        matchingId: number
    }): Promise<boolean> {
        return await handleEvmError(
            options.context.evm.storages.isNextDatacapAllocationValid(
                options.matchingId
            )
        )
    }

    /**
     * Checks whether the storage for a matching is completed on the blockchain network.
     * @param options - The options object containing the context and matching ID.
     * @returns A promise indicating whether the check was successful.
     */
    @logMethodCall(["context"])
    async isStorageCompleted(options: {
        context: Context
        matchingId: number
    }): Promise<boolean> {
        return await handleEvmError(
            options.context.evm.storages.isStorageCompleted(options.matchingId)
        )
    }

    /**
     * Checks whether the storage for a matching has expired on the blockchain network.
     * @param options - The options object containing the context and matching ID.
     * @returns A promise indicating whether
     */
    @logMethodCall(["context"])
    async isStorageExpiration(options: {
        context: Context
        matchingId: number
    }): Promise<boolean> {
        return await handleEvmError(
            options.context.evm.storages.isStorageExpiration(options.matchingId)
        )
    }
}
