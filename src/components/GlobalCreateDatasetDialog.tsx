import { useAuth } from '@/contexts/AuthContext';
import { useCreateDataset } from '@/contexts/CreateDatasetContext';
import { CreateDatasetDialog } from './CreateDatasetDialog';

export function GlobalCreateDatasetDialog() {
  const { user } = useAuth();
  const { isOpen, closeDialog, onDatasetCreated } = useCreateDataset();
  
  // Показываем диалог только для авторизованных пользователей
  if (!user) {
    return null;
  }

  return (
    <CreateDatasetDialog
      open={isOpen}
      onOpenChange={closeDialog}
      onDatasetCreated={onDatasetCreated}
    />
  );
}
