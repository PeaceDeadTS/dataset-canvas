import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Администраторы имеют все права
      if (user.role === 'Administrator') {
        setPermissions(['edit_caption']); // В будущем можно добавить все возможные права
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/permissions/user/${user.userId}`);
        setPermissions(response.data.permissions || []);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (permissionName: string) => {
    return permissions.includes(permissionName);
  };

  return {
    permissions,
    loading,
    hasPermission,
  };
};

