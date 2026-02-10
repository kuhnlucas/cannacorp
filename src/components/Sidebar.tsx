import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Beaker, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { navigationSchema } from '../config/navigation';
import { NavigationGroup, NavigationItem } from '../types/navigation';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  // Find the index of the group that should be initially open
  const initialOpenIndex = navigationSchema.findIndex((group) => group.defaultOpen) ?? 0;
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number | null>(initialOpenIndex);

  const toggleGroup = (index: number) => {
    // If clicking the same group, close it; otherwise open the new one
    setExpandedGroupIndex(expandedGroupIndex === index ? null : index);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-green-50 dark:bg-green-900/10 text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`
        }
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            {item.badge.label}
          </span>
        )}
      </NavLink>
    );
  };

  const renderGroup = (group: NavigationGroup, index: number) => {
    const GroupIcon = group.icon;
    const isExpanded = expandedGroupIndex === index;

    return (
      <div key={index} className="mb-2">
        {/* Group header - Collapsible */}
        <button
          onClick={() => toggleGroup(index)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            isExpanded
              ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-300'
              : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center space-x-2">
            {GroupIcon && <GroupIcon className={`h-5 w-5 flex-shrink-0 transition-colors ${
              isExpanded 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-green-600 dark:text-green-500'
            }`} />}
            <span>{group.label}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-all duration-300 ${
              isExpanded 
                ? 'text-green-700 dark:text-green-300 rotate-180' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          />
        </button>

        {/* Group items - Animated collapse/expand */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-1 space-y-1 pl-2">
            {group.items.map((item) => renderNavigationItem(item))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Beaker className="h-8 w-8 text-green-600" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {t('header.appName')}
          </span>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationSchema.map((group, index) => renderGroup(group, index))}
      </nav>

      {/* Footer - Optional */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4 flex-shrink-0">
        <div className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</div>
      </div>
    </div>
  );
}