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
import { MatchingState } from "@dataswapjs/dataswapjs"
import { handleEvmError, logMethodCall } from "../../shared/utils/utils"
import {
    MatchingMetadataSubmitInfo,
    MatchingTargetSubmitInfo,
    MatchingPublishSubmitInfo,
} from "../types"
import { Context } from "../../shared/context"

/**
 * Represents a collection of matching related operations.
 */
export class Matching {
    /**
     * Submits the matching metadata to the blockchain network.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async createMatching(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const matchingMetadataSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as MatchingMetadataSubmitInfo

        options.context.evm.matchingMetadata
            .getWallet()
            .add(process.env.datasetPreparerPrivateKey!)
        await handleEvmError(
            options.context.evm.matchingMetadata.createMatching(
                matchingMetadataSubmitInfo.datasetId,
                matchingMetadataSubmitInfo.bidSelectionRule,
                matchingMetadataSubmitInfo.biddingDelayBlockCount,
                matchingMetadataSubmitInfo.biddingPeriodBlockCount,
                matchingMetadataSubmitInfo.storageCompletionPeriodBlocks,
                matchingMetadataSubmitInfo.biddingThreshold,
                matchingMetadataSubmitInfo.replicaIndex,
                matchingMetadataSubmitInfo.additionalInfo
            )
        )
        return true
    }

    /**
     * Submits the matching target to the blockchain network.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the submission was successful.
     */
    @logMethodCall(["context"])
    async createTarget(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const matchingTargetSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as MatchingTargetSubmitInfo

        options.context.evm.matchingTarget
            .getWallet()
            .add(process.env.datasetPreparerPrivateKey!)
        await handleEvmError(
            options.context.evm.matchingTarget.createTarget(
                matchingTargetSubmitInfo.matchingId,
                matchingTargetSubmitInfo.datasetId,
                matchingTargetSubmitInfo.dataType,
                matchingTargetSubmitInfo.associatedMappingFilesMatchingId,
                matchingTargetSubmitInfo.replicaIndex
            )
        )
        return true
    }

    /**
     * Publishes the matching to the blockchain network.
     * @param options - The options object containing the context and file path.
     * @returns A promise indicating whether the publication was successful.
     */
    @logMethodCall(["context"])
    async publishMatching(options: {
        context: Context
        path: string
    }): Promise<boolean> {
        const matchingPublishSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as MatchingPublishSubmitInfo

        options.context.evm.matchingTarget
            .getWallet()
            .add(process.env.datasetPreparerPrivateKey!)
        await handleEvmError(
            options.context.evm.matchingTarget.publishMatching(
                matchingPublishSubmitInfo.matchingId,
                matchingPublishSubmitInfo.datasetId,
                matchingPublishSubmitInfo.carsStarts,
                matchingPublishSubmitInfo.carsEnds,
                matchingPublishSubmitInfo.complete
            )
        )
        return true
    }

    /**
     * Places a bid on a matching.
     * @param options - The options object containing the context, matching ID, and bid amount.
     * @returns A promise indicating whether the bidding was successful.
     */
    @logMethodCall(["context"])
    async bidding(options: {
        context: Context
        matchingId: number
        amount: bigint
    }): Promise<boolean> {
        options.context.evm.matchingBids
            .getWallet()
            .add(process.env.storageProviderPrivateKey!)
        await handleEvmError(
            options.context.evm.matchingBids.bidding(
                options.matchingId,
                options.amount
            )
        )
        return true
    }

    /**
     * Retrieves the state of a matching from the blockchain network.
     * @param options - The options object containing the context and matching ID.
     * @returns A promise indicating whether the state retrieval was successful.
     */
    @logMethodCall(["context"])
    async getMatchingState(options: {
        context: Context
        matchingId: number
    }): Promise<MatchingState> {
        return await handleEvmError(
            options.context.evm.matchingMetadata.getMatchingState(
                options.matchingId
            )
        )
    }
}
