import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import axios from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserCog, Shield, Database, Key, Plus, X } from "lucide-react";
import { Permission } from "@/types";

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: 'Administrator' | 'Developer' | 'User';
  createdAt: string;
  publicDatasetCount: number;
  permissions?: string[];
}

interface AdminDataset {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  imageCount: number;
  user: {
    username: string;
  };
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [datasets, setDatasets] = useState<AdminDataset[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  // Permissions management state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUserForPermission, setSelectedUserForPermission] = useState<AdminUser | null>(null);

  // Проверка прав доступа
  if (!user || user.role !== 'Administrator') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadUsers();
    loadDatasets();
    loadPermissions();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await axios.get('/users?sortBy=username&order=ASC');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: t('admin:error_loading_users'),
        variant: "destructive"
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const loadDatasets = async () => {
    try {
      setDatasetsLoading(true);
      const response = await axios.get('/datasets?sortBy=createdAt&order=DESC');
      setDatasets(response.data);
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: t('admin:error_loading_datasets'),
        variant: "destructive"
      });
    } finally {
      setDatasetsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await axios.get('/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Ошибка при загрузке прав',
        variant: "destructive"
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      const response = await axios.get(`/permissions/user/${userId}`);
      return response.data.permissions || [];
    } catch (error) {
      console.error('Error loading user permissions:', error);
      return [];
    }
  };

  const handleGrantPermission = async (userId: string, permissionName: string) => {
    try {
      await axios.post('/permissions/grant', { userId, permissionName });
      
      // Обновляем права пользователя
      const updatedPermissions = await loadUserPermissions(userId);
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, permissions: updatedPermissions }
          : u
      ));
      
      toast({
        title: 'Право успешно выдано',
      });
    } catch (error: any) {
      console.error('Error granting permission:', error);
      toast({
        title: error.response?.data?.message || 'Ошибка при выдаче права',
        variant: "destructive"
      });
    }
  };

  const handleRevokePermission = async (userId: string, permissionName: string) => {
    try {
      await axios.post('/permissions/revoke', { userId, permissionName });
      
      // Обновляем права пользователя
      const updatedPermissions = await loadUserPermissions(userId);
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, permissions: updatedPermissions }
          : u
      ));
      
      toast({
        title: 'Право успешно отозвано',
      });
    } catch (error: any) {
      console.error('Error revoking permission:', error);
      toast({
        title: error.response?.data?.message || 'Ошибка при отзыве права',
        variant: "destructive"
      });
    }
  };

  const openPermissionDialog = async (userToManage: AdminUser) => {
    if (userToManage.id === user.id) {
      toast({
        title: t('admin:cannot_modify_self'),
        variant: "destructive"
      });
      return;
    }
    
    // Загружаем права пользователя
    const userPermissions = await loadUserPermissions(userToManage.id);
    setSelectedUserForPermission({ ...userToManage, permissions: userPermissions });
    setPermissionDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await axios.put(`/users/${selectedUser.id}/role`, { role: newRole });
      
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: newRole as AdminUser['role'] }
          : u
      ));
      
      toast({
        title: t('admin:success_role_changed'),
      });
      
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: t('admin:error_changing_role'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userToDelete: AdminUser) => {
    if (userToDelete.id === user.id) {
      toast({
        title: t('admin:cannot_modify_self'),
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.delete(`/users/${userToDelete.id}`);
      
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      toast({
        title: t('admin:success_user_deleted'),
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t('admin:error_deleting_user'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteDataset = async (datasetToDelete: AdminDataset) => {
    try {
      await axios.delete(`/datasets/${datasetToDelete.id}/admin`);
      
      setDatasets(datasets.filter(d => d.id !== datasetToDelete.id));
      
      toast({
        title: t('admin:success_dataset_deleted'),
      });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: t('admin:error_deleting_dataset'),
        variant: "destructive"
      });
    }
  };

  const openRoleDialog = (userToEdit: AdminUser) => {
    if (userToEdit.id === user.id) {
      toast({
        title: t('admin:cannot_modify_self'),
        variant: "destructive"
      });
      return;
    }
    
    setSelectedUser(userToEdit);
    setNewRole(userToEdit.role);
    setRoleDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container max-w-screen-2xl py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">{t('admin:title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('admin:subtitle')}</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              {t('admin:user_management_tab')}
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('admin:dataset_management_tab')}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Управление правами
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:user_management')}</CardTitle>
                <CardDescription>
                  {t('admin:user_management')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('admin:no_users_found')}</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('admin:users_table_username')}</TableHead>
                          <TableHead>{t('admin:users_table_email')}</TableHead>
                          <TableHead>{t('admin:users_table_role')}</TableHead>
                          <TableHead>{t('admin:users_table_created')}</TableHead>
                          <TableHead>{t('admin:users_table_datasets')}</TableHead>
                          <TableHead>{t('admin:users_table_actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.email || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                u.role === 'Administrator' ? 'destructive' : 
                                u.role === 'Developer' ? 'default' : 'secondary'
                              }>
                                {t(`admin:role_${u.role.toLowerCase()}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{u.publicDatasetCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRoleDialog(u)}
                                  disabled={u.id === user.id}
                                >
                                  <UserCog className="h-4 w-4 mr-1" />
                                  {t('admin:change_role')}
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={u.id === user.id}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      {t('admin:delete_user')}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t('admin:confirm_delete_user')} "{u.username}"?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('admin:confirm_delete_user_warning')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('admin:cancel')}</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteUser(u)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {t('admin:delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:dataset_management')}</CardTitle>
                <CardDescription>
                  {t('admin:dataset_management')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datasetsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : datasets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('admin:no_datasets_found')}</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('admin:datasets_table_name')}</TableHead>
                          <TableHead>{t('admin:datasets_table_owner')}</TableHead>
                          <TableHead>{t('admin:datasets_table_visibility')}</TableHead>
                          <TableHead>{t('admin:datasets_table_created')}</TableHead>
                          <TableHead>{t('admin:datasets_table_images')}</TableHead>
                          <TableHead>{t('admin:datasets_table_actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasets.map((dataset) => (
                          <TableRow key={dataset.id}>
                            <TableCell className="font-medium">{dataset.name}</TableCell>
                            <TableCell>{dataset.user.username}</TableCell>
                            <TableCell>
                              <Badge variant={dataset.isPublic ? 'default' : 'secondary'}>
                                {dataset.isPublic ? t('admin:public') : t('admin:private')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(dataset.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{dataset.imageCount || 0}</TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {t('admin:delete_dataset')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('admin:confirm_delete_dataset')} "{dataset.name}"?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('admin:confirm_delete_dataset_warning')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('admin:cancel')}</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteDataset(dataset)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {t('admin:delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление правами доступа</CardTitle>
                <CardDescription>
                  Выдача и отзыв специальных прав для пользователей
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Пользователи не найдены</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Роль</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{u.username}</div>
                                <div className="text-sm text-muted-foreground">{u.email || '-'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                u.role === 'Administrator' ? 'destructive' : 
                                u.role === 'Developer' ? 'default' : 'secondary'
                              }>
                                {t(`admin:role_${u.role.toLowerCase()}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPermissionDialog(u)}
                                disabled={u.id === user.id}
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Управление правами
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Change Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:change_role_title')}</DialogTitle>
              <DialogDescription>
                {t('admin:change_role_description')} "{selectedUser?.username}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:select_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">{t('admin:role_administrator')}</SelectItem>
                  <SelectItem value="Developer">{t('admin:role_developer')}</SelectItem>
                  <SelectItem value="User">{t('admin:role_user')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                {t('admin:cancel')}
              </Button>
              <Button 
                onClick={handleRoleChange}
                disabled={!newRole || newRole === selectedUser?.role}
              >
                {t('admin:save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permission Management Dialog */}
        <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Управление правами пользователя</DialogTitle>
              <DialogDescription>
                Пользователь: {selectedUserForPermission?.username}
                {selectedUserForPermission?.role === 'Administrator' && (
                  <span className="block mt-2 text-sm text-amber-600">
                    ⚠️ Администраторы имеют все права автоматически
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {permissionsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {permissions.map((permission) => {
                    const hasPermission = selectedUserForPermission?.permissions?.includes(permission.name) || 
                                        selectedUserForPermission?.role === 'Administrator';
                    const isAdmin = selectedUserForPermission?.role === 'Administrator';
                    
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{permission.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description || 'Нет описания'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Код: {permission.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPermission ? (
                            <>
                              <Badge variant="default">Выдано</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokePermission(selectedUserForPermission!.id, permission.name)}
                                disabled={isAdmin}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Отозвать
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGrantPermission(selectedUserForPermission!.id, permission.name)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Выдать
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPermissionDialogOpen(false)}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}