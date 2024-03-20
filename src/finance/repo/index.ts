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

import { Context } from "../../shared/context"
import { handleEvmError } from "../../shared/utils/utils"

import { Types } from "../types"

/**
 * Deposits funds into a smart contract for a specific dataset and matching ID.
 * @param options - The options object containing the context, dataset ID, matching ID, owner, and token.
 * @returns A promise indicating whether the deposit was successful.
 */
export async function deposit(options: {
    context: Context
    datasetId: number
    matchingId: number
    owner: string
    token: string
    amount: bigint
}) {
    console.log(
        "Start deposit:",
        "datasetId:",
        options.datasetId,
        "matchingId:",
        options.matchingId,
        "owner:",
        options.owner,
        "token:",
        options.token,
        "amount:",
        options.amount
    )

    options.context.evm.finance.getWallet().add(process.env.depositPrivateKey!)

    await handleEvmError(
        options.context.evm.finance.deposit(
            options.datasetId,
            options.matchingId,
            options.owner,
            options.token,
            {
                value: options.amount,
            }
        )
    )
}

/**
 * Retrieves the escrow requirement based on the provided options.
 * @param options - The options object containing the context, dataset ID, size, and type.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
export async function getEscrowRequirement(options: {
    context: Context
    datasetId: number
    size: number
    type: number
}): Promise<bigint> {
    console.log(
        "Start getEscrowRequirement:",
        "datasetId:",
        options.datasetId,
        "type:",
        options.type
    )

    switch (options.type) {
        case Types.DatacapCollateralRequirment:
            return await datacapCollateralRequirment(options)

        case Types.DatacapChunkLandRequirment:
            return await datacapChunkLandRequirment(options)

        case Types.ChallengeCommissionRequirment:
            return await challengeCommissionRequirment(options)

        case Types.ChallengeAuditCollateralRequirment:
            return await challengeAuditCollateralRequirment(options)

        case Types.ProofAuditCollateralRequirment:
            return await proofAuditCollateralRequirment(options)

        case Types.DisputeAuditCollateralRequirment:
            return await disputeAuditCollateralRequirment(options)
        default:
            console.log("Not support type: ", options.type)
            return BigInt(0)
    }
}

/**
 * Retrieves the escrow requirement for datacap collateral.
 * @param options - The options object containing the context, dataset ID, and size.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function datacapCollateralRequirment(options: {
    context: Context
    datasetId: number
    size: number
}): Promise<bigint> {
    const replicasCount = await handleEvmError(
        options.context.evm.datasetRequirement.getDatasetReplicasCount(
            options.datasetId
        )
    )
    const price = await handleEvmError(
        options.context.evm.filplus.getDatacapPricePreByte()
    )

    return BigInt(options.size) * replicasCount * price
}

/**
 * Retrieves the escrow requirement for datacap chunk land.
 * @param options - The options object containing the context, dataset ID, and size.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function datacapChunkLandRequirment(options: {
    context: Context
    datasetId: number
    size: number
}): Promise<bigint> {
    const price = await handleEvmError(
        options.context.evm.filplus.getDatacapChunkLandPricePreByte()
    )
    const maxAllocated = await handleEvmError(
        options.context.evm.filplus.datacapRulesMaxAllocatedSizePerTime()
    )

    return BigInt(Math.min(options.size, maxAllocated)) * price
}

/**
 * Retrieves the escrow requirement for challenge commission.
 * @param options - The options object containing the context and dataset ID.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function challengeCommissionRequirment(options: {
    context: Context
    datasetId: number
}): Promise<bigint> {
    const submissionCount = await handleEvmError(
        options.context.evm.datasetChallenge.getChallengeSubmissionCount(
            options.datasetId
        )
    )
    const submiterCount = await handleEvmError(
        options.context.evm.filplus.getChallengeProofsSubmiterCount()
    )
    const price = await handleEvmError(
        options.context.evm.filplus.getChallengeProofsPricePrePoint()
    )

    return BigInt(submissionCount) * submiterCount * price
}

/**
 * Retrieves the escrow requirement for challenge audit collateral.
 * @param options - The options object containing the context.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function challengeAuditCollateralRequirment(options: {
    context: Context
}): Promise<bigint> {
    return await handleEvmError(
        options.context.evm.filplus.getChallengeAuditFee()
    )
}

/**
 * Retrieves the escrow requirement for proof audit collateral.
 * @param options - The options object containing the context.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function proofAuditCollateralRequirment(options: {
    context: Context
}): Promise<bigint> {
    return await handleEvmError(options.context.evm.filplus.getProofAuditFee())
}

/**
 * Retrieves the escrow requirement for dispute audit collateral.
 * @param options - The options object containing the context.
 * @returns A promise that resolves to the escrow requirement as a bigint.
 */
async function disputeAuditCollateralRequirment(options: {
    context: Context
}): Promise<bigint> {
    return await handleEvmError(
        options.context.evm.filplus.getDisputeAuditFee()
    )
}
