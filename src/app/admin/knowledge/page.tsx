'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Eye, Download, RefreshCw } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: string
  confidence: number
  createdAt: string
  updatedAt: string
}

interface CategoryStats {
  category: string
  count: number
  avgConfidence: number
}

export default function KnowledgeDatabaseManager() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)

  // Load knowledge base data
  useEffect(() => {
    loadKnowledgeBase()
    loadCategories()
  }, [])

  const loadKnowledgeBase = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/knowledge')
      const data = await response.json()
      
      if (data.success) {
        const knowledgeResponse = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search', query: '' })
        })
        const searchData = await knowledgeResponse.json()
        
        if (searchData.results && Array.isArray(searchData.results)) {
          setKnowledgeItems(searchData.results)
          setFilteredItems(searchData.results)
        }
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = () => {
    const categoryList = [
      'all',
      'specializations',
      'programs', 
      'admissions',
      'careers',
      'campus',
      'student_life',
      'international',
      'companies',
      'research',
      'technology',
      'contact'
    ]
    setCategories(categoryList)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredItems(knowledgeItems)
      return
    }
    
    const filtered = knowledgeItems.filter(item =>
      item.question.toLowerCase().includes(query.toLowerCase()) ||
      item.answer.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredItems(filtered)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    if (category === 'all') {
      setFilteredItems(knowledgeItems)
    } else {
      const filtered = knowledgeItems.filter(item => item.category === category)
      setFilteredItems(filtered)
    }
  }

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item)
    setIsCreateMode(false)
  }

  const handleCreate = () => {
    setEditingItem({
      id: '',
      question: '',
      answer: '',
      category: 'programs',
      confidence: 0.9,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    setIsCreateMode(true)
  }

  const handleSave = async (item: KnowledgeItem) => {
    try {
      setIsLoading(true)
      const url = isCreateMode ? '/api/knowledge' : '/api/knowledge'
      const method = isCreateMode ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isCreateMode ? 'create' : 'update',
          item: item
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadKnowledgeBase()
        setEditingItem(null)
        setIsCreateMode(false)
        alert(isCreateMode ? 'Entrée créée avec succès !' : 'Entrée mise à jour avec succès !')
      } else {
        alert('Erreur: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      return
    }
    
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadKnowledgeBase()
        alert('Entrée supprimée avec succès !')
      } else {
        alert('Erreur: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleExport = async () => {
    try {
      const dataStr = JSON.stringify(filteredItems, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `esilv-knowledge-base-${new Date().toISOString().split('T')[0]}.json`
      link.click()
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Erreur lors de l\'export')
    }
  }

  const getCategoryStats = (): CategoryStats[] => {
    const stats: Record<string, CategoryStats> = {}
    
    knowledgeItems.forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = {
          category: item.category,
          count: 0,
          avgConfidence: 0
        }
      }
      stats[item.category].count++
      stats[item.category].avgConfidence += item.confidence
    })

    return Object.values(stats)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                Base de Connaissances ESILV
              </CardTitle>
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={loadKnowledgeBase}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total entrées</p>
                  <p className="text-2xl font-bold text-slate-900">{knowledgeItems.length}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Catégories</p>
                  <p className="text-2xl font-bold text-slate-900">{categories.length - 1}</p>
                </div>
                <div className="flex gap-1">
                  {getCategoryStats().map((stat, index) => (
                    <div key={index} className="text-right">
                      <Badge 
                        className={getConfidenceColor(stat.avgConfidence)}
                        title={`Confiance moyenne: ${stat.avgConfidence.toFixed(2)}`}
                      >
                        {stat.category}
                      </Badge>
                      <span className="ml-2 text-sm text-slate-600">
                        ({stat.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Connaissances</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Recherchercher dans la base de connaissances..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button onClick={handleCreate} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('all')}
              >
                Toutes
              </Button>
              {categories.slice(1).map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Create/Edit Form */}
            {(isCreateMode || editingItem) && (
              <Card className="mb-6 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle>
                    {isCreateMode ? 'Ajouter une entrée' : 'Modifier une entrée'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Question
                    </label>
                    <Input
                      value={editingItem?.question || ''}
                      onChange={(e) => setEditingItem({...editingItem, question: e.target.value})}
                      placeholder="Ex: Quelles sont les majeures à ESILV ?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Réponse
                    </label>
                    <textarea
                      value={editingItem?.answer || ''}
                      onChange={(e) => setEditingItem({...editingItem, answer: e.target.value})}
                      placeholder="Réponse détaillée..."
                      className="min-h-[200px] w-full p-3 border rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={editingItem?.category || 'programs'}
                        onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="programs">Programmes</option>
                        <option value="specializations">Spécialisations</option>
                        <option value="admissions">Admissions</option>
                        <option value="careers">Carrières</option>
                        <option value="campus">Campus</option>
                        <option value="student_life">Vie étudiante</option>
                        <option value="international">International</option>
                        <option value="companies">Entreprises</option>
                        <option value="technology">Technologie</option>
                        <option value="contact">Contact</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confiance
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={editingItem?.confidence || 0.9}
                        onChange={(e) => setEditingItem({...editingItem, confidence: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setIsCreateMode(false)
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => handleSave(editingItem)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Knowledge Items Table */}
            <div className="border rounded-lg">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Question</TableHead>
                      <TableHead className="flex-1">Réponse</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-[400px]">
                          <div className="max-w-[350px]">
                            <p className="text-sm font-medium line-clamp-2">
                              {item.question}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="flex-1">
                          <div className="max-w-[300px]">
                            <p className="text-sm line-clamp-3">
                              {item.answer}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConfidenceColor(item.confidence)}>
                            {(item.confidence * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(item.answer)
                                .then(() => alert('Réponse copiée dans le presse-papiers !'))
                                .catch(() => alert('Erreur lors de la copie'))
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p>Aucune entrée trouvée</p>
                <p className="text-sm">
                  {searchQuery ? 'Aucun résultat pour votre recherche' : 'La base de connaissances est vide'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}