import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dataset, Discussion, Like, Contributor } from '@/types';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Users } from 'lucide-react';
import { DiscussionList } from './DiscussionList';
import { CreateDiscussionDialog } from './CreateDiscussionDialog';
import { DiscussionThread } from './DiscussionThread';
import { LikesDisplay } from './LikesDisplay';
import { ContributorsDialog } from './ContributorsDialog';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface CommunityTabProps {
  dataset: Dataset;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  dataset,
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | null>(null);
  
  // Likes state
  const [likes, setLikes] = useState<Like[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikesLoading, setIsLikesLoading] = useState(false);
  
  // Contributors state
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [showContributorsDialog, setShowContributorsDialog] = useState(false);
  const [isContributorsLoading, setIsContributorsLoading] = useState(false);

  useEffect(() => {
    fetchDiscussions();
    fetchLikes();
    
    // Check for discussion parameter in URL
    const discussionParam = searchParams.get('discussion');
    if (discussionParam) {
      const discussionId = parseInt(discussionParam, 10);
      if (!isNaN(discussionId)) {
        setSelectedDiscussionId(discussionId);
      }
    }
  }, [dataset.id, searchParams]);

  const fetchDiscussions = async () => {
    try {
      const response = await axios.get(`/datasets/${dataset.id}/discussions`);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await axios.get(`/datasets/${dataset.id}/likes`);
      const likesData = response.data as Like[];
      setLikes(likesData);
      
      // Check if current user has liked
      if (user) {
        const userLike = likesData.find(like => like.user.id === user.userId);
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Failed to fetch likes:', error);
    }
  };

  const fetchContributors = async () => {
    setIsContributorsLoading(true);
    try {
      const response = await axios.get(`/datasets/${dataset.id}/contributors`);
      setContributors(response.data);
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
      toast({
        title: t('common:community.contributorsFetchError'),
        variant: 'destructive'
      });
    } finally {
      setIsContributorsLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!user) return;
    
    setIsLikesLoading(true);
    try {
      if (isLiked) {
        await axios.delete(`/datasets/${dataset.id}/likes`);
        toast({ title: t('common:likes.unlikeSuccess') });
      } else {
        await axios.post(`/datasets/${dataset.id}/likes`);
        toast({ title: t('common:likes.likeSuccess') });
      }
      
      // Refresh likes
      await fetchLikes();
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast({
        title: t('common:likes.toggleError'),
        variant: 'destructive'
      });
    } finally {
      setIsLikesLoading(false);
    }
  };

  const handleOpenContributors = () => {
    setShowContributorsDialog(true);
    fetchContributors();
  };

  const handleCreateDiscussion = async (title: string, content: string) => {
    try {
      await axios.post(`/datasets/${dataset.id}/discussions`, { title, content });
      toast({ title: t('common:discussions.discussionCreateSuccess') });
      await fetchDiscussions();
    } catch (error) {
      console.error('Failed to create discussion:', error);
      toast({ 
        title: t('common:discussions.discussionCreateFailed'), 
        variant: 'destructive' 
      });
    }
  };

  const handleSelectDiscussion = (discussionId: number) => {
    setSelectedDiscussionId(discussionId);
    // Update URL with discussion parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set('discussion', discussionId.toString());
    setSearchParams(newParams, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedDiscussionId(null);
    // Remove discussion parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('discussion');
    setSearchParams(newParams, { replace: true });
    fetchDiscussions(); // Refresh the list
  };

  const canCreateDiscussion = !!user; // Simplified permission check

  // If a discussion is selected, show the thread view
  if (selectedDiscussionId) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          <DiscussionThread
            discussionId={selectedDiscussionId}
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

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
                  <div className="text-2xl font-bold">{discussions.length}</div>
                  <p className="text-sm text-muted-foreground">{t('common:community.discussions')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={handleOpenContributors}
            >
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <div className="text-2xl font-bold">{contributors.length || '?'}</div>
                  <p className="text-sm text-muted-foreground">{t('common:community.contributors')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <LikesDisplay
                  likes={likes}
                  isLiked={isLiked}
                  isLoading={isLikesLoading}
                  onToggleLike={handleToggleLike}
                  canLike={!!user}
                />
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
              {isLoading ? (
                <div className="text-center py-12">{t('common:loading')}</div>
              ) : (
                <DiscussionList
                  discussions={discussions}
                  onSelectDiscussion={handleSelectDiscussion}
                  onCreateDiscussion={() => setShowCreateDialog(true)}
                  canCreate={canCreateDiscussion}
                />
              )}
            </CardContent>
          </Card>

          <CreateDiscussionDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreateDiscussion={handleCreateDiscussion}
          />

          <ContributorsDialog
            open={showContributorsDialog}
            onOpenChange={setShowContributorsDialog}
            contributors={contributors}
            isLoading={isContributorsLoading}
          />

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
