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

import { Entity } from "@unipackage/ddd"
import { ValueFields } from "@unipackage/utils"
import { DataType } from "@dataswapjs/dataswapjs"

/**
 * Interface representing dataset proof submit information for a dataset.
 * @interface
 */
export interface DatasetProofSubmitInfo {
    datasetId: number
    dataType: DataType
    mappingFilesAccessMethod: string
    leafIndex: number
    leafHashes: string[]
    leafSizes: number[]
    chunk: number
    completed: boolean
}

/**
 * Class representing a DatasetProofSubmitInfo entity.
 * @class
 * @extends Entity<DatasetProofSubmitInfo>
 */
export class DatasetProofSubmitInfo extends Entity<DatasetProofSubmitInfo> {
    constructor(data?: ValueFields<DatasetProofSubmitInfo>) {
        super({
            datasetId: data?.datasetId || 0,
            dataType: data?.dataType || DataType.Source,
            mappingFilesAccessMethod: data?.mappingFilesAccessMethod || "",
            leafIndex: data?.leafIndex || 0,
            leafHashes: data?.leafHashes || [],
            leafSizes: data?.leafSizes || [],
            chunk: data?.chunk || 0,
            completed: data?.completed || false,
        })
    }

    updateleafIndex(leafIndex: number) {
        this.leafIndex = leafIndex
    }

    updateDatasetProof(datasetProof: DatasetProof) {
        if (this.leafIndex + this.chunk >= datasetProof.LeafHashes.length) {
            this.leafHashes = datasetProof.LeafHashes.slice(
                this.leafIndex,
                datasetProof.LeafHashes.length
            )
            this.leafSizes = datasetProof.LeafSizes.slice(
                this.leafIndex,
                datasetProof.LeafSizes.length
            )
            this.completed = true
        } else {
            this.leafHashes = datasetProof.LeafHashes.slice(
                this.leafIndex,
                this.leafIndex + this.chunk
            )
            this.leafSizes = datasetProof.LeafSizes.slice(
                this.leafIndex,
                this.leafIndex + this.chunk
            )
        }
    }
}

/**
 * Interface representing dataset proof information for a dataset.
 * @interface
 */
export interface DatasetProof {
    Root: string
    LeafHashes: string[]
    LeafSizes: number[]
}

/**
 * Class representing a DatasetProof entity.
 * @class
 * @extends Entity<DatasetProof>
 */
export class DatasetProof extends Entity<DatasetProof> {
    constructor(data?: ValueFields<DatasetProof>) {
        super({
            Root: data?.Root || "",
            LeafHashes: data?.LeafHashes || [],
            LeafSizes: data?.LeafSizes || [],
        })
    }
}

/**
 * Interface representing dataset challenge proof information for a dataset.
 * @interface
 */
export interface DatasetChallengeProof {
    RandomSeed: bigint
    Leaves: string[]
    Siblings: string[][]
    Paths: bigint[]
}

/**
 * Class representing a DatasetChallengeProof entity.
 * @class
 * @extends Entity<DatasetChallengeProof>
 */
export class DatasetChallengeProof extends Entity<DatasetChallengeProof> {
    constructor(data?: ValueFields<DatasetChallengeProof>) {
        super({
            RandomSeed: data?.RandomSeed || BigInt(0),
            Leaves: data?.Leaves || [],
            Siblings: data?.Siblings || [],
            Paths: data?.Paths || [],
        })
    }
}
