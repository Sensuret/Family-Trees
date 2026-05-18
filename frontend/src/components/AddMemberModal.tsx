import { useState } from 'react';
import { api, type Member, type MemberCreate } from '../api/client';

interface Props {
  members: Member[];
  onClose: () => void;
  onAdded: () => void;
  prefill?: Partial<MemberCreate>;
}

export default function AddMemberModal({ members, onClose, onAdded, prefill }: Props) {
  const [form, setForm] = useState<MemberCreate>({
    first_name: prefill?.first_name || '',
    last_name: prefill?.last_name || '',
    maiden_name: prefill?.maiden_name || '',
    gender: prefill?.gender || 'male',
    birth_date: prefill?.birth_date || '',
    death_date: prefill?.death_date || '',
    birth_place: prefill?.birth_place || '',
    bio: prefill?.bio || '',
    father_id: prefill?.father_id || null,
    mother_id: prefill?.mother_id || null,
    spouse_id: prefill?.spouse_id || null,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    try {
      await api.createMember(form);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const males = members.filter((m) => m.gender === 'male');
  const females = members.filter((m) => m.gender === 'female');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-2xl">
          <h2 className="text-white text-xl font-bold m-0">Add Family Member</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maiden Name</label>
              <input
                type="text"
                value={form.maiden_name || ''}
                onChange={(e) => setForm({ ...form, maiden_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input
                type="date"
                value={form.birth_date || ''}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
              <input
                type="text"
                value={form.birth_place || ''}
                onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father</label>
              <select
                value={form.father_id || ''}
                onChange={(e) => setForm({ ...form, father_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">None</option>
                {males.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother</label>
              <select
                value={form.mother_id || ''}
                onChange={(e) => setForm({ ...form, mother_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">None</option>
                {females.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spouse</label>
            <select
              value={form.spouse_id || ''}
              onChange={(e) => setForm({ ...form, spouse_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">None</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer border-none disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
