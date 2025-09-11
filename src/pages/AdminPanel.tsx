import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Shield } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const { t } = useTranslation(['admin', 'common']);

  console.log('AdminPanel: user =', user);
  console.log('AdminPanel: user?.role =', user?.role);

  // Проверка прав доступа
  if (!user) {
    console.log('AdminPanel: No user, redirecting to /');
    return <Navigate to="/" replace />;
  }
  
  if (user.role !== 'Administrator') {
    console.log('AdminPanel: User is not Administrator, role =', user.role);
    return <Navigate to="/" replace />;
  }

  console.log('AdminPanel: Access granted for Administrator');


  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container max-w-screen-2xl py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">Панель администратора (TEST)</h1>
          </div>
          <p className="text-muted-foreground">Тестовая версия - если видите это, значит компонент загружается правильно</p>
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Отладочная информация:</h3>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>
      </div>
    </div>
  );
}
