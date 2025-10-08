import React from 'react';
import { Contributor } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Users, MessageSquare, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContributorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributors: Contributor[];
  isLoading: boolean;
}

export const ContributorsDialog: React.FC<ContributorsDialogProps> = ({
  open,
  onOpenChange,
  contributors,
  isLoading,
}) => {
  const { t } = useTranslation(['common']);

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('common:community.contributorsTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('common:community.contributorsDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              {t('common:loading')}
            </div>
          ) : contributors.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('common:community.noContributors')}
            </div>
          ) : (
            contributors.map((contributor, index) => (
              <div
                key={contributor.user.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-bold">
                        {getInitials(contributor.user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <Link
                      to={`/users/${contributor.user.username}?tab=edits`}
                      className="font-medium hover:underline"
                    >
                      {contributor.user.username}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {contributor.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2" title={t('common:community.discussionsCreated')}>
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <div className="text-center">
                      <div className="font-bold text-lg">{contributor.discussionsCreated}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('common:community.threadsShort')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" title={t('common:community.postsCount')}>
                    <MessagesSquare className="h-4 w-4 text-green-500" />
                    <div className="text-center">
                      <div className="font-bold text-lg">{contributor.postsCount}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('common:community.postsShort')}
                      </div>
                    </div>
                  </div>

                  <div className="text-center border-l pl-6">
                    <div className="font-bold text-xl text-primary">
                      {contributor.totalActivity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('common:community.totalActivity')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

