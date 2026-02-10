import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useTenant } from './TenantContext';

interface Lab {
  id: string;
  name: string;
  type: string;
  area?: number;
  m2?: number;
  cycle: string;
}

interface Genetics {
  id: string;
  name: string;
  breeder: string;
  origin: string;
  indicaPct?: number;
  sativaPct?: number;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  terpenes?: string | string[];
  floweringDays?: number;
  yieldEstimate?: string;
  notes?: string;
  parents?: { mother?: string; father?: string };
}

interface Batch {
  id: string;
  labId: string;
  geneticsId: string;
  phenotype?: string;
  code: string;
  sowingDate: string;
  state: 'vegetative' | 'flowering' | 'harvested';
  notes?: string;
  plantCount: number;
}

interface Measurement {
  id: string;
  batchId: string;
  type: 'temperature' | 'humidity' | 'ph' | 'ec' | 'ppfd';
  value: number;
  unit: string;
  takenAt?: string;
  createdAt?: string;
  source: 'manual' | 'iot';
}

interface DataContextType {
  labs: Lab[];
  genetics: Genetics[];
  batches: Batch[];
  measurements: Measurement[];
  isLoading: boolean;
  addLab: (lab: Omit<Lab, 'id'>) => Promise<void>;
  updateLab: (id: string, data: Partial<Lab>) => Promise<void>;
  addGenetics: (genetics: Omit<Genetics, 'id'>) => Promise<void>;
  addBatch: (batch: Omit<Batch, 'id'>) => Promise<void>;
  addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { selectedTenant } = useTenant();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentTenantId = () => selectedTenant?.id || localStorage.getItem('selectedTenantId');

  // Load initial data on mount and when tenant changes
  useEffect(() => {
    const tenantId = currentTenantId();
    if (tenantId) {
      console.log('🔄 DataContext: Cargando datos para el workspace:', tenantId);
      refreshData();
    } else {
      console.log('⚠️ DataContext: Sin workspace activo, limpiando datos');
      setLabs([]);
      setGenetics([]);
      setBatches([]);
      setMeasurements([]);
      setIsLoading(false);
    }
  }, [selectedTenant]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      
      console.log('📡 DataContext: Iniciando carga de datos...');
      
      // Fetch all data in parallel
      const [labsData, geneticsData, batchesData, measurementsData] = await Promise.all([
        api.labs.getAll().catch((err) => { 
          console.error('❌ Error cargando labs:', err); 
          return { labs: [] }; 
        }),
        api.genetics.getAll().catch((err) => { 
          console.error('❌ Error cargando genetics:', err); 
          return []; 
        }),
        api.batches.getAll().catch((err) => { 
          console.error('❌ Error cargando batches:', err); 
          return []; 
        }),
        api.monitoring.getMeasurements().catch((err) => { 
          console.error('❌ Error cargando measurements:', err); 
          return []; 
        })
      ]);

      const labs = labsData?.labs || labsData || [];
      console.log('✅ DataContext: Labs cargados:', labs.length);
      
      setLabs(labs);
      setGenetics(geneticsData || []);
      setBatches(batchesData || []);
      setMeasurements(measurementsData || []);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ DataContext: Error loading data:', error);
      setIsLoading(false);
    }
  };

  const addLab = async (lab: Omit<Lab, 'id'>) => {
    try {
      const newLab = await api.labs.create({
        name: lab.name,
        type: lab.type,
        area: lab.m2 || lab.area || 0,
        cycle: lab.cycle
      });
      setLabs(prev => [...prev, newLab]);
    } catch (error) {
      console.error('Error adding lab:', error);
      throw error;
    }
  };

  const updateLab = async (id: string, data: Partial<Lab>) => {
    try {
      const updatedLab = await api.labs.update(id, data);
      setLabs(prev => prev.map(lab => lab.id === id ? { ...lab, ...updatedLab } : lab));
    } catch (error) {
      console.error('Error updating lab:', error);
      throw error;
    }
  };

  const addGenetics = async (genetics: Omit<Genetics, 'id'>) => {
    try {
      const newGenetics = await api.genetics.create({
        name: genetics.name,
        breeder: genetics.breeder,
        origin: genetics.origin,
        type: 'hybrid',
        thcMin: genetics.thcMin,
        thcMax: genetics.thcMax,
        cbdMin: genetics.cbdMin,
        cbdMax: genetics.cbdMax,
        terpenes: Array.isArray(genetics.terpenes) 
          ? genetics.terpenes.join(',')
          : genetics.terpenes || ''
      });
      setGenetics(prev => [...prev, newGenetics]);
    } catch (error) {
      console.error('Error adding genetics:', error);
      throw error;
    }
  };

  const addBatch = async (batch: Omit<Batch, 'id'>) => {
    try {
      const newBatch = await api.batches.create({
        code: batch.code,
        labId: batch.labId,
        geneticsId: batch.geneticsId,
        state: batch.state,
        plantCount: batch.plantCount,
        sowingDate: batch.sowingDate,
        phenotype: batch.phenotype,
        notes: batch.notes
      });
      setBatches(prev => [...prev, newBatch]);
    } catch (error) {
      console.error('Error adding batch:', error);
      throw error;
    }
  };

  const addMeasurement = async (measurement: Omit<Measurement, 'id'>) => {
    try {
      const newMeasurement = await api.monitoring.createMeasurement({
        batchId: measurement.batchId,
        type: measurement.type,
        value: measurement.value,
        unit: measurement.unit,
        source: measurement.source
      });
      setMeasurements(prev => [...prev, newMeasurement]);
    } catch (error) {
      console.error('Error adding measurement:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      labs,
      genetics,
      batches,
      measurements,
      isLoading,
      addLab,
      updateLab,
      addGenetics,
      addBatch,
      addMeasurement,
      refreshData
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