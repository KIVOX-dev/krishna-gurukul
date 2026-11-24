import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../services/api';
import { Card } from './ui';

/** Practice accuracy (%) and speed (seconds per question) across the child's recent sessions. */
export function PracticeChart({ childId, title = 'Accuracy and speed' }: { childId: string; title?: string }) {
  const q = useQuery({ queryKey: ['practice', childId], queryFn: () => get(`/parent/children/${childId}/practice`), enabled: !!childId });
  const data = (q.data?.sessions ?? []).map((s: any, n: number) => ({ n: n + 1, accuracy: Math.round(s.accuracy), speed: Math.round((s.avgTimeMs ?? 0) / 100) / 10 }));
  if (data.length < 2) return null;
  return (
    <Card>
      <h2 className="mb-2 font-display text-xl font-bold text-navy">{title}</h2>
      <div className="h-52">
        <ResponsiveContainer>
          <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e3eef7" /><XAxis dataKey="n" /><YAxis yAxisId="a" domain={[0, 100]} /><YAxis yAxisId="s" orientation="right" /><Tooltip /><Legend />
            <Line yAxisId="a" name="Accuracy %" dataKey="accuracy" stroke="#2BB88F" strokeWidth={3} dot={{ r: 4 }} /><Line yAxisId="s" name="Seconds per question" dataKey="speed" stroke="#EC6206" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
