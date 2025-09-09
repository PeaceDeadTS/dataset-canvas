import {
  Heart,
  UserPlus,
  Download,
  ExternalLink,
  LogIn,
  LogOut,
  Trash2, // Иконка удаления
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom"; // useNavigate для редиректа
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/alert-dialog"; // Компоненты для подтверждения
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dataset } from "@/types";
import { toast } from "sonner"; // Для уведомлений
import axios from "axios"; // Для отправки запроса

interface DatasetHeaderProps {
  dataset?: Dataset;
}

export function DatasetHeader({ dataset }: DatasetHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Инициализируем хук

  const isOwner = user && dataset && user.id === dataset.user.id;
  const isAdmin = user && user.role === 'Administrator';
  const canDelete = isOwner || isAdmin;

  const handleDelete = async () => {
    if (!dataset) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/datasets/${dataset.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Dataset "${dataset.name}" has been deleted.`);
      navigate('/'); // Редирект на главную страницу
    } catch (error) {
      toast.error('Failed to delete dataset.');
      console.error(error);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              {dataset ? (
                <>
                  <h1 className="text-2xl font-semibold text-foreground">
                    <span className="text-muted-foreground">Datasets:</span>{" "}
                    <Link
                      to={`/users/${dataset.user.username}`}
                      className="text-primary hover:underline"
                    >
                      {dataset.user.username}
                    </Link>
                    <span className="text-foreground"> / </span>
                    <span className="text-primary">{dataset.name}</span>
                  </h1>
                  <div className="mt-2 flex items-center space-x-2">
                    {dataset.modalities?.map((modality) => (
                      <Badge key={modality} variant="secondary" className="text-xs">
                        {modality}
                      </Badge>
                    ))}
                    {dataset.rowCount && (
                       <Badge variant="secondary" className="text-xs">
                        {dataset.rowCount.toLocaleString()} rows
                       </Badge>
                    )}
                  </div>
                </>
              ) : (
                <h1 className="text-2xl font-semibold text-foreground">
                  Public Datasets
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${user.email}.png`}
                        alt={user.email}
                      />
                      <AvatarFallback>
                        {user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </Button>
              </Link>
            )}
            
            {dataset && (
              <>
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Like
                  <Badge variant="secondary" className="ml-1">{dataset.likesCount ?? 0}</Badge>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Follow
                  <Badge variant="secondary" className="ml-1">{dataset.followersCount ?? 0}</Badge>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Dataset card
                </Button>

                {/* --- КНОПКА УДАЛЕНИЯ --- */}
                {canDelete && (
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the dataset
                          <strong> {dataset.name}</strong> and all its associated images.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}