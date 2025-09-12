import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dataset } from '@/types';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Users, Heart } from 'lucide-react';

interface CommunityTabProps {
  dataset: Dataset;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  dataset,
}) => {
  const { t } = useTranslation(['pages', 'common']);

  return (
    <div className="container mx-auto px-4 py-6" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        <div className="space-y-6">
          {/* Community Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('pages:dataset.community')}</h2>
            <p className="text-muted-foreground">
              {t('pages:dataset.community_description')}
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <MessageSquare className="h-8 w-8 text-blue-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Discussions</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Contributors</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Heart className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discussions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussions
              </CardTitle>
              <CardDescription>
                Share your thoughts and ask questions about this dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                <p className="text-sm max-w-md mx-auto">
                  Start a conversation about this dataset. Share your insights, ask questions, or discuss potential improvements.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
              <CardDescription>
                Help us maintain a respectful and constructive environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be respectful and constructive in all interactions</li>
                <li>• Stay on topic and relevant to the dataset</li>
                <li>• Provide helpful feedback and suggestions</li>
                <li>• Report any inappropriate content or behavior</li>
                <li>• Follow our terms of service and privacy policy</li>
              </ul>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};
