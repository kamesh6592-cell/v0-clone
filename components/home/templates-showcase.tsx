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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header - Bolt.new style */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-effect border border-white/10 mb-6">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-sm font-semibold gradient-text">
            Templates & Examples
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
          Start with a <span className="gradient-text">Template</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Choose from our curated collection of templates or describe your own idea
        </p>
      </div>

      {/* Templates Grid - Bolt.new style cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className="group relative glass-effect rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectTemplate(template.prompt)}
          >
            {/* Image/Preview - Bolt.new style */}
            <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${template.gradient}`}>
              <div className="absolute inset-0 backdrop-blur-3xl opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <div className={`text-7xl mb-2 transition-all duration-500 ${hoveredId === template.id ? 'scale-125 rotate-6' : 'scale-100 rotate-0'}`}>
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
              <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${hoveredId === template.id ? 'opacity-100' : 'opacity-0'}`}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl"
                >
                  Use Template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-indigo-400 glass-effect px-3 py-1.5 rounded-full border border-indigo-500/30">
                  {template.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {template.title}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {template.description}
              </p>
            </div>

            {/* Hover glow effect */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${template.gradient} transition-all duration-300 ${hoveredId === template.id ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
            <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} />
          </div>
        ))}
      </div>

      {/* CTA - Bolt.new style */}
      <div className="mt-16 text-center">
        <p className="text-gray-400 mb-6 text-lg">
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
          className="group glass-effect border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-gray-300 hover:text-white px-8 py-6 text-base rounded-xl shadow-lg"
        >
          <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform text-indigo-400" />
          Describe your own idea
        </Button>
      </div>
    </div>
  )
}
