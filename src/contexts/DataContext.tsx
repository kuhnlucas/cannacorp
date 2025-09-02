import React, { createContext, useContext, useState } from 'react';

interface Lab {
  id: string;
  name: string;
  type: string;
  m2: number;
  cycle: string;
}

interface Genetics {
  id: string;
  name: string;
  breeder: string;
  origin: string;
  indicaPct: number;
  sativaPct: number;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  terpenes: string[];
  floweringDays: number;
  yieldEstimate: string;
  notes: string;
  parents?: { mother?: string; father?: string };
}

interface Batch {
  id: string;
  labId: string;
  geneticsId: string;
  phenotype: string;
  code: string;
  sowingDate: string;
  state: 'vegetative' | 'flowering' | 'harvested';
  notes: string;
  plantCount: number;
}

interface Measurement {
  id: string;
  batchId: string;
  type: 'temperature' | 'humidity' | 'ph' | 'ec' | 'ppfd';
  value: number;
  unit: string;
  takenAt: string;
  source: 'manual' | 'iot';
}

interface DataContextType {
  labs: Lab[];
  genetics: Genetics[];
  batches: Batch[];
  measurements: Measurement[];
  addLab: (lab: Omit<Lab, 'id'>) => void;
  addGenetics: (genetics: Omit<Genetics, 'id'>) => void;
  addBatch: (batch: Omit<Batch, 'id'>) => void;
  addMeasurement: (measurement: Omit<Measurement, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [labs, setLabs] = useState<Lab[]>([
    { id: '1', name: 'Veg Room A', type: 'Vegetative', m2: 25, cycle: '18/6' },
    { id: '2', name: 'Flower Room B', type: 'Flowering', m2: 40, cycle: '12/12' },
  ]);

  const [genetics, setGenetics] = useState<Genetics[]>([
    {
      id: '1',
      name: 'OG Kush',
      breeder: 'DNA Genetics',
      origin: 'California, USA',
      indicaPct: 75,
      sativaPct: 25,
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.3,
      terpenes: ['Myrcene', 'Limonene', 'Caryophyllene'],
      floweringDays: 58,
      yieldEstimate: '450-550g/m²',
      notes: 'Classic strain with earthy, pine flavors'
    },
    {
      id: '2',
      name: 'Blue Dream',
      breeder: 'Humboldt Seeds',
      origin: 'California, USA',
      indicaPct: 40,
      sativaPct: 60,
      thcMin: 17,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2,
      terpenes: ['Myrcene', 'Pinene', 'Caryophyllene'],
      floweringDays: 65,
      yieldEstimate: '500-600g/m²',
      notes: 'Sweet berry aroma with balanced effects',
      parents: { mother: 'Blueberry', father: 'Haze' }
    }
  ]);

  const [batches, setBatches] = useState<Batch[]>([
    {
      id: '1',
      labId: '1',
      geneticsId: '1',
      phenotype: 'A1',
      code: 'OGK-001',
      sowingDate: '2024-01-15',
      state: 'vegetative',
      notes: 'Strong vegetative growth',
      plantCount: 12
    },
    {
      id: '2',
      labId: '2',
      geneticsId: '2',
      phenotype: 'B2',
      code: 'BD-002',
      sowingDate: '2023-12-20',
      state: 'flowering',
      notes: 'Day 35 of flowering',
      plantCount: 8
    }
  ]);

  const [measurements, setMeasurements] = useState<Measurement[]>([
    {
      id: '1',
      batchId: '1',
      type: 'temperature',
      value: 24.5,
      unit: '°C',
      takenAt: '2024-01-20T10:00:00Z',
      source: 'iot'
    },
    {
      id: '2',
      batchId: '1',
      type: 'humidity',
      value: 65,
      unit: '%',
      takenAt: '2024-01-20T10:00:00Z',
      source: 'iot'
    }
  ]);

  const addLab = (lab: Omit<Lab, 'id'>) => {
    const newLab = { ...lab, id: Date.now().toString() };
    setLabs(prev => [...prev, newLab]);
  };

  const addGenetics = (genetics: Omit<Genetics, 'id'>) => {
    const newGenetics = { ...genetics, id: Date.now().toString() };
    setGenetics(prev => [...prev, newGenetics]);
  };

  const addBatch = (batch: Omit<Batch, 'id'>) => {
    const newBatch = { ...batch, id: Date.now().toString() };
    setBatches(prev => [...prev, newBatch]);
  };

  const addMeasurement = (measurement: Omit<Measurement, 'id'>) => {
    const newMeasurement = { ...measurement, id: Date.now().toString() };
    setMeasurements(prev => [...prev, newMeasurement]);
  };

  return (
    <DataContext.Provider value={{
      labs,
      genetics,
      batches,
      measurements,
      addLab,
      addGenetics,
      addBatch,
      addMeasurement
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}