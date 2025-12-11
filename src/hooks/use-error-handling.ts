import { useQuery } from '@tanstack/react-query'
import { fetcher, CACHE_KEYS } from './use-api'

export function useErrorReporting() {
  return useQuery({
    queryKey: ['error-reporting'],
    queryFn: () => fetcher('/api/errors/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false // Only enable when needed
  })
}

export function useRetryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) {
  return async (): Promise<T> => {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}

// Hook for safe async operations with error handling
export function useSafeAsync<T>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fn()
      setData(result)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Report error to boundary
      console.error('Async operation failed:', error)
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setData(null)
    setIsLoading(false)
  }, [])

  return { execute, isLoading, error, data, reset }
}