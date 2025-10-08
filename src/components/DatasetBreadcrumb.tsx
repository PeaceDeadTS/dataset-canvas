import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dataset } from "@/types";
import axios from '@/lib/axios';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface DatasetBreadcrumbProps {
  dataset: Dataset;
}

export function DatasetBreadcrumb({ dataset }: DatasetBreadcrumbProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['pages', 'common']);

  // Проверяем права на управление датасетом
  const canManageDataset = user && (
    user.role === 'ADMIN' || 
    (dataset.user && user.id === dataset.user.id)
  );

  const handleDeleteDataset = async () => {
    try {
      await axios.delete(`/datasets/${dataset.id}`);
      
      toast.success(t('pages:dataset.dataset_deleted'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data || t('pages:dataset.error_deleting'));
      console.error(error);
    }
  };

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {/* Breadcrumb navigation */}
            <Link
              to="/datasets"
              className="hover:text-foreground transition-colors"
            >
              {t('pages:dataset.breadcrumb_datasets')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              to={dataset.user?.username ? `/users/${dataset.user.username}` : '#'}
              className="hover:text-foreground transition-colors"
            >
              {dataset.user?.username || 'Unknown'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{dataset.name}</span>
            {!dataset.isPublic && (
              <Badge variant="secondary" className="ml-2">
                {t('common:private')}
              </Badge>
            )}
          </div>
          
          {canManageDataset && (
            <div className="flex items-center space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common:delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('pages:dataset.delete_confirmation')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('pages:dataset.delete_description')} "{dataset.name}" {t('pages:dataset.delete_description_end')}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteDataset} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('common:delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
