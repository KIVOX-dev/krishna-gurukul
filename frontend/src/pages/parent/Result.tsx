import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { mistakesToQuestions } from '@kg/shared';
import { get } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { ErrorState, Skeleton } from '../../components/ui';
import { ResultExperience, type ResultData } from '../../components/celebration';

/** Same animated card in the child's flow (fresh) and in the parent's history (static-ish replay). */
export default function Result() {
  const { attemptId } = useParams(); const { id, kid } = useKid(); const nav = useNavigate(); const loc = useLocation();
  const fresh = !!(loc.state as any)?.fresh;
  const q = useQuery({
    queryKey: ['result', attemptId], queryFn: () => get(`/parent/children/${id}/results/${attemptId}`), enabled: !!id,
    refetchInterval: (query) => ((query.state.data as any)?.aiStatus === 'queued' ? 8000 : false), // AI note fades in when queue finishes
  });
  if (q.isLoading || !id) return <Skeleton className="h-96" />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const r = q.data as ResultData;
  const practiseMistakes = () => {
    const wrong = r.review.filter((a) => !a.correct);
    const qs = mistakesToQuestions(wrong.map((a) => ({ id: a.q, numbers: a.numbers, op: a.op, answer: a.expected })), wrong.map((a) => a.q));
    nav('/parent/practice', { state: { mistakes: qs } });
  };
  return <ResultExperience r={r} animateIn={fresh} studentName={kid?.name} onPracticeMistakes={practiseMistakes} onHome={() => nav('/parent')} />;
}
