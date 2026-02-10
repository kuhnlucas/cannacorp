/**
 * Guías de Cultivo
 * (Controlado por feature flag resources_guides)
 */

import React from 'react';
import { BookOpen, ExternalLink, ChevronRight } from 'lucide-react';
import Card from '../../components/Card';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useLanguage } from '../../contexts/LanguageContext';

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  url?: string;
}

export default function GuidesPage() {
  const { t } = useLanguage();

  const guides: Guide[] = [
    {
      id: '1',
      title: 'Guía de nutrientes para vegetación',
      description:
        'Aprende los mejores nutrientes y dosis para la fase vegetativa de tu cultivo',
      category: 'Nutrientes',
      difficulty: 'beginner',
      readTime: 15,
    },
    {
      id: '2',
      title: 'Control integrado de plagas',
      description: 'Métodos preventivos y curativos para mantener tu cultivo libre de plagas',
      category: 'Plagas',
      difficulty: 'intermediate',
      readTime: 20,
    },
    {
      id: '3',
      title: 'Genética: Selección y mantenimiento',
      description:
        'Cómo seleccionar, mantener y reproducir cepas de genética de calidad',
      category: 'Genética',
      difficulty: 'advanced',
      readTime: 30,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const breadcrumbs = [
    { label: 'Recursos', href: '/resources/guides' },
    { label: 'Guías', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Guías de Cultivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Recursos educativos para mejorar tu técnica de cultivo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Card
              key={guide.id}
              className="flex flex-col hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {guide.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {guide.description}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {guide.category}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                    {guide.difficulty === 'beginner'
                      ? 'Principiante'
                      : guide.difficulty === 'intermediate'
                        ? 'Intermedio'
                        : 'Avanzado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ~{guide.readTime} min de lectura
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
