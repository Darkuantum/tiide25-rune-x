'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Search,
  Filter,
  BookOpen,
  Globe,
  Calendar,
  User,
  BarChart3,
  Download,
  Share,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface Translation {
  id: string
  originalText: string
  translatedText: string
  confidence: number
  language: string
  context?: string
  createdAt: string
  upload: {
    id?: string
    originalName: string
    status: string
    imageUrl?: string
  }
  glyphs?: Array<{
    symbol: string
    confidence: number
    meaning?: string
    script?: string
  }>
}

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchTranslations()
  }, [selectedTab])

  useEffect(() => {
    // Re-fetch when search term changes (with debounce would be better, but keeping simple)
    const timeoutId = setTimeout(() => {
      if (searchTerm || selectedTab) {
        fetchTranslations()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedTab])

  const fetchTranslations = async () => {
    try {
      const filterParam = selectedTab === 'high-confidence' ? 'high-confidence' : 
                         selectedTab === 'recent' ? 'recent' : 'all'
      
      const url = `/api/translations?filter=${filterParam}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/auth/login'
          return
        }
        throw new Error('Failed to fetch translations')
      }

      const data = await response.json()
      
      if (data.success && data.translations && Array.isArray(data.translations)) {
        setTranslations(data.translations)
      } else {
        // Fallback to empty array or mock data for development
        setTranslations([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch translations:', error)
      setLoading(false)
    }
  }

  // No need for separate filter function since API handles filtering
  useEffect(() => {
    setFilteredTranslations(translations)
  }, [translations])

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'default'
    if (confidence >= 0.8) return 'secondary'
    return 'destructive'
  }

  // Match glyph confidence colouring with results page
  const getGlyphConfidenceColor = (confidence: number) => {
    if (confidence === 0) return 'text-red-600' // Unknown characters
    if (confidence < 0.3) return 'text-red-500'
    if (confidence < 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getGlyphConfidenceBgColor = (confidence: number) => {
    if (confidence === 0) return 'bg-red-50 border-red-200' // Unknown characters
    if (confidence < 0.3) return 'bg-red-50 border-red-200'
    if (confidence < 0.7) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Translations</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/upload">
                <Eye className="mr-2 h-4 w-4" />
                New Analysis
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={resetting}
              onClick={async () => {
                const confirm = window.confirm(
                  'This will wipe the entire database (including users). Continue?'
                )
                if (!confirm) return
                setResetting(true)
                try {
                  const resp = await fetch('/api/admin/reset', { method: 'POST' })
                  if (!resp.ok) {
                    const data = await resp.json().catch(() => ({}))
                    throw new Error(data.error || 'Failed to reset database')
                  }
                  setTranslations([])
                  setFilteredTranslations([])
                  alert('Database reset successfully. You will be signed out.')
                  await signOut({ callbackUrl: '/' })
                } catch (err: any) {
                  console.error(err)
                  alert(err.message || 'Failed to reset database')
                } finally {
                  setResetting(false)
                }
              }}
            >
              {resetting ? 'Resetting...' : 'Reset DB'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Translation Library
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse and manage your AI-powered ancient text translations
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Translations</p>
                    <p className="text-2xl font-bold">{translations.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Confidence</p>
                    <p className="text-2xl font-bold text-green-600">
                      {translations.filter(t => t.confidence >= 0.9).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold">
                      {translations.length > 0 
                        ? (translations.reduce((sum, t) => sum + t.confidence, 0) / translations.length * 100).toFixed(1) + '%'
                        : '0%'
                      }
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Languages</p>
                    <p className="text-2xl font-bold">
                      {new Set(translations.map(t => t.language)).size}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-purple-600/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search translations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({translations.length})</TabsTrigger>
              <TabsTrigger value="high-confidence">
                High Confidence ({translations.filter(t => t.confidence >= 0.9).length})
              </TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading translations...</p>
                </div>
              ) : filteredTranslations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No translations match your search criteria.' : 'No translations found.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredTranslations.map((translation) => (
                    <Card key={translation.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getConfidenceBadge(translation.confidence)}>
                                {(translation.confidence * 100).toFixed(1)}% confidence
                              </Badge>
                              <Badge variant="outline">{translation.language}</Badge>
                              <Badge variant="outline">{translation.upload.status}</Badge>
                            </div>
                            <CardTitle className="text-xl">{translation.originalText}</CardTitle>
                            <CardDescription className="text-sm">
                              {translation.upload.originalName} • {formatDate(translation.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share className="mr-2 h-4 w-4" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Original Image */}
                        <div>
                          <h4 className="font-medium mb-2">Original Image</h4>
                          {translation.upload.imageUrl ? (
                            <img
                              src={translation.upload.imageUrl}
                              alt={translation.upload.originalName || 'Uploaded image'}
                              className="max-h-64 rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement
                                if (parent && !parent.querySelector('.image-placeholder')) {
                                  const placeholder = document.createElement('div')
                                  placeholder.className = 'image-placeholder bg-muted/50 p-6 rounded border text-center text-muted-foreground'
                                  placeholder.innerHTML = '<p>Image not available</p>'
                                  parent.appendChild(placeholder)
                                }
                              }}
                            />
                          ) : (
                            <div className="bg-muted/50 p-6 rounded border text-center text-muted-foreground">
                              <p>Image not available</p>
                              <p className="text-xs mt-2">The original file may have been deleted or moved</p>
                            </div>
                          )}
                        </div>

                        {/* Translation */}
                        <div>
                          <h4 className="font-medium mb-2">Translation</h4>
                          <p className="text-sm leading-relaxed">{translation.translatedText}</p>
                        </div>

                        {/* Context */}
                        {translation.context && (
                          <div>
                            <h4 className="font-medium mb-2">Context</h4>
                            <p className="text-sm text-muted-foreground">{translation.context}</p>
                          </div>
                        )}

                        {/* Glyphs */}
                        {translation.glyphs && translation.glyphs.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3">Detected Glyphs</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {translation.glyphs.map((glyph, index) => {
                                const confidence = glyph.confidence || 0
                                const confidencePercent = confidence * 100

                                return (
                                  <div
                                    key={index}
                                    className={`text-center p-4 border-2 rounded-lg ${getGlyphConfidenceBgColor(confidence)}`}
                                  >
                                    <div
                                      className={`text-2xl mb-2 font-bold ${getGlyphConfidenceColor(confidence)}`}
                                    >
                                      {glyph.symbol}
                                    </div>
                                    <div className="text-sm font-medium mb-1 min-h-[2.5rem]">
                                      {glyph.meaning || 'No meaning available'}
                                    </div>
                                    <div
                                      className={`text-xs font-semibold ${getGlyphConfidenceColor(confidence)}`}
                                    >
                                      {confidencePercent.toFixed(1)}% match
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}