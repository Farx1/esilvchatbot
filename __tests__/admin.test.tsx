import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminDashboard from '../app/admin/page'

// Mock hooks
jest.mock('../hooks/use-api', () => ({
  useStats: jest.fn(() => ({
    data: {
      totalUsers: 10,
      totalConversations: 25,
      totalMessages: 150,
      totalFormSubmissions: 5
    },
    isLoading: false
  })),
  useConversations: jest.fn(() => ({
    data: { conversations: [] },
    isLoading: false
  })),
  useAgentStats: jest.fn(() => ({
    data: { stats: [] },
    isLoading: false
  })),
  useFeedbackStats: jest.fn(() => ({
    data: {
      satisfactionRate: 85,
      totalFeedback: 20,
      positiveFeedback: 17,
      negativeFeedback: 3,
      stats: []
    },
    isLoading: false
  }))
}))

describe('AdminDashboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  test('renders dashboard with stats correctly', () => {
    renderWithProviders(<AdminDashboard />)
    
    expect(screen.getByText('ESILV Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // Users
    expect(screen.getByText('25')).toBeInTheDocument() // Conversations
    expect(screen.getByText('150')).toBeInTheDocument() // Messages
    expect(screen.getByText('5')).toBeInTheDocument() // Forms
  })

  test('displays satisfaction rate', () => {
    renderWithProviders(<AdminDashboard />)
    
    expect(screen.getByText('85% satisfaction')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument() // Positive feedback
    expect(screen.getByText('3')).toBeInTheDocument() // Negative feedback
  })

  test('renders tabs correctly', () => {
    renderWithProviders(<AdminDashboard />)
    
    expect(screen.getByRole('tab', { name: 'Conversations' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Formulaires' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Feedback' })).toBeInTheDocument()
  })

  test('shows loading state', () => {
    // Override mock to show loading
    const { useStats } = require('../hooks/use-api')
    useStats.mockReturnValue({
      data: null,
      isLoading: true
    })

    renderWithProviders(<AdminDashboard />)
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })
})