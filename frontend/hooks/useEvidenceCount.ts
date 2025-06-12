import { useState, useEffect } from 'react';
import { evidence } from '@/lib/api';

export function useEvidenceCount(vendorId: string) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await evidence.getCount(vendorId);
        setCount(response.count || 0);
      } catch (err: any) {
        console.error('Error fetching evidence count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (vendorId) {
      fetchCount();
    }
  }, [vendorId]);

  return { count, isLoading, error };
} 