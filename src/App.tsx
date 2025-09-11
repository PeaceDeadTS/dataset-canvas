import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Инициализация i18n
import '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';

// Lazy загрузка страниц
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/Auth").then(module => ({ default: module.AuthPage })));
const DatasetPage = lazy(() => import("./pages/Dataset"));
const UserPage = lazy(() => import("./pages/User"));
const UsersPage = lazy(() => import("./pages/Users"));
const AllDatasetsPage = lazy(() => import("./pages/AllDatasets"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanel"));

// Компонент загрузки
const PageLoader = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-lg">{t('common:loading_page')}</p>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/datasets" element={<AllDatasetsPage />} />
              <Route path="/datasets/:id" element={<DatasetPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:username" element={<UserPage />} />
              <Route path="/admin" element={<AdminPanelPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
