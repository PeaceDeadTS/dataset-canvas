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
    <div className="h-full overflow-y-auto">
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
                  <p className="text-sm text-muted-foreground">{t('common:community.discussions')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">{t('common:community.contributors')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Heart className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">{t('common:community.likes')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discussions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('common:community.discussionsTitle')}
              </CardTitle>
              <CardDescription>
                {t('common:community.discussionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t('common:community.noDiscussionsYet')}</h3>
                <p className="text-sm max-w-md mx-auto">
                  {t('common:community.noDiscussionsDescription')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common:community.guidelinesTitle')}</CardTitle>
              <CardDescription>
                {t('common:community.guidelinesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• {t('common:community.guidelineRespectful')}</li>
                <li>• {t('common:community.guidelineOnTopic')}</li>
                <li>• {t('common:community.guidelineHelpful')}</li>
                <li>• {t('common:community.guidelineReport')}</li>
                <li>• {t('common:community.guidelineTerms')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
