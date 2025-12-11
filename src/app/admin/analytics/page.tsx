'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bot,
  Search,
  FileText,
  Home,
  Database,
  Eye,
  User as UserIcon
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  agentUsage: Record<string, number>
  messagesOverTime: Array<{ date: string; count: number }>
  responseTime: {
    avg: number
    min: number
    max: number
  }
  userSatisfaction: {
    positive: number
    negative: number
    neutral: number
  }
  topQuestions: Array<{ question: string; count: number }>
  ragPerformance: {
    queriesWithResults: number
    queriesWithoutResults: number
    avgSourcesPerQuery: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface Conversation {
  id: string
  userId: string | null
  sessionId: string | null
  createdAt: string
  messages: Array<{
    id: string
    role: string
    content: string
    agentType: string | null
    timestamp: string
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchAnalytics()
    fetchConversations()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsDialogOpen(true)
  }

  if (isLoading || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const agentData = analytics.agentUsage 
    ? Object.entries(analytics.agentUsage).map(([name, value]) => ({
        name,
        value
      }))
    : []

  const satisfactionData = [
    { name: 'Positif', value: analytics.userSatisfaction?.positive || 0, color: '#10b981' },
    { name: 'Neutre', value: analytics.userSatisfaction?.neutral || 0, color: '#f59e0b' },
    { name: 'Négatif', value: analytics.userSatisfaction?.negative || 0, color: '#ef4444' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Chatbot
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/rag-viewer')}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                RAG Viewer
              </Button>
            </div>
            <Badge variant="secondary" className="text-sm">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Avancés
          </h1>
          <p className="text-muted-foreground mt-2">
            Tableau de bord complet des performances du chatbot
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            onClick={() => setDateRange('7d')}
          >
            7 jours
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            onClick={() => setDateRange('30d')}
          >
            30 jours
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            onClick={() => setDateRange('90d')}
          >
            90 jours
          </Button>
          <Button onClick={fetchAnalytics} variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Moy: {analytics.avgMessagesPerConversation?.toFixed(1) || '0.0'} par conversation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseTime?.avg?.toFixed(2) || '0.00'}s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {analytics.responseTime?.min || 0}s | Max: {analytics.responseTime?.max || 0}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Satisfaction</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.userSatisfaction ? (
                (analytics.userSatisfaction.positive /
                  (analytics.userSatisfaction.positive +
                    analytics.userSatisfaction.negative +
                    analytics.userSatisfaction.neutral)) *
                100
              ).toFixed(1) : '0.0'}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.userSatisfaction?.positive || 0} positifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Utilisation des Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satisfaction Utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Messages Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Messages au fil du temps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.messagesOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* RAG Performance & Top Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Performance RAG
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Requêtes avec résultats</span>
              <Badge className="bg-green-500">
                {analytics.ragPerformance?.queriesWithResults || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Requêtes sans résultats</span>
              <Badge variant="destructive">
                {analytics.ragPerformance?.queriesWithoutResults || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sources moyennes par requête</span>
              <Badge variant="outline">
                {analytics.ragPerformance?.avgSourcesPerQuery?.toFixed(1) || '0.0'}
              </Badge>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Taux de succès RAG</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: analytics.ragPerformance ? `${
                      (analytics.ragPerformance.queriesWithResults /
                        (analytics.ragPerformance.queriesWithResults +
                          analytics.ragPerformance.queriesWithoutResults)) *
                      100
                    }%` : '0%'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Questions Fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {(analytics.topQuestions || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                  >
                    <span className="text-sm flex-1">{q.question}</span>
                    <Badge variant="secondary">{q.count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Conversations récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune conversation disponible
                </p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">
                          {conversation.userId 
                            ? `User: ${conversation.userId.split('-')[1]?.substring(0, 8)}...`
                            : 'Utilisateur anonyme'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {conversation.messages.length} messages
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Session: {conversation.sessionId?.split('-')[1]?.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewConversation(conversation)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog pour afficher la conversation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation
            </DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-semibold">User ID:</span> {selectedConversation.userId || 'Anonyme'}
                </div>
                <div>
                  <span className="font-semibold">Session:</span> {selectedConversation.sessionId}
                </div>
              </div>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {message.agentType && message.role === 'assistant' && (
                          <Badge className="mb-2 text-xs" variant="secondary">
                            {message.agentType === 'retrieval' && '🔍 RAG'}
                            {message.agentType === 'form_filling' && '📝 Form'}
                            {message.agentType === 'orchestration' && '🎯 Orchestration'}
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

