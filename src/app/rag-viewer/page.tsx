'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Database, RefreshCw, Eye, Home, BarChart3, Shield, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface KnowledgeEntry {
  id: string
  question: string
  answer: string
  category: string
  confidence: number
  createdAt: string
}

export default function RAGViewer() {
  const router = useRouter()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<KnowledgeEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    categories: {} as Record<string, number>
  })

  useEffect(() => {
    fetchKnowledgeBase()
  }, [])

  useEffect(() => {
    filterEntries()
  }, [searchQuery, selectedCategory, entries])

  const fetchKnowledgeBase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge')
      const data = await response.json()
      setEntries(data.entries || [])
      
      // Calculate stats
      const categories: Record<string, number> = {}
      data.entries.forEach((entry: KnowledgeEntry) => {
        categories[entry.category] = (categories[entry.category] || 0) + 1
      })
      
      setStats({
        total: data.entries.length,
        categories
      })
    } catch (error) {
      console.error('Error fetching knowledge base:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = entries

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.question.toLowerCase().includes(query) ||
        entry.answer.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query)
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(entry => entry.category === selectedCategory)
    }

    setFilteredEntries(filtered)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'programs': 'bg-blue-500',
      'admissions': 'bg-green-500',
      'campus': 'bg-purple-500',
      'careers': 'bg-orange-500',
      'international': 'bg-pink-500',
      'student_life': 'bg-yellow-500',
      'identity': 'bg-red-500'
    }
    return colors[category] || 'bg-gray-500'
  }

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
                onClick={() => router.push('/admin/analytics')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Database className="h-3 w-3 mr-1" />
              RAG Viewer
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Base de Connaissances RAG
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualisation en temps réel des données utilisées par le chatbot
          </p>
        </div>
        <Button onClick={fetchKnowledgeBase} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total d'entrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(stats.categories).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Résultats affichés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredEntries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrer par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Toutes ({stats.total})
            </Badge>
            {Object.entries(stats.categories).map(([category, count]) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer ${selectedCategory === category ? getCategoryColor(category) : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans la base de connaissances..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Entrées de la base de connaissances</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="mb-4 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(entry.category)}>
                              {entry.category}
                            </Badge>
                            <Badge variant="outline">
                              Confiance: {(entry.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{entry.question}</h3>
                        </div>
                        <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.answer}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Ajouté le: {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredEntries.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune entrée trouvée</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

