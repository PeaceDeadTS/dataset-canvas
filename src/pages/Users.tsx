import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  createdAt: string;
  publicDatasetCount: number;
}

type SortField = 'username' | 'createdAt' | 'publicDatasetCount';
type SortOrder = 'ASC' | 'DESC';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('username');
  const [order, setOrder] = useState<SortOrder>('ASC');

  useEffect(() => {
    fetchUsers();
  }, [sortBy, order]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users', {
        params: { sortBy, order },
        headers: currentUser ? {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        } : {}
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DEVELOPER': return 'default';
      case 'USER': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Пользователи</h1>
              <p className="text-gray-600 mt-2">Список всех пользователей в системе</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Сортировать по:</label>
                <Select value={sortBy} onValueChange={(value: SortField) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="username">Имени</SelectItem>
                    <SelectItem value="createdAt">Дате регистрации</SelectItem>
                    <SelectItem value="publicDatasetCount">Количеству датасетов</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Порядок:</label>
                <Select value={order} onValueChange={(value: SortOrder) => setOrder(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASC">По возрастанию</SelectItem>
                    <SelectItem value="DESC">По убыванию</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Separator />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={`https://avatar.vercel.sh/${user.username}.png`} 
                          alt={user.username} 
                        />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          <Link 
                            to={`/users/${user.username}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {user.username}
                          </Link>
                        </CardTitle>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {user.email && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {user.email}
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Регистрация:</span> {formatDate(user.createdAt)}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Публичных датасетов:</span> 
                      <Badge variant="outline" className="ml-2">
                        {user.publicDatasetCount}
                      </Badge>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        <Link to={`/users/${user.username}`}>
                          Посмотреть профиль
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
