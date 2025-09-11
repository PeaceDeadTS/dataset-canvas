import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const API_URL = '/api/auth'; // Используем относительный путь

export function AuthPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem('token', response.data.token);
      toast.success('Logged in successfully!');
      window.location.href = '/'; // Redirect user and refresh app state
    } catch (error: any) {
      toast.error(error.response?.data || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, {
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
      });
      toast.success('Registered successfully! Please login.');
      // Reset form and switch to login tab
      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
      setActiveTab('login');
    } catch (error: any) {
      toast.error(error.response?.data || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="absolute left-8 top-8">
        <Button asChild variant="outline">
          <Link to="/">&larr; Back to Home</Link>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder={t('common:email_placeholder')} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required disabled={loading} />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="register-username">Username</Label>
                    <Input id="register-username" placeholder={t('common:username_placeholder')} value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder={t('common:email_placeholder')} value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required disabled={loading} />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
