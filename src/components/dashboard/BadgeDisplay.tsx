import React from 'react';
import { useTranslations } from 'next-intl';

interface BadgeDisplayProps {
  completedCount: number;
  completedIds: string[];
  mountains: Array<{
    id: string;
    difficulty: string;
  }>;
}

interface Badge {
  key: string;
  title: string;
  description: string;
  icon: string;
  condition: boolean;
}

export default function BadgeDisplay({ completedCount, completedIds, mountains }: BadgeDisplayProps) {
  const t = useTranslations();
  
  // Check if user has completed any 5-star mountain
  const hasFiveStarMountain = mountains.some(mountain => 
    mountain.difficulty === '★★★★' && completedIds.includes(mountain.id)
  );

  const badges: Badge[] = [
    {
      key: 'first_step',
      title: t('badges.firstStep.title'),
      description: t('badges.firstStep.description'),
      icon: '🏔️',
      condition: completedCount >= 1
    },
    {
      key: 'ten_done',
      title: t('badges.tenDone.title'),
      description: t('badges.tenDone.description'),
      icon: '🎯',
      condition: completedCount >= 10
    },
    {
      key: 'half_way',
      title: t('badges.halfWay.title'),
      description: t('badges.halfWay.description'),
      icon: '🏆',
      condition: completedCount >= 50
    },
    {
      key: 'five_star_climber',
      title: t('badges.fiveStarClimber.title'),
      description: t('badges.fiveStarClimber.description'),
      icon: '⭐',
      condition: hasFiveStarMountain
    }
  ];

  const earnedBadges = badges.filter(badge => badge.condition);
  const lockedBadges = badges.filter(badge => !badge.condition);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('achievements')}</h3>
      
      {earnedBadges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">{t('earned')}</h4>
          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map((badge) => (
              <div
                key={badge.key}
                className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="text-sm font-medium text-green-800">{badge.title}</div>
                  <div className="text-xs text-green-600">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lockedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">{t('locked')}</h4>
          <div className="grid grid-cols-2 gap-3">
            {lockedBadges.map((badge) => (
              <div
                key={badge.key}
                className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
              >
                <span className="text-2xl grayscale">{badge.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-500">{badge.title}</div>
                  <div className="text-xs text-gray-400">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnedBadges.length === 0 && (
        <div className="text-center py-4">
          <div className="text-gray-400 text-sm">{t('completeMountainsToEarn')}</div>
        </div>
      )}
    </div>
  );
}
