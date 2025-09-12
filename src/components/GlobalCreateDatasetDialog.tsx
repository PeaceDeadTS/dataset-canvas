import { useAuth } from '@/contexts/AuthContext';
import { useCreateDataset } from '@/contexts/CreateDatasetContext';
import { CreateDatasetDialogContent } from './CreateDatasetDialogContent';

export function GlobalCreateDatasetDialog() {
  const { user } = useAuth();
  const { isOpen, closeDialog, onDatasetCreated } = useCreateDataset();
  
  // Показываем диалог только для авторизованных пользователей
  if (!user) {
    return null;
  }

  return (
    <CreateDatasetDialogContent
      open={isOpen}
      onOpenChange={closeDialog}
      onDatasetCreated={onDatasetCreated}
    />
  );
}
