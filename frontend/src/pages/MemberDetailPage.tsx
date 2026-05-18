import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, type Member } from '../api/client';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [children, setChildren] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Member>>({});

  useEffect(() => {
    if (!id) return;
    const memberId = parseInt(id);
    Promise.all([
      api.getMember(memberId),
      api.getChildren(memberId),
      api.getMembers(),
    ])
      .then(([m, c, all]) => {
        setMember(m);
        setChildren(c);
        setAllMembers(all);
        setEditForm(m);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!member) return;
    const { id: _id, family_id: _fid, created_at: _ca, ...data } = editForm as Member;
    const updated = await api.updateMember(member.id, data);
    setMember(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!member || !confirm('Remove this member from the family tree?')) return;
    await api.deleteMember(member.id);
    navigate('/members');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-800">Member not found</h2>
        <Link to="/members" className="text-primary mt-4 inline-block">
          Back to Members
        </Link>
      </div>
    );
  }

  const father = member.father_id ? allMembers.find((m) => m.id === member.father_id) : null;
  const mother = member.mother_id ? allMembers.find((m) => m.id === member.mother_id) : null;
  const spouse = member.spouse_id ? allMembers.find((m) => m.id === member.spouse_id) : null;
  const siblings = allMembers.filter(
    (m) =>
      m.id !== member.id &&
      ((member.father_id && m.father_id === member.father_id) ||
        (member.mother_id && m.mother_id === member.mother_id))
  );

  const color =
    member.gender === 'male'
      ? 'from-blue-500 to-blue-600'
      : member.gender === 'female'
      ? 'from-pink-500 to-pink-600'
      : 'from-purple-500 to-purple-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${color} rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <Link to="/members" className="text-white/80 hover:text-white text-sm mb-4 inline-block no-underline">
          ← Back to Members
        </Link>
        <div className="flex items-center gap-5 relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
            {member.first_name[0]}{member.last_name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold m-0">
              {member.first_name} {member.last_name}
            </h1>
            {member.maiden_name && (
              <p className="text-white/70 mt-1">née {member.maiden_name}</p>
            )}
            <p className="text-white/80 capitalize mt-1">{member.gender}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Details</h2>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg cursor-pointer border-none hover:bg-primary-dark"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditForm(member);
                    }}
                    className="text-sm bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg cursor-pointer border-none hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-primary hover:text-primary-dark cursor-pointer bg-transparent border-none font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:text-red-700 cursor-pointer bg-transparent border-none font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">First Name</label>
                <input
                  value={editForm.first_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Name</label>
                <input
                  value={editForm.last_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Birth Date</label>
                <input
                  type="date"
                  value={editForm.birth_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Birth Place</label>
                <input
                  value={editForm.birth_place || ''}
                  onChange={(e) => setEditForm({ ...editForm, birth_place: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Bio</label>
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <DetailRow label="Born" value={member.birth_date || '—'} />
              <DetailRow label="Birth Place" value={member.birth_place || '—'} />
              {member.death_date && <DetailRow label="Died" value={member.death_date} />}
              {member.bio && <DetailRow label="Bio" value={member.bio} />}
            </div>
          )}
        </div>

        {/* Relationships */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Family Connections</h2>

          {father && (
            <RelationCard label="Father" member={father} />
          )}
          {mother && (
            <RelationCard label="Mother" member={mother} />
          )}
          {spouse && (
            <RelationCard label="Spouse" member={spouse} />
          )}

          {siblings.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Siblings</p>
              <div className="space-y-2">
                {siblings.map((s) => (
                  <RelationCard key={s.id} member={s} />
                ))}
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Children</p>
              <div className="space-y-2">
                {children.map((c) => (
                  <RelationCard key={c.id} member={c} />
                ))}
              </div>
            </div>
          )}

          {!father && !mother && !spouse && siblings.length === 0 && children.length === 0 && (
            <p className="text-gray-400 text-sm py-4 text-center">
              No family connections yet. Add parents, children, or a spouse to see connections.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function RelationCard({ label, member }: { label?: string; member: Member }) {
  const color =
    member.gender === 'male' ? 'bg-blue-500' : member.gender === 'female' ? 'bg-pink-500' : 'bg-purple-500';
  return (
    <Link
      to={`/members/${member.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
    >
      <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
        {member.first_name[0]}{member.last_name[0]}
      </div>
      <div>
        {label && <p className="text-xs text-gray-400">{label}</p>}
        <p className="text-sm font-medium text-gray-800">
          {member.first_name} {member.last_name}
        </p>
      </div>
    </Link>
  );
}
