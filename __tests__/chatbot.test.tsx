import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnhancedESILVChatbot } from '../app/page'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: '1', email: 'test@example.com', name: 'Test User' } },
    status: 'authenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

describe('EnhancedESILVChatbot', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  test('renders chat interface correctly', () => {
    renderWithProviders(<EnhancedESILVChatbot />)
    
    expect(screen.getByText('ESILV Smart Assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Posez votre question sur ESILV...')).toBeInTheDocument()
    expect(screen.getByText('En ligne - Prêt à vous aider')).toBeInTheDocument()
  })

  test('sends message when form is submitted', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        response: 'Test response',
        agentType: 'orchestration'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProviders(<EnhancedESILVChatbot />)
    
    const input = screen.getByPlaceholderText('Posez votre question sur ESILV...')
    const sendButton = screen.getByRole('button', { name: /envoyer/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test message')
      })
    })
  })

  test('displays loading state during message sending', async () => {
    // Mock delayed response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Test', agentType: 'orchestration' })
      }), 1000))
    )

    renderWithProviders(<EnhancedESILVChatbot />)
    
    const input = screen.getByPlaceholderText('Posez votre question sur ESILV...')
    const sendButton = screen.getByRole('button', { name: /envoyer/i })
    
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(sendButton)
    
    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText('Je réfléchis à votre question...')).toBeInTheDocument()
    })
  })

  test('handles suggestion clicks correctly', () => {
    renderWithProviders(<EnhancedESILVChatbot />)
    
    const suggestions = screen.getAllByRole('button', { name: /Quels sont les programmes/i })
    expect(suggestions.length).toBeGreaterThan(0)
    
    fireEvent.click(suggestions[0])
    
    const input = screen.getByPlaceholderText('Posez votre question sur ESILV...')
    expect(input).toHaveValue('Quels sont les programmes disponibles ?')
  })

  test('displays agent badges correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        response: 'Response from RAG agent',
        agentType: 'retrieval'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProviders(<EnhancedESILVChatbot />)
    
    const input = screen.getByPlaceholderText('Posez votre question sur ESILV...')
    const sendButton = screen.getByRole('button', { name: /envoyer/i })
    
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('🔍 RAG')).toBeInTheDocument()
    })
  })
})