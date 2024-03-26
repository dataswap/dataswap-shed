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

import * as fs from "fs"

/**
 * Handles Ethereum Virtual Machine (EVM) errors in a transaction promise.
 * @param txPromise - A promise representing an Ethereum transaction.
 * @returns A promise handling EVM errors.
 */
export async function handleEvmError(txPromise: Promise<any>) {
    try {
        const tx = await txPromise
        if (!tx.ok) {
            throw tx.error
        }
        return tx.data
    } catch (error) {
        throw error
    }
}

/**
 * Represents a file lock for synchronization across processes.
 */
export class FileLock {
    private lockFilePath: string

    /**
     * Creates a new FileLock instance.
     * @param filePath The path of the file to be locked.
     */
    constructor(filePath: string) {
        this.lockFilePath = `${filePath}.lock`
    }

    /**
     * Acquires the lock by creating a lock file.
     * @returns True if the lock is successfully acquired, otherwise false.
     */

    acquireLock(): boolean {
        try {
            fs.writeFileSync(this.lockFilePath, "")
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Releases the lock by deleting the lock file.
     */
    releaseLock(): void {
        fs.unlinkSync(this.lockFilePath)
    }
}

/**
 * A decorator function for logging method calls and their return values.
 * @param propertiesToIgnore - The ignore properties.
 * @returns The modified property descriptor with logging functionality.
 */
export function logMethodCall(propertiesToIgnore: string[] = []) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value
        descriptor.value = async function (...args: any[]) {
            // Function to filter out specified properties from objects
            const filterProperties = (arg: any): any => {
                if (
                    typeof arg === "object" &&
                    arg !== null &&
                    propertiesToIgnore.length > 0
                ) {
                    const filteredArg: any = {}
                    for (const prop in arg) {
                        if (!propertiesToIgnore.includes(prop)) {
                            filteredArg[prop] = arg[prop]
                        }
                    }
                    return filteredArg
                }
                return arg
            }

            const loggedArgs = args.map(filterProperties)

            console.log(`Calling ${propertyKey} with arguments: `, loggedArgs)

            const result = await originalMethod.apply(this, args)

            console.log(`${propertyKey} returned: `, result)
            return result
        }
        return descriptor
    }
}
