import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useMountainCompletions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
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
          .select('mountain_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading completed mountains:', error);
        } else {
          setCompletedIds(data?.map(item => item.mountain_id) || []);
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
          addToast('Failed to remove mountain completion. Please try again.', 'error');
        } else {
          setCompletedIds(prev => prev.filter(id => id !== mountainId));
          addToast('Mountain marked as not completed', 'success', 3000);
        }
      } else {
        // Add completion
        const { error } = await supabase
          .from('user_mountains')
          .insert({
            user_id: user.id,
            mountain_id: mountainId,
          });

        if (error) {
          console.error('Error adding completion:', error);
          addToast('Failed to mark mountain as completed. Please try again.', 'error');
        } else {
          setCompletedIds(prev => [...prev, mountainId]);
          addToast('Mountain marked as completed!', 'success', 3000);
        }
      }
    } catch (err) {
      console.error('Error toggling mountain completion:', err);
      addToast('Network error. Please check your connection and try again.', 'error');
    }
  };

  return {
    completedIds,
    loading,
    toggleMountain,
  };
}



