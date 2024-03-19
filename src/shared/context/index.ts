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
    DatasetMetadataEvm,
    DatasetProofEvm,
    DatasetRequirementEvm,
    DatasetChallengeEvm,
    MatchingBidsEvm,
    MatchingMetadataEvm,
    MatchingTargetEvm,
    StoragesEvm,
    FinanceEvm,
    RolesEvm,
    FilplusEvm,
    datasetChallengeEvm_Calibration,
    datasetChallengeEvm_Main,
    datasetMetadataEvm_Calibration,
    datasetMetadataEvm_Main,
    datasetProofEvm_Calibration,
    datasetProofEvm_Main,
    datasetRequirementEvm_Calibration,
    datasetRequirementEvm_Main,
    filplusEvm_Calibration,
    filplusEvm_Main,
    matchingBidsEvm_Calibration,
    matchingBidsEvm_Main,
    matchingMetadataEvm_Calibration,
    matchingMetadataEvm_Main,
    matchingTargetEvm_Calibration,
    matchingTargetEvm_Main,
    rolesEvm_Calibration,
    rolesEvm_Main,
    storagesEvm_Calibration,
    storagesEvm_Main,
    filecoinEvm_Calibration,
    filecoinEvm_Main,
    financeEvm_Calibration,
    financeEvm_Main,
    FilecoinEvm,
} from "@dataswapjs/dataswapjs"

/**
 * Configuration for Context.
 */
export interface Context {
    network: string
    evm: EvmContext
}

/**
 * Configuration for Evm context.
 */
export interface EvmContext {
    finance: FinanceEvm
    filplus: FilplusEvm
    filecoin: FilecoinEvm
    roles: RolesEvm
    datasetMetadata: DatasetMetadataEvm
    datasetRequirement: DatasetRequirementEvm
    datasetProof: DatasetProofEvm
    datasetChallenge: DatasetChallengeEvm
    matchingTarget: MatchingTargetEvm
    matchingMetadata: MatchingMetadataEvm
    matchingBids: MatchingBidsEvm
    storages: StoragesEvm
}

/**
 * Represents a connection to a Filecoin network.
 */
export class Context {
    /**
     * Creates an instance of ChainNetwork.
     * @param config - The context configuration.
     */
    constructor() {
        this.network = process.env.NETWORK!

        this.evm = {} as EvmContext

        if (this.network === "calibration") {
            this.evm.roles = rolesEvm_Calibration
            this.evm.filplus = filplusEvm_Calibration
            this.evm.finance = financeEvm_Calibration
            this.evm.filecoin = filecoinEvm_Calibration
            this.evm.datasetMetadata = datasetMetadataEvm_Calibration
            this.evm.datasetRequirement = datasetRequirementEvm_Calibration
            this.evm.datasetProof = datasetProofEvm_Calibration
            this.evm.datasetChallenge = datasetChallengeEvm_Calibration
            this.evm.matchingMetadata = matchingMetadataEvm_Calibration
            this.evm.matchingTarget = matchingTargetEvm_Calibration
            this.evm.matchingBids = matchingBidsEvm_Calibration
            this.evm.storages = storagesEvm_Calibration
        } else {
            this.evm.roles = rolesEvm_Main
            this.evm.filplus = filplusEvm_Main
            this.evm.finance = financeEvm_Main
            this.evm.filecoin = filecoinEvm_Main
            this.evm.datasetMetadata = datasetMetadataEvm_Main
            this.evm.datasetRequirement = datasetRequirementEvm_Main
            this.evm.datasetProof = datasetProofEvm_Main
            this.evm.datasetChallenge = datasetChallengeEvm_Main
            this.evm.matchingMetadata = matchingMetadataEvm_Main
            this.evm.matchingTarget = matchingTargetEvm_Main
            this.evm.matchingBids = matchingBidsEvm_Main
            this.evm.storages = storagesEvm_Main
        }
    }
}
