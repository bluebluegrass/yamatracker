import React from 'react';

interface DifficultyBreakdownProps {
  mountains: Array<{
    id: string;
    difficulty: string;
  }>;
  completedIds: string[];
}

export default function DifficultyBreakdown({ mountains, completedIds }: DifficultyBreakdownProps) {
  // Calculate difficulty statistics
  const difficultyStats = mountains.reduce((acc, mountain) => {
    const difficulty = mountain.difficulty || '★';
    const isCompleted = completedIds.includes(mountain.id);
    
    if (!acc[difficulty]) {
      acc[difficulty] = { total: 0, completed: 0 };
    }
    
    acc[difficulty].total++;
    if (isCompleted) {
      acc[difficulty].completed++;
    }
    
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Define difficulty order (1-4 stars)
  const difficultyOrder = ['★', '★★', '★★★', '★★★★'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress by Difficulty</h3>
      <div className="space-y-3">
        {difficultyOrder.map((difficulty) => {
          const stats = difficultyStats[difficulty];
          if (!stats) return null;
          
          const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          
          return (
            <div key={difficulty} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {difficulty} ({stats.completed}/{stats.total})
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
