/**
 * Découpe un tableau en sous-tableaux de taille bornée (ex: requêtes `.in(...)` Supabase).
 */
export function chunkArray<T>(items: readonly T[], size = 200): T[][] {
  if (size <= 0) throw new Error('chunkArray: size must be > 0')
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Exécute une tâche asynchrone sur chaque élément avec une concurrence bornée.
 */
export async function runInBatches<T, R>(
  items: readonly T[],
  batchSize: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (batchSize <= 0) throw new Error('runInBatches: batchSize must be > 0')
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      slice.map((item, offset) => worker(item, i + offset)),
    )
    results.push(...batchResults)
  }
  return results
}
