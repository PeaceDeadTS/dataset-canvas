import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Database, Users, Home, BarChart3, Settings } from "lucide-react";
import { LanguageSelector } from './LanguageSelector';

const ListItem = ({ className, title, href, children, ...props }: {
  className?: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['navigation', 'common']);

  const handleLogout = () => {
    logout();
    navigate(0);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="mr-4 flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg sm:inline-block">
              {t('navigation:brand')}
            </span>
          </Link>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t('navigation:main')}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          to="/"
                        >
                          <Database className="h-6 w-6 text-blue-600" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            {t('navigation:brand')}
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            {t('navigation:brand_description')}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/" title={t('navigation:main_page')}>
                      {t('navigation:main_description')}
                    </ListItem>
                    <ListItem href="/datasets" title={t('navigation:datasets_all')}>
                      {t('navigation:datasets_all_description')}
                    </ListItem>
                    <ListItem href="/users" title={t('navigation:users_all')}>
                      {t('navigation:users_all_description')}
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {t('navigation:datasets')}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem
                      title={t('navigation:datasets_all')}
                      href="/datasets"
                    >
                      {t('navigation:datasets_all_description')}
                    </ListItem>
                    <ListItem
                      title={t('navigation:datasets_public')}
                      href="/datasets?tab=public"
                    >
                      {t('navigation:datasets_public_description')}
                    </ListItem>
                    {user && (
                      <ListItem
                        title={t('navigation:datasets_my')}
                        href="/datasets?tab=private"
                      >
                        {t('navigation:datasets_my_description')}
                      </ListItem>
                    )}
                    <ListItem
                      title={t('navigation:datasets_create')}
                      href="/?action=create"
                    >
                      {t('navigation:datasets_create_description')}
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('navigation:community')}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem
                      title={t('navigation:users_all')}
                      href="/users"
                    >
                      {t('navigation:users_all_description')}
                    </ListItem>
                    <ListItem
                      title={t('navigation:users_developers')}
                      href="/users?role=DEVELOPER"
                    >
                      {t('navigation:users_developers_description')}
                    </ListItem>
                    <ListItem
                      title={t('navigation:users_regular')}
                      href="/users?role=USER"
                    >
                      {t('navigation:users_regular_description')}
                    </ListItem>
                    <ListItem
                      title={t('navigation:users_admins')}
                      href="/users?role=ADMIN"
                    >
                      {t('navigation:users_admins_description')}
                    </ListItem>
                    {user && (
                      <ListItem
                        title={t('navigation:users_my_profile')}
                        href={`/users/${user.username}`}
                      >
                        {t('navigation:users_my_profile_description')}
                      </ListItem>
                    )}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  to="/datasets"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "flex items-center gap-2",
                    location.pathname === "/datasets" && "bg-accent text-accent-foreground"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('navigation:overview')}
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSelector />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t('navigation:navigation')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem asChild>
                        <Link to={`/users/${user.username}`} className="flex items-center gap-2 cursor-pointer">
                          <Users className="h-4 w-4" />
                          {t('navigation:users_my_profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/datasets" className="flex items-center gap-2 cursor-pointer">
                          <Database className="h-4 w-4" />
                          {t('navigation:datasets')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/users" className="flex items-center gap-2 cursor-pointer">
                          <Users className="h-4 w-4" />
                          {t('navigation:users_all')}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  {t('common:logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')}>{t('common:login')}</Button>
              <Button onClick={() => navigate('/auth')}>{t('common:register')}</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
