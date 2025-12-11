'use client'

import { useState, useRef } from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react'

interface UploadedDocument {
  id: string
  title: string
  type: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

export default function DocumentUpload() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [isProcessingUrl, setIsProcessingUrl] = useState(false)

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const docId = Date.now().toString() + i
      
      const newDoc: UploadedDocument = {
        id: docId,
        title: file.name,
        type: file.type || 'unknown',
        size: file.size,
        status: 'uploading',
        progress: 0
      }
      
      setDocuments(prev => [...prev, newDoc])
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setDocuments(prev => prev.map(doc => 
            doc.id === docId 
              ? { ...doc, progress: Math.min(doc.progress + 10, 90) }
              : doc
          ))
        }, 200)
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        })
        
        clearInterval(progressInterval)
        
        if (response.ok) {
          const result = await response.json()
          setDocuments(prev => prev.map(doc => 
            doc.id === docId 
              ? { ...doc, status: 'processing', progress: 90 }
              : doc
          ))
          
          // Simulate processing
          setTimeout(() => {
            setDocuments(prev => prev.map(doc => 
              doc.id === docId 
                ? { ...doc, status: 'completed', progress: 100 }
                : doc
            ))
          }, 2000)
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { ...doc, status: 'error', error: 'Upload failed', progress: 0 }
            : doc
        ))
      }
    }
    
    setIsUploading(false)
  }

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return
    
    setIsProcessingUrl(true)
    const docId = Date.now().toString()
    
    const newDoc: UploadedDocument = {
      id: docId,
      title: urlInput,
      type: 'website',
      size: 0,
      status: 'processing',
      progress: 50
    }
    
    setDocuments(prev => [...prev, newDoc])
    
    try {
      const response = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlInput })
      })
      
      if (response.ok) {
        setTimeout(() => {
          setDocuments(prev => prev.map(doc => 
            doc.id === docId 
              ? { ...doc, status: 'completed', progress: 100 }
              : doc
          ))
        }, 2000)
      } else {
        throw new Error('URL processing failed')
      }
    } catch (error) {
      setDocuments(prev => prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'error', error: 'URL processing failed', progress: 0 }
          : doc
      ))
    } finally {
      setIsProcessingUrl(false)
      setUrlInput('')
    }
  }

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: UploadedDocument['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      uploading: 'secondary',
      processing: 'outline',
      completed: 'default',
      error: 'destructive'
    }
    
    const labels: Record<string, string> = {
      uploading: 'Upload en cours',
      processing: 'Traitement',
      completed: 'Terminé',
      error: 'Erreur'
    }
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto -mt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestion des documents</h1>
          <p className="text-slate-600 mt-2">Ajoutez des documents pour enrichir la base de connaissances du chatbot ESILV</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">Ajouter des documents</TabsTrigger>
            <TabsTrigger value="manage">Documents existants</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload de fichiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">Cliquez pour uploader ou glissez-déposez</p>
                    <p className="text-sm text-slate-500">PDF, DOC, DOCX, TXT (max 10MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                  </div>
                  
                  {isUploading && (
                    <div className="space-y-2">
                      <Label>Upload en cours...</Label>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* URL Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Import depuis URL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url">URL du document</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/document.pdf"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUrlUpload}
                    disabled={!urlInput.trim() || isProcessingUrl}
                    className="w-full"
                  >
                    {isProcessingUrl ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Importer depuis URL'
                    )}
                  </Button>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      L'URL doit pointer vers un document accessible publiquement (PDF, page web, etc.)
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Upload Progress */}
            {documents.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Progression de l'upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(doc.status)}
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-slate-500">
                              {doc.type} • {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {doc.progress > 0 && doc.progress < 100 && (
                            <div className="w-24">
                              <Progress value={doc.progress} className="h-2" />
                            </div>
                          )}
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Documents existants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Aucun document existant</p>
                  <p className="text-sm mt-2">Les documents uploadés apparaîtront ici</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}