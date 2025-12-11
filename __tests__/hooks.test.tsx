import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStats, useConversations, useFeedbackStats } from '../hooks/use-api'

// Mock fetch
global.fetch = jest.fn()

describe('API Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    ;(global.fetch as jest.Mock).mockClear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('useStats', () => {
    test('fetches stats successfully', async () => {
      const mockStats = {
        totalUsers: 10,
        totalConversations: 25,
        totalMessages: 150,
        totalFormSubmissions: 5
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStats
      })

      const { result } = renderHook(() => useStats(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.data).toEqual(mockStats)
      expect(result.current.isLoading).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats')
    })

    test('handles error correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to fetch' })
      })

      const { result } = renderHook(() => useStats(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useFeedbackStats', () => {
    test('fetches feedback stats successfully', async () => {
      const mockFeedbackStats = {
        satisfactionRate: 85,
        totalFeedback: 20,
        positiveFeedback: 17,
        negativeFeedback: 3
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockFeedbackStats
      })

      const { result } = renderHook(() => useFeedbackStats(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.data).toEqual(mockFeedbackStats)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useConversations', () => {
    test('fetches conversations successfully', async () => {
      const mockConversations = {
        conversations: [
          {
            id: '1',
            user: { name: 'Test User', email: 'test@example.com' },
            messageCount: 5,
            lastMessage: 'Hello',
            timestamp: '2023-01-01T00:00:00Z'
          }
        ]
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConversations
      })

      const { result } = renderHook(() => useConversations(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.data).toEqual(mockConversations)
      expect(result.current.isLoading).toBe(false)
    })
  })
})