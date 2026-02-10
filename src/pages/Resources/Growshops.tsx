/**
 * Growshops
 * Directorio de tiendas y proveedores
 * (Controlado por feature flag resources_growshops)
 */

import React, { useState } from 'react';
import { ShoppingCart, MapPin, Globe, Phone, Star } from 'lucide-react';
import Card from '../../components/Card';
import Breadcrumbs from '../../components/Breadcrumbs';
import Badge from '../../components/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

interface Growshop {
  id: string;
  name: string;
  description: string;
  location: string;
  website?: string;
  phone?: string;
  category: string;
  rating: number;
  specialties: string[];
}

export default function GrowshopsPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const growshops: Growshop[] = [
    {
      id: '1',
      name: 'HydroGrow Pro',
      description: 'Equipos de última generación para cultivos hidropónicos',
      location: 'Buenos Aires',
      website: 'www.hydrogrow.com.ar',
      phone: '+54 11 4567-8901',
      category: 'Hidropónica',
      rating: 4.8,
      specialties: ['Sistemas hidropónicos', 'Nutrientes', 'Controladores'],
    },
    {
      id: '2',
      name: 'Sustratos Premium',
      description: 'Sustratos de alta calidad y medios de cultivo especializados',
      location: 'CABA',
      website: 'www.sustratospremium.com.ar',
      phone: '+54 11 2345-6789',
      category: 'Sustratos',
      rating: 4.6,
      specialties: ['Sustratos orgánicos', 'Fibra de coco', 'Tierra premium'],
    },
    {
      id: '3',
      name: 'Iluminación LED Avanzada',
      description: 'Equipos LED de espectro completo para todas las fases',
      location: 'Córdoba',
      website: 'www.ledbotanica.com.ar',
      phone: '+54 351 1234-5678',
      category: 'Iluminación',
      rating: 4.7,
      specialties: ['LED de espectro completo', 'Sistemas de control', 'Accesorios'],
    },
    {
      id: '4',
      name: 'Nutrientes Orgánicos Bio',
      description: 'Línea completa de nutrientes orgánicos certificados',
      location: 'Mendoza',
      website: 'www.bionutrientes.com.ar',
      phone: '+54 261 9876-5432',
      category: 'Nutrientes',
      rating: 4.5,
      specialties: ['Nutrientes orgánicos', 'Bioestimulantes', 'Enmiendas'],
    },
  ];

  const categories = [
    'all',
    'Hidropónica',
    'Sustratos',
    'Iluminación',
    'Nutrientes',
  ];
  const filteredShops =
    selectedCategory === 'all'
      ? growshops
      : growshops.filter((s) => s.category === selectedCategory);

  const breadcrumbs = [
    { label: 'Recursos', href: '/resources/growshops' },
    { label: 'Growshops', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Directorio de Growshops
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Proveedores y tiendas especializadas en equipamiento para cultivos
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Lista de growshops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredShops.map((shop) => (
            <Card key={shop.id} className="flex flex-col hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {shop.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {shop.rating}
                  </span>
                </div>
              </div>

              <Badge variant="info" size="sm" className="mb-4 w-fit">
                {shop.category}
              </Badge>

              <div className="space-y-3 mb-4 flex-1">
                {shop.specialties.map((specialty, idx) => (
                  <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    • {specialty}
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.location}</span>
                </div>
                {shop.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${shop.phone}`}
                      className="hover:text-green-600 dark:hover:text-green-400"
                    >
                      {shop.phone}
                    </a>
                  </div>
                )}
                {shop.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <a
                      href={`https://${shop.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:underline"
                    >
                      {shop.website}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
