import { Badge } from '../../components/ui';
import { ResourcePage } from '../../components/ResourcePage';

/** Courses are records: add a new one here and it appears on the website, forms and fee plans. */
export default function CoursesAdmin() {
  return (
    <ResourcePage title="Courses" sub="New courses appear on the website with no code change" endpoint="/admin/courses" canDelete defaults={{ type: 'abacus', isPublic: true }}
      cols={[{ key: 'name', label: 'Course', primary: true }, { key: 'type', label: 'Type', render: (r) => <Badge>{r.type}</Badge> }, { key: 'ageGroup', label: 'Age' }, { key: 'fee', label: 'Fee', render: (r) => (r.feeFrom ? `₹${r.feeFrom}${r.feeTo ? '–' + r.feeTo : ''}` : '–') }, { key: 'isPublic', label: 'Public', render: (r) => (r.isPublic ? 'Yes' : 'Hidden') }]}
      fields={[{ key: 'name', label: 'Name', required: true }, { key: 'type', label: 'Type', type: 'select', options: ['abacus', 'vedic', 'tuition', 'music'].map((v) => ({ value: v, label: v })) }, { key: 'ageGroup', label: 'Age group' }, { key: 'duration', label: 'Duration' },
        { key: 'feeFrom', label: 'Fee from (₹/month)', type: 'number' }, { key: 'feeTo', label: 'Fee to (₹/month)', type: 'number' }, { key: 'levels', label: 'Levels (comma separated)' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'isPublic', label: 'Show on website', type: 'checkbox' }]}
      toForm={(r) => ({ ...r, levels: (r.levels ?? []).join(', ') })}
      toPayload={(f) => ({ name: f.name, type: f.type, ageGroup: f.ageGroup, duration: f.duration, description: f.description, isPublic: !!f.isPublic, feeFrom: f.feeFrom === '' ? undefined : f.feeFrom, feeTo: f.feeTo === '' ? undefined : f.feeTo, levels: String(f.levels ?? '').split(',').map((s) => s.trim()).filter(Boolean) })}
    />
  );
}
