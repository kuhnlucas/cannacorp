import React, { useState } from 'react';
import { AlertTriangle, Droplets, Leaf, Bug, Wind, Search, ChevronRight } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useLanguage } from '../contexts/LanguageContext';

interface Problem {
  id: string;
  name: string;
  category: 'deficiency' | 'excess' | 'pest' | 'disease' | 'environmental';
  symptoms: string[];
  causes: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high';
  affectedAreas?: string[];
  icon: React.ReactNode;
}

export default function Problems() {
  const { t } = useLanguage();
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const problems: Problem[] = [
    {
      id: 'nitrogen-deficiency',
      name: t('problems.nitrogenDeficiency'),
      category: 'deficiency',
      symptoms: [
        t('problems.symptom1'),
        t('problems.symptom2'),
        t('problems.symptom3'),
      ],
      causes: [
        t('problems.cause1'),
        t('problems.cause2'),
      ],
      solutions: [
        t('problems.solution1'),
        t('problems.solution2'),
      ],
      severity: 'high',
      icon: <Leaf className="h-6 w-6 text-yellow-600" />,
    },
    {
      id: 'spider-mites',
      name: t('problems.spiderMites'),
      category: 'pest',
      symptoms: [
        t('problems.pestSymptom1'),
        t('problems.pestSymptom2'),
        t('problems.pestSymptom3'),
      ],
      causes: [
        t('problems.pestCause1'),
        t('problems.pestCause2'),
      ],
      solutions: [
        t('problems.pestSolution1'),
        t('problems.pestSolution2'),
        t('problems.pestSolution3'),
      ],
      severity: 'high',
      icon: <Bug className="h-6 w-6 text-red-600" />,
    },
    {
      id: 'powdery-mildew',
      name: t('problems.powderyMildew'),
      category: 'disease',
      symptoms: [
        t('problems.diseaseSymptom1'),
        t('problems.diseaseSymptom2'),
      ],
      causes: [
        t('problems.diseaseCause1'),
        t('problems.diseaseCause2'),
      ],
      solutions: [
        t('problems.diseaseSolution1'),
        t('problems.diseaseSolution2'),
      ],
      severity: 'high',
      icon: <Wind className="h-6 w-6 text-gray-500" />,
    },
    {
      id: 'phosphorus-deficiency',
      name: t('problems.phosphorusDeficiency'),
      category: 'deficiency',
      symptoms: [
        t('problems.pSymptom1'),
        t('problems.pSymptom2'),
      ],
      causes: [
        t('problems.pCause1'),
      ],
      solutions: [
        t('problems.pSolution1'),
        t('problems.pSolution2'),
      ],
      severity: 'medium',
      icon: <Leaf className="h-6 w-6 text-purple-600" />,
    },
    {
      id: 'potassium-excess',
      name: t('problems.potassiumExcess'),
      category: 'excess',
      symptoms: [
        t('problems.excessSymptom1'),
        t('problems.excessSymptom2'),
      ],
      causes: [
        t('problems.excessCause1'),
      ],
      solutions: [
        t('problems.excessSolution1'),
        t('problems.excessSolution2'),
      ],
      severity: 'medium',
      icon: <Droplets className="h-6 w-6 text-blue-600" />,
    },
    {
      id: 'high-temperature-stress',
      name: t('problems.highTempStress'),
      category: 'environmental',
      symptoms: [
        t('problems.tempSymptom1'),
        t('problems.tempSymptom2'),
        t('problems.tempSymptom3'),
      ],
      causes: [
        t('problems.tempCause1'),
        t('problems.tempCause2'),
      ],
      solutions: [
        t('problems.tempSolution1'),
        t('problems.tempSolution2'),
        t('problems.tempSolution3'),
      ],
      severity: 'high',
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
    },
    {
      id: 'aphids',
      name: t('problems.aphids'),
      category: 'pest',
      symptoms: [
        t('problems.aphidSymptom1'),
        t('problems.aphidSymptom2'),
        t('problems.aphidSymptom3'),
      ],
      causes: [
        t('problems.aphidCause1'),
        t('problems.aphidCause2'),
      ],
      solutions: [
        t('problems.aphidSolution1'),
        t('problems.aphidSolution2'),
        t('problems.aphidSolution3'),
      ],
      severity: 'high',
      icon: <Bug className="h-6 w-6 text-green-600" />,
    },
    {
      id: 'whiteflies',
      name: t('problems.whiteflies'),
      category: 'pest',
      symptoms: [
        t('problems.whiteflySymptom1'),
        t('problems.whiteflySymptom2'),
        t('problems.whiteflySymptom3'),
      ],
      causes: [
        t('problems.whiteflyCause1'),
        t('problems.whiteflyCause2'),
      ],
      solutions: [
        t('problems.whiteflySolution1'),
        t('problems.whiteflySolution2'),
        t('problems.whiteflySolution3'),
      ],
      severity: 'high',
      icon: <Bug className="h-6 w-6 text-gray-400" />,
    },
    {
      id: 'thrips',
      name: t('problems.thrips'),
      category: 'pest',
      symptoms: [
        t('problems.thripSymptom1'),
        t('problems.thripSymptom2'),
        t('problems.thripSymptom3'),
      ],
      causes: [
        t('problems.thripCause1'),
        t('problems.thripCause2'),
      ],
      solutions: [
        t('problems.thripSolution1'),
        t('problems.thripSolution2'),
        t('problems.thripSolution3'),
      ],
      severity: 'medium',
      icon: <Bug className="h-6 w-6 text-orange-500" />,
    },
    {
      id: 'fungus-gnats',
      name: t('problems.fungusGnats'),
      category: 'pest',
      symptoms: [
        t('problems.gnatSymptom1'),
        t('problems.gnatSymptom2'),
        t('problems.gnatSymptom3'),
      ],
      causes: [
        t('problems.gnatCause1'),
        t('problems.gnatCause2'),
      ],
      solutions: [
        t('problems.gnatSolution1'),
        t('problems.gnatSolution2'),
        t('problems.gnatSolution3'),
      ],
      severity: 'medium',
      icon: <Bug className="h-6 w-6 text-black" />,
    },
    {
      id: 'mealybugs',
      name: t('problems.mealybugs'),
      category: 'pest',
      symptoms: [
        t('problems.mealybugSymptom1'),
        t('problems.mealybugSymptom2'),
        t('problems.mealybugSymptom3'),
      ],
      causes: [
        t('problems.mealybugCause1'),
        t('problems.mealybugCause2'),
      ],
      solutions: [
        t('problems.mealybugSolution1'),
        t('problems.mealybugSolution2'),
        t('problems.mealybugSolution3'),
      ],
      severity: 'high',
      icon: <Bug className="h-6 w-6 text-pink-500" />,
    },
    {
      id: 'botrytis',
      name: t('problems.botrytis'),
      category: 'disease',
      symptoms: [
        t('problems.botrytisSymptom1'),
        t('problems.botrytisSymptom2'),
        t('problems.botrytisSymptom3'),
      ],
      causes: [
        t('problems.botrytis Cause1'),
        t('problems.botrytis Cause2'),
      ],
      solutions: [
        t('problems.botrytis Solution1'),
        t('problems.botrytis Solution2'),
        t('problems.botrytis Solution3'),
      ],
      severity: 'high',
      icon: <Wind className="h-6 w-6 text-gray-600" />,
    },
    {
      id: 'leaf-spot',
      name: t('problems.leafSpot'),
      category: 'disease',
      symptoms: [
        t('problems.leafSpotSymptom1'),
        t('problems.leafSpotSymptom2'),
        t('problems.leafSpotSymptom3'),
      ],
      causes: [
        t('problems.leafSpotCause1'),
        t('problems.leafSpotCause2'),
      ],
      solutions: [
        t('problems.leafSpotSolution1'),
        t('problems.leafSpotSolution2'),
        t('problems.leafSpotSolution3'),
      ],
      severity: 'medium',
      icon: <Wind className="h-6 w-6 text-brown-500" />,
    },
    {
      id: 'root-rot',
      name: t('problems.rootRot'),
      category: 'disease',
      symptoms: [
        t('problems.rootRotSymptom1'),
        t('problems.rootRotSymptom2'),
        t('problems.rootRotSymptom3'),
      ],
      causes: [
        t('problems.rootRotCause1'),
        t('problems.rootRotCause2'),
      ],
      solutions: [
        t('problems.rootRotSolution1'),
        t('problems.rootRotSolution2'),
        t('problems.rootRotSolution3'),
      ],
      severity: 'high',
      icon: <AlertTriangle className="h-6 w-6 text-red-700" />,
    },
    {
      id: 'magnesium-deficiency',
      name: t('problems.magnesiumDeficiency'),
      category: 'deficiency',
      symptoms: [
        t('problems.magSymptom1'),
        t('problems.magSymptom2'),
        t('problems.magSymptom3'),
      ],
      causes: [
        t('problems.magCause1'),
        t('problems.magCause2'),
      ],
      solutions: [
        t('problems.magSolution1'),
        t('problems.magSolution2'),
        t('problems.magSolution3'),
      ],
      severity: 'medium',
      icon: <Leaf className="h-6 w-6 text-green-400" />,
    },
    {
      id: 'calcium-deficiency',
      name: t('problems.calciumDeficiency'),
      category: 'deficiency',
      symptoms: [
        t('problems.caSymptom1'),
        t('problems.caSymptom2'),
        t('problems.caSymptom3'),
      ],
      causes: [
        t('problems.caCause1'),
        t('problems.caCause2'),
      ],
      solutions: [
        t('problems.caSolution1'),
        t('problems.caSolution2'),
        t('problems.caSolution3'),
      ],
      severity: 'high',
      icon: <Leaf className="h-6 w-6 text-indigo-500" />,
    },
    {
      id: 'iron-deficiency',
      name: t('problems.ironDeficiency'),
      category: 'deficiency',
      symptoms: [
        t('problems.feSymptom1'),
        t('problems.feSymptom2'),
        t('problems.feSymptom3'),
      ],
      causes: [
        t('problems.feCause1'),
        t('problems.feCause2'),
      ],
      solutions: [
        t('problems.feSolution1'),
        t('problems.feSolution2'),
        t('problems.feSolution3'),
      ],
      severity: 'medium',
      icon: <Leaf className="h-6 w-6 text-red-300" />,
    },
    {
      id: 'low-humidity-stress',
      name: t('problems.lowHumidityStress'),
      category: 'environmental',
      symptoms: [
        t('problems.lowHumSymptom1'),
        t('problems.lowHumSymptom2'),
        t('problems.lowHumSymptom3'),
      ],
      causes: [
        t('problems.lowHumCause1'),
        t('problems.lowHumCause2'),
      ],
      solutions: [
        t('problems.lowHumSolution1'),
        t('problems.lowHumSolution2'),
        t('problems.lowHumSolution3'),
      ],
      severity: 'medium',
      icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    },
    {
      id: 'light-burn',
      name: t('problems.lightBurn'),
      category: 'environmental',
      symptoms: [
        t('problems.lightBurnSymptom1'),
        t('problems.lightBurnSymptom2'),
        t('problems.lightBurnSymptom3'),
      ],
      causes: [
        t('problems.lightBurnCause1'),
        t('problems.lightBurnCause2'),
      ],
      solutions: [
        t('problems.lightBurnSolution1'),
        t('problems.lightBurnSolution2'),
        t('problems.lightBurnSolution3'),
      ],
      severity: 'medium',
      icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
    },
  ];

  const categories = [
    { value: 'all', label: t('problems.allProblems') },
    { value: 'deficiency', label: t('problems.deficiencies') },
    { value: 'excess', label: t('problems.excesses') },
    { value: 'pest', label: t('problems.pests') },
    { value: 'disease', label: t('problems.diseases') },
    { value: 'environmental', label: t('problems.environmental') },
  ];

  const filteredProblems = problems.filter(problem => {
    const matchesCategory = selectedCategory === 'all' || problem.category === selectedCategory;
    const matchesSearch = problem.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedProblemData = problems.find(p => p.id === selectedProblem);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'deficiency': return <Leaf className="h-4 w-4" />;
      case 'excess': return <Droplets className="h-4 w-4" />;
      case 'pest': return <Bug className="h-4 w-4" />;
      case 'disease': return <Wind className="h-4 w-4" />;
      case 'environmental': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('problems.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('problems.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problems List */}
        <div className="lg:col-span-1 space-y-4">
          <Card title={t('problems.problems')} className="h-full">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('problems.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {cat.value !== 'all' && getCategoryIcon(cat.value)}
                      <span>{cat.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Problems */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProblems.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => setSelectedProblem(problem.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all border ${
                      selectedProblem === problem.id
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{problem.name}</p>
                        <div className="mt-1">
                          <Badge
                            variant={getSeverityColor(problem.severity)}
                            size="sm"
                          >
                            {problem.severity === 'high' ? t('problems.severe') :
                             problem.severity === 'medium' ? t('problems.moderate') :
                             t('problems.mild')}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        selectedProblem === problem.id ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Problem Details */}
        <div className="lg:col-span-2">
          {selectedProblemData ? (
            <Card className="h-full">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {selectedProblemData.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedProblemData.name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={getSeverityColor(selectedProblemData.severity)}>
                          {selectedProblemData.severity === 'high' ? t('problems.severe') :
                           selectedProblemData.severity === 'medium' ? t('problems.moderate') :
                           t('problems.mild')}
                        </Badge>
                        <Badge variant="info">
                          {selectedProblemData.category === 'deficiency' ? t('problems.deficiencies') :
                           selectedProblemData.category === 'excess' ? t('problems.excesses') :
                           selectedProblemData.category === 'pest' ? t('problems.pests') :
                           selectedProblemData.category === 'disease' ? t('problems.diseases') :
                           t('problems.environmental')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('problems.symptoms')}
                  </h3>
                  <ul className="space-y-2">
                    {selectedProblemData.symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-start space-x-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Causes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('problems.causes')}
                  </h3>
                  <ul className="space-y-2">
                    {selectedProblemData.causes.map((cause, index) => (
                      <li key={index} className="flex items-start space-x-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solutions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('problems.solutions')}
                  </h3>
                  <ul className="space-y-2">
                    {selectedProblemData.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('problems.selectProblem')}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
