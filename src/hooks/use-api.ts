import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Cache keys
export const CACHE_KEYS = {
  conversations: ['conversations'],
  stats: ['stats'],
  feedback: ['feedback'],
  documents: ['documents'],
  knowledgeBase: ['knowledgeBase'],
  agentStats: ['agentStats'],
} as const

// Generic fetcher with error handling
export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Hooks for dashboard data
export function useStats() {
  return useQuery({
    queryKey: CACHE_KEYS.stats,
    queryFn: () => fetcher('/api/admin/stats'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useConversations() {
  return useQuery({
    queryKey: CACHE_KEYS.conversations,
    queryFn: () => fetcher('/api/admin/conversations'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAgentStats() {
  return useQuery({
    queryKey: CACHE_KEYS.agentStats,
    queryFn: () => fetcher('/api/admin/agent-stats'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: CACHE_KEYS.feedback,
    queryFn: () => fetcher('/api/feedback'),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useDocuments() {
  return useQuery({
    queryKey: CACHE_KEYS.documents,
    queryFn: () => fetcher('/api/documents/upload'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutation hooks
export function useFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { messageId: string; feedback: 'up' | 'down'; comment?: string }) => {
      return fetcher('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate feedback cache
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback })
    },
  })
}

export function useChatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { message: string; conversationHistory?: any[] }) => {
      return fetcher('/api/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.conversations })
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.stats })
    },
  })
}

export function useFormSubmissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FormData) => {
      return fetcher('/api/form-submit', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.stats })
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.conversations })
    },
  })
}