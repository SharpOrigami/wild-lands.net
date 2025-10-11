// Helper function to check if a value is a non-array object
const isObject = (item: any): item is Record<string, any> => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Recursively merges properties of two objects.
 * The properties from the 'source' object will overwrite properties in the 'target' object.
 * If a property is an object in both, it will be recursively merged.
 * Crucially, `undefined` values in the source are ignored, preventing them from overwriting
 * initialized values in the target.
 * @param target The base object (e.g., a default state template).
 * @param source The object with properties to merge onto the target (e.g., a loaded save file).
 * @returns A new object with the merged properties.
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Record<string, any>): T => {
    const output: T = { ...target };

    if (isObject(target) && isObject(source)) {
        // Iterate over all keys in the source object
        for (const key in source) {
            // Ensure it's an own property, not from the prototype chain
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceValue = source[key];
                const targetValue = (output as any)[key];
                
                // If both the target and source values for a key are objects, recurse
                if (isObject(targetValue) && isObject(sourceValue)) {
                    (output as any)[key] = deepMerge(targetValue, sourceValue);
                } 
                // Otherwise, if the source value is explicitly defined (i.e., not undefined),
                // it overwrites the target value. This prevents a missing property in an old 
                // save file from wiping out an initialized array or object in the new game 
                // state template.
                else if (sourceValue !== undefined) {
                    (output as any)[key] = sourceValue;
                }
            }
        }
    }

    return output;
};
