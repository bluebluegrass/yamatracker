import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { MountainCompletion } from '@/types/mountain';
import { getTodayDateString, isFutureDate } from '@/lib/date';

export function useMountainCompletions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [completionData, setCompletionData] = useState<Record<string, MountainCompletion>>({});
  const [loading, setLoading] = useState(true);

  // Load completed mountains from database
  useEffect(() => {
    const loadCompletedMountains = async () => {
      if (!user) {
        setCompletedIds([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_mountains')
          .select('mountain_id, completed_at, hiked_on')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading completed mountains:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          const ids = data?.map(item => item.mountain_id) || [];
          const completionMap: Record<string, MountainCompletion> = {};
          
          data?.forEach(item => {
            completionMap[item.mountain_id] = {
              mountain_id: item.mountain_id,
              completed_at: item.completed_at,
              hiked_on: item.hiked_on
            };
          });
          
          setCompletedIds(ids);
          setCompletionData(completionMap);
        }
      } catch (err) {
        console.error('Error loading completed mountains:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompletedMountains();
  }, [user]);

  const toggleMountain = async (mountainId: string) => {
    if (!user) {
      console.warn('User not authenticated');
      return;
    }

    const isCompleted = completedIds.includes(mountainId);

    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('user_mountains')
          .delete()
          .eq('user_id', user.id)
          .eq('mountain_id', mountainId);

        if (error) {
          console.error('Error removing completion:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          addToast(`Failed to remove mountain completion: ${error.message}`, 'error');
        } else {
          setCompletedIds(prev => prev.filter(id => id !== mountainId));
          setCompletionData(prev => {
            const newData = { ...prev };
            delete newData[mountainId];
            return newData;
          });
          addToast('Mountain marked as not completed', 'success', 3000);
        }
      } else {
        // Add completion with default date
        const today = getTodayDateString();
        const { error } = await supabase
          .from('user_mountains')
          .insert({
            user_id: user.id,
            mountain_id: mountainId,
            hiked_on: today,
          });

        if (error) {
          console.error('Error adding completion:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          addToast(`Failed to mark mountain as completed: ${error.message}`, 'error');
        } else {
          setCompletedIds(prev => [...prev, mountainId]);
          setCompletionData(prev => ({
            ...prev,
            [mountainId]: {
              mountain_id: mountainId,
              completed_at: new Date().toISOString(),
              hiked_on: today
            }
          }));
          addToast('Mountain marked as completed! Date set to today.', 'success', 3000);
        }
      }
    } catch (err) {
      console.error('Error toggling mountain completion:', err);
      addToast('Network error. Please check your connection and try again.', 'error');
    }
  };

  // Set completion date for a specific mountain
  const setCompletionDate = async (mountainId: string, date: string | null): Promise<void> => {
    if (!user) {
      console.warn('User not authenticated');
      return;
    }

    // Validate date if provided
    if (date && isFutureDate(date)) {
      addToast("Date can't be in the future", 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_mountains')
        .update({ hiked_on: date })
        .eq('user_id', user.id)
        .eq('mountain_id', mountainId);

      if (error) {
        console.error('Error updating completion date:', error);
        addToast('Could not save date.', 'error');
      } else {
        setCompletionData(prev => ({
          ...prev,
          [mountainId]: {
            ...prev[mountainId],
            hiked_on: date
          }
        }));
        addToast(date ? 'Date saved successfully' : 'Date cleared', 'success', 2000);
      }
    } catch (err) {
      console.error('Error updating completion date:', err);
      addToast('Network error. Please try again.', 'error');
    }
  };

  // Get completion data for a specific mountain
  const getCompletionData = (mountainId: string): MountainCompletion | null => {
    return completionData[mountainId] || null;
  };

  return {
    completedIds,
    completionData,
    loading,
    toggleMountain,
    setCompletionDate,
    getCompletionData,
  };
}



