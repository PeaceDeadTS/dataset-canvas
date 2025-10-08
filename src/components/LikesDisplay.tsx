import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Like } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface LikesDisplayProps {
  likes: Like[];
  isLiked: boolean;
  isLoading: boolean;
  onToggleLike: () => void;
  canLike: boolean;
}

export const LikesDisplay: React.FC<LikesDisplayProps> = ({
  likes,
  isLiked,
  isLoading,
  onToggleLike,
  canLike,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLikeClick = () => {
    if (!canLike || isLoading) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    
    onToggleLike();
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const maxAvatarsToShow = 5;
  const hasMoreLikes = likes.length > maxAvatarsToShow;
  const displayedLikes = likes.slice(0, maxAvatarsToShow);
  const remainingCount = likes.length - maxAvatarsToShow;

  const dateLocale = i18n.language === 'ru' ? ru : enUS;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLikeClick}
          disabled={!canLike || isLoading}
          className={`
            relative transition-all duration-300 
            ${canLike ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            ${isAnimating ? 'animate-bounce' : ''}
          `}
          title={canLike ? (isLiked ? t('common:likes.unlike') : t('common:likes.like')) : t('common:likes.loginRequired')}
        >
          <Heart
            className={`
              h-6 w-6 transition-all duration-300
              ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}
              ${isAnimating && isLiked ? 'animate-ping absolute' : ''}
            `}
          />
          {isAnimating && isLiked && (
            <Heart className="h-6 w-6 fill-red-500 text-red-500 scale-110" />
          )}
        </button>

        {likes.length > 0 ? (
          <div
            onClick={() => setShowLikesDialog(true)}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex -space-x-2">
              {displayedLikes.map((like, index) => (
                <Avatar
                  key={like.id}
                  className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110"
                  style={{ zIndex: maxAvatarsToShow - index }}
                >
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {getInitials(like.user.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {hasMoreLikes && (
                <div
                  className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
                  style={{ zIndex: 0 }}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground ml-1">
              {likes.length}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        )}
      </div>

      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              {t('common:likes.likesTitle')} ({likes.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {likes.map((like) => (
              <div
                key={like.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getInitials(like.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{like.user.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {like.user.email}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(like.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </div>
              </div>
            ))}
            {likes.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {t('common:likes.noLikes')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

