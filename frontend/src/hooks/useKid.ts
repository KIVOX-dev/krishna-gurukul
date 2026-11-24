import { useQuery } from '@tanstack/react-query';
import { get } from '../services/api';
import { useChild } from '../store';

/** Currently selected child for the parent login. */
export function useKid() {
  const { childId } = useChild();
  const kids = useQuery({ queryKey: ['children'], queryFn: () => get('/parent/children') });
  const list: any[] = kids.data ?? [];
  const kid = list.find((k) => k._id === childId) ?? list[0];
  return { kid, id: kid?._id as string | undefined, loading: kids.isLoading, kids: list };
}
