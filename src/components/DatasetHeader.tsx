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

interface DatasetHeaderProps {
  dataset?: Dataset;
}

export function DatasetHeader({ dataset }: DatasetHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Инициализируем хук

  const handleLogout = () => {
    logout();
    navigate(0); // Перезагружаем страницу
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
                      to={`/`}
                      className="text-primary hover:underline"
                    >
                      {dataset.user.username}
                    </Link>
                    <span className="text-foreground"> / </span>
                    <span className="text-primary">{dataset.name}</span>
                  </h1>
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