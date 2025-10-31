'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  title: string
  description: string
  category: string
  image: string
  gradient: string
  prompt: string
}

const templates: Template[] = [
  {
    id: '1',
    title: 'SaaS Landing Page',
    description: 'Modern landing page with hero section, features, and pricing',
    category: 'Marketing',
    image: '/templates/saas-landing.jpg',
    gradient: 'from-blue-500 to-purple-600',
    prompt: 'Create a modern SaaS landing page with hero section, features grid, testimonials, and pricing cards'
  },
  {
    id: '2',
    title: 'E-commerce Store',
    description: 'Full-featured online store with product catalog and cart',
    category: 'E-commerce',
    image: '/templates/ecommerce.jpg',
    gradient: 'from-green-500 to-emerald-600',
    prompt: 'Build an e-commerce product page with image gallery, add to cart, and product details'
  },
  {
    id: '3',
    title: 'Dashboard Analytics',
    description: 'Data visualization dashboard with charts and metrics',
    category: 'Dashboard',
    image: '/templates/dashboard.jpg',
    gradient: 'from-orange-500 to-red-600',
    prompt: 'Design an analytics dashboard with charts, metrics cards, and data tables'
  },
  {
    id: '4',
    title: 'Portfolio Website',
    description: 'Personal portfolio with projects showcase and contact form',
    category: 'Portfolio',
    image: '/templates/portfolio.jpg',
    gradient: 'from-purple-500 to-pink-600',
    prompt: 'Create a portfolio website with project gallery, about section, and contact form'
  },
  {
    id: '5',
    title: 'Blog Platform',
    description: 'Clean blog layout with article cards and reading experience',
    category: 'Content',
    image: '/templates/blog.jpg',
    gradient: 'from-cyan-500 to-blue-600',
    prompt: 'Build a blog homepage with article cards, categories, and featured posts'
  },
  {
    id: '6',
    title: 'Task Manager',
    description: 'Kanban-style task board with drag-and-drop functionality',
    category: 'Productivity',
    image: '/templates/task-manager.jpg',
    gradient: 'from-indigo-500 to-purple-600',
    prompt: 'Create a task management app with kanban board, task cards, and status columns'
  }
]

interface TemplatesShowcaseProps {
  onSelectTemplate: (prompt: string) => void
}

export function TemplatesShowcase({ onSelectTemplate }: TemplatesShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-4">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Templates & Examples
          </span>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Start with a Template
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from our curated collection of templates or describe your own idea
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectTemplate(template.prompt)}
          >
            {/* Image/Preview */}
            <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${template.gradient}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-20`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <div className={`text-6xl mb-2 transition-transform duration-300 ${hoveredId === template.id ? 'scale-110' : 'scale-100'}`}>
                    {template.category === 'Marketing' && '🚀'}
                    {template.category === 'E-commerce' && '🛍️'}
                    {template.category === 'Dashboard' && '📊'}
                    {template.category === 'Portfolio' && '💼'}
                    {template.category === 'Content' && '📝'}
                    {template.category === 'Productivity' && '✅'}
                  </div>
                </div>
              </div>
              {/* Overlay on hover */}
              <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${hoveredId === template.id ? 'opacity-100' : 'opacity-0'}`}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  Use Template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {template.description}
              </p>
            </div>

            {/* Hover indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${template.gradient} transition-transform duration-300 ${hoveredId === template.id ? 'scale-x-100' : 'scale-x-0'}`} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Can't find what you're looking for?
        </p>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            const textarea = document.querySelector('textarea')
            if (textarea) {
              textarea.focus()
            }
          }}
          className="group"
        >
          <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
          Describe your own idea
        </Button>
      </div>
    </div>
  )
}
