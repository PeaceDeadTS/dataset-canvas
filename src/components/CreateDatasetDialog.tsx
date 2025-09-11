import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { useTranslation } from 'react-i18next';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

const API_URL = '/datasets'; // Убираем префикс /api

interface CreateDatasetDialogProps {
  onDatasetCreated: (newDataset: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDatasetDialog({ onDatasetCreated, open: externalOpen, onOpenChange }: CreateDatasetDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Используем внешнее состояние, если оно предоставлено, иначе внутреннее
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        API_URL,
        { name, description, isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('common:dataset_create_success'));
      onDatasetCreated(response.data);
      setOpen(false);
      // Reset form
      setName('');
      setDescription('');
      setIsPublic(true);
    } catch (error: any) {
      toast.error(error.response?.data || t('common:dataset_create_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('pages:create_dataset.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pages:create_dataset.title')}</DialogTitle>
          <DialogDescription>
            {t('pages:create_dataset.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('common:name')}
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t('common:description')}
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-public" className="text-right">
                {t('common:public')}
              </Label>
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? t('pages:create_dataset.creating') : t('pages:create_dataset.title')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
