'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, BarChart3, FileText, MessageSquare } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Chatbot',
      href: '/',
      icon: MessageSquare,
      description: 'Assistant ESILV intelligent'
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: BarChart3,
      description: 'Dashboard et analytics'
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      description: 'Gestion des documents'
    }
  ]

  if (pathname === '/') {
    return null // Don't show navigation on main chat page
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">ESILV Smart Assistant</h1>
                <p className="text-slate-600">Système de chatbot multi-agents pour l'école d'ingénieurs</p>
              </div>
            </div>
            
            <nav className="flex gap-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}