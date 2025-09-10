import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Dataset } from "@/types";
import { Badge } from "./ui/badge";
import { Settings, Trash2 } from "lucide-react";
import axios from 'axios';
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

interface DatasetHeaderProps {
  dataset?: Dataset;
}

export function DatasetHeader({ dataset }: DatasetHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(0);
  };

  // Проверяем права на управление датасетом
  const canManageDataset = dataset && user && (
    user.role === 'Administrator' || 
    (dataset.user && user.id === dataset.user.id)
  );

  const handleDeleteDataset = async () => {
    if (!dataset) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/datasets/${dataset.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Датасет успешно удален');
      navigate('/'); // Перенаправляем на главную страницу
    } catch (error: any) {
      toast.error(error.response?.data || 'Ошибка при удалении датасета');
      console.error(error);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {dataset ? (
                <>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-semibold text-foreground">
                        <Link
                          to="/"
                          className="text-muted-foreground hover:underline"
                        >
                          Datasets
                        </Link>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-primary hover:underline">
                          {dataset.user?.username || 'Unknown'}
                        </span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-foreground">{dataset.name}</span>
                      </h1>
                      {!dataset.isPublic && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </div>
                  </div>
                  
                  {canManageDataset && (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Датасет "{dataset.name}" и все связанные с ним изображения будут удалены навсегда.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteDataset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </>
            ) : (
              <h1 className="text-2xl font-semibold text-foreground">
                Dataset Canvas
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
                <Button onClick={() => navigate('/auth')}>Register</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}