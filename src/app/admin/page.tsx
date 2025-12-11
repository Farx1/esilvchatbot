'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, MessageSquare, FileText, Bot, Calendar, BarChart3, TrendingUp } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalConversations: number
  totalMessages: number
  totalFormSubmissions: number
}

interface Conversation {
  id: string
  user?: {
    name?: string
    email?: string
  }
  messageCount: number
  lastMessage: string
  timestamp: string
}

interface FormSubmission {
  id: string
  user?: {
    name?: string
    email?: string
  }
  type: string
  status: string
  data: any
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalFormSubmissions: 0
  })
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/stats')
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load conversations
      const convResponse = await fetch('/api/admin/conversations')
      const convData = await convResponse.json()
      setConversations(Array.isArray(convData.conversations) ? convData.conversations : [])

      // Load form submissions
      const formResponse = await fetch('/api/form-submit')
      const formData = await formResponse.json()
      setSubmissions(Array.isArray(formData.submissions) ? formData.submissions : [])
    } catch (error) {
      console.error('Error loading admin data:', error)
      setSubmissions([]) // Ensure it's always an array
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processed: 'default',
      completed: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto -mt-20 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ESILV Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Monitoring et analytics du chatbot</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversations</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Messages</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalMessages}</p>
                </div>
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Formulaires</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalFormSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="submissions">Formulaires</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Conversations récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Dernier message</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{conv.user?.name || 'Anonyme'}</p>
                            <p className="text-sm text-slate-600">{conv.user?.email || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{conv.messageCount}</TableCell>
                        <TableCell className="max-w-xs truncate">{conv.lastMessage}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conv.timestamp).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Soumissions de formulaire</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Données</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Aucune soumission de formulaire pour le moment
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.user?.name || 'N/A'}</p>
                              <p className="text-sm text-slate-600">{sub.user?.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.type}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {sub.data.program && <p>Programme: {sub.data.program}</p>}
                              {sub.data.phone && <p>Tél: {sub.data.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(sub.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}