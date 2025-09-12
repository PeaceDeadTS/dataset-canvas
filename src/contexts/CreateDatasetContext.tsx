import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dataset } from '@/types';

interface CreateDatasetContextType {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  onDatasetCreated: (dataset: Dataset) => void;
}

const CreateDatasetContext = createContext<CreateDatasetContextType | undefined>(undefined);

interface CreateDatasetProviderProps {
  children: ReactNode;
}

export function CreateDatasetProvider({ children }: CreateDatasetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  const onDatasetCreated = (dataset: Dataset) => {
    // После успешного создания датасета переходим на его страницу
    navigate(`/datasets/${dataset.id}`);
    closeDialog();
  };

  const value = {
    isOpen,
    openDialog,
    closeDialog,
    onDatasetCreated
  };

  return (
    <CreateDatasetContext.Provider value={value}>
      {children}
    </CreateDatasetContext.Provider>
  );
}

export function useCreateDataset() {
  const context = useContext(CreateDatasetContext);
  if (context === undefined) {
    throw new Error('useCreateDataset must be used within a CreateDatasetProvider');
  }
  return context;
}
