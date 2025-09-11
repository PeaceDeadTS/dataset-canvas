import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { AppHeader } from "@/components/AppHeader";
import { DatasetListItem } from "@/components/DatasetListItem";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Dataset } from "@/types";
import { Badge } from '@/components/ui/badge';
import { Calendar, User as UserIcon, Mail } from 'lucide-react';

const API_URL = '/users';

interface UserProfile {
  username: string;
  email?: string;
  role: string;
  createdAt: string;
}

interface UserPageData {
  user: UserProfile;
  datasets: Dataset[];
}

const UserPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        setError('Username not provided');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/${username}`, { headers });
        setData(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to fetch user data');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isOwnProfile = currentUser?.username === data.user.username;
  const publicDatasets = data.datasets.filter(d => d.isPublic);
  const privateDatasets = data.datasets.filter(d => !d.isPublic);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* User Profile Header */}
        <section className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{data.user.username}</h1>
                <Badge variant={data.user.role === 'Administrator' ? 'default' : 
                                data.user.role === 'Developer' ? 'secondary' : 'outline'}>
                  {data.user.role}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                {data.user.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{data.user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {new Date(data.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Datasets Sections */}
        {isOwnProfile && privateDatasets.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Private Datasets</h2>
              <Badge variant="secondary">{privateDatasets.length} datasets</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateDatasets.map(dataset => (
                <DatasetListItem key={dataset.id} dataset={dataset} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isOwnProfile ? 'My Public Datasets' : `${data.user.username}'s Public Datasets`}
            </h2>
            <Badge variant="outline">{publicDatasets.length} datasets</Badge>
          </div>
          
          {publicDatasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicDatasets.map(dataset => (
                <DatasetListItem key={dataset.id} dataset={dataset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {isOwnProfile ? 'You haven\'t created any public datasets yet.' : 
                 `${data.user.username} hasn't created any public datasets yet.`}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserPage;
