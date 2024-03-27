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
import { MatchingState, Car } from "@dataswapjs/dataswapjs"
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
    async createMatching(options: { context: Context; path: string }): Promise<{
        matchingId: number
    }> {
        const matchingMetadataSubmitInfo = JSON.parse(
            fs.readFileSync(options.path).toString()
        ) as MatchingMetadataSubmitInfo

        options.context.evm.matchingMetadata
            .getWallet()
            .add(process.env.datasetPreparerPrivateKey!)
        const tx = await handleEvmError(
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
        // Get transaction receipt and event arguments
        const receipt =
            await options.context.evm.matchingMetadata.getTransactionReceipt(
                tx.hash
            )

        const ret = options.context.evm.matchingMetadata.getEvmEventArgs(
            receipt!,
            "MatchingCreated"
        )

        return { matchingId: Number(ret.data.matchingId) }
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
     * Retrieves the IDs of cars based on the provided JSON file path.
     *
     * @param options An object containing the context and the path to the JSON file.
     * @returns A Promise resolving to an array of BigInt values representing the car IDs.
     */
    @logMethodCall(["context"])
    async getCarsIds(options: {
        context: Context
        path: string
    }): Promise<bigint[]> {
        const cars = JSON.parse(fs.readFileSync(options.path).toString())

        return await handleEvmError(
            options.context.evm.carstore.getCarsIds(cars.carsHash)
        )
    }

    /**
     * Retrieves the IDs of cars based on the provided JSON file path.
     *
     * @param options An object containing the context and the path to the JSON file.
     * @returns A Promise resolving to an array of BigInt values representing the car IDs.
     */
    @logMethodCall(["context"])
    async getCarsIdsWithState(options: {
        context: Context
        replicaIndex: number
        path: string
    }): Promise<{ matchinged: string[]; unmatching: string[] }> {
        const cars = JSON.parse(fs.readFileSync(options.path).toString())

        const ids: bigint[] = await handleEvmError(
            options.context.evm.carstore.getCarsIds(cars.carsHash)
        )
        const unmatching: bigint[] = []
        const matchinged: bigint[] = []

        for (const id of ids) {
            const car = (await handleEvmError(
                options.context.evm.carstore.getCar(id)
            )) as Car

            if (
                car.matchingIds &&
                car.matchingIds[options.replicaIndex] != (undefined || 0)
            ) {
                matchinged.push(id)
            } else {
                unmatching.push(id)
            }
        }
        return await this.formatIdsWithState({ matchinged, unmatching })
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

    /**
     * Formats the given IDs with their state (matchinged/unmatching).
     * @param options The options object containing unmatching and matchinged IDs.
     * @returns A Promise resolving to an object with formatted unmatching and matchinged IDs.
     */
    private async formatIdsWithState(options: {
        matchinged: bigint[]
        unmatching: bigint[]
    }): Promise<{ matchinged: string[]; unmatching: string[] }> {
        const unmatchingIds: string[] = this.formatRange(options.unmatching)
        const matchingedIds: string[] = this.formatRange(options.matchinged)

        return { matchinged: matchingedIds, unmatching: unmatchingIds }
    }

    /**
     * Formats the given array of IDs into ranges (e.g., [1, 2, 3, 5] => ["1-3", "5"]).
     * @param ids The array of IDs to be formatted.
     * @returns An array of strings representing formatted ranges of IDs.
     */
    private formatRange(ids: bigint[]): string[] {
        // Sort the IDs and remove duplicates
        const sortedIds = Array.from(new Set(ids)).sort(
            (a, b) => Number(a) - Number(b)
        )
        const ranges: string[] = []

        let start = sortedIds[0]
        let end = sortedIds[0]
        for (let i = 1; i < sortedIds.length; i++) {
            if (sortedIds[i] - end === BigInt(1)) {
                end = sortedIds[i]
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`)
                start = end = sortedIds[i]
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`)

        return ranges
    }
}
