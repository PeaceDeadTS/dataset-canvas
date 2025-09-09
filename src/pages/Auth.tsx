import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const API_URL = '/api/auth'; // Используем относительный путь

export function AuthPage() {
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
      // TODO: Redirect user or update UI
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
    } catch (error: any) {
      toast.error(error.response?.data || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Tabs defaultValue="login" className="w-[400px]">
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
                    <Input id="login-email" type="email" placeholder="m@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required disabled={loading} />
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
                    <Input id="register-username" placeholder="Your username" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="m@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required disabled={loading} />
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
