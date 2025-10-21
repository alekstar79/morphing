interface MergeContext {
  path?: string;
  parent?: Record<string, any>;
  [key: string]: any;
}

type CustomizerFunction = (
  key: string,
  targetValue: any,
  sourceValue: any,
  context: MergeContext
) => any

export function deepMerge(
  target: Record<string, any> | null,
  source: Record<string, any> | null,
  customizer: CustomizerFunction | null = null,
  context: MergeContext = {}
): Record<string, any> {
  // Handle null/undefined inputs
  if (target === null || typeof target !== 'object') {
    return customizer ? customizer('root', target, source, context) : source || {}
  }

  if (source === null || typeof source !== 'object') {
    return customizer ? customizer('root', target, source, context) : target || {}
  }

  // Handle array merging
  if (Array.isArray(target) && Array.isArray(source)) {
    if (customizer) {
      const customResult = customizer('array', target, source, context)

      if (customResult !== undefined) {
        return customResult
      }
    }

    return [...target, ...source]
  }

  if (Array.isArray(target) || Array.isArray(source)) {
    if (customizer) {
      const customResult = customizer('array_mismatch', target, source, context)

      if (customResult !== undefined) {
        return customResult
      }
    }

    return source
  }

  // Create output object
  const output = { ...target }

  // Merge all keys from source
  for (const key of Object.keys(source)) {
    const targetValue = (target as Record<string, any>)[key]
    const sourceValue = (source as Record<string, any>)[key]

    // Create new context for nested merging
    const newContext: MergeContext = {
      ...context,
      path: context.path ? `${context.path}.${key}` : key,
      parent: output
    }

    // Call customizer if provided
    if (customizer) {
      const customResult = customizer(key, targetValue, sourceValue, newContext)

      if (customResult !== undefined) {
        output[key] = customResult
        continue
      }
    }

    // Default merge behavior
    if (typeof targetValue === 'object' && targetValue !== null &&
      typeof sourceValue === 'object' && sourceValue !== null) {
      // Recursive merge for nested objects
      output[key] = deepMerge(targetValue, sourceValue, customizer, newContext)
    } else if (sourceValue !== undefined) {
      // Overwrite with source value
      output[key] = sourceValue
    }
  }

  return output
}
