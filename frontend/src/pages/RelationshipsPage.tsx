import { useEffect, useState } from 'react';
import { api, type Member, type RelationshipResult } from '../api/client';

export default function RelationshipsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [member1Id, setMember1Id] = useState<number | null>(null);
  const [member2Id, setMember2Id] = useState<number | null>(null);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api.getMembers()
      .then(setMembers)
      .finally(() => setPageLoading(false));
  }, []);

  const findRelationship = async () => {
    if (!member1Id || !member2Id) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.getRelationship(member1Id, member2Id);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Relationship Finder</h1>
        <p className="text-gray-500">
          Select two family members to discover how they're related
        </p>
      </div>

      {members.length < 2 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Need at least 2 members
          </h3>
          <p className="text-gray-500">
            Add more family members to use the relationship finder
          </p>
        </div>
      ) : (
        <>
          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectionCard
              label="First Person"
              members={members}
              selectedId={member1Id}
              excludeId={member2Id}
              onSelect={setMember1Id}
            />
            <SelectionCard
              label="Second Person"
              members={members}
              selectedId={member2Id}
              excludeId={member1Id}
              onSelect={setMember2Id}
            />
          </div>

          {/* Find Button */}
          <div className="text-center">
            <button
              onClick={findRelationship}
              disabled={!member1Id || !member2Id || loading}
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold text-lg hover:shadow-lg transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding...
                </span>
              ) : (
                'Find Relationship'
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center text-white">
                <p className="text-white/70 text-sm mb-1">Relationship</p>
                <h2 className="text-3xl font-bold m-0">{result.relationship}</h2>
              </div>

              <div className="p-6">
                {/* Connection Visualization */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <PersonBadge member={result.member1} />
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-pink-300" />
                    <div className="mx-3 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap">
                      {result.relationship}
                    </div>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-pink-300 to-blue-300" />
                  </div>
                  <PersonBadge member={result.member2} />
                </div>

                {/* Path */}
                {result.path.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3 text-center">Connection Path</p>
                    <div className="flex items-center justify-center flex-wrap gap-2">
                      {result.path.map((name, i) => (
                        <span key={i} className="flex items-center gap-2">
                          <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                            {name}
                          </span>
                          {i < result.path.length - 1 && (
                            <span className="text-gray-400">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SelectionCard({
  label,
  members,
  selectedId,
  excludeId,
  onSelect,
}: {
  label: string;
  members: Member[];
  selectedId: number | null;
  excludeId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const selected = selectedId ? members.find((m) => m.id === selectedId) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-gray-100 hover:border-primary/30 transition-colors">
      <p className="text-sm font-medium text-gray-500 mb-3">{label}</p>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-3"
      >
        <option value="">Select a person...</option>
        {members
          .filter((m) => m.id !== excludeId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.first_name} {m.last_name}
            </option>
          ))}
      </select>
      {selected && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              selected.gender === 'male'
                ? 'bg-blue-500'
                : selected.gender === 'female'
                ? 'bg-pink-500'
                : 'bg-purple-500'
            }`}
          >
            {selected.first_name[0]}
            {selected.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">
              {selected.first_name} {selected.last_name}
            </p>
            <p className="text-xs text-gray-500">{selected.birth_date || 'No birth date'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonBadge({ member }: { member: Member }) {
  const color =
    member.gender === 'male' ? 'bg-blue-500' : member.gender === 'female' ? 'bg-pink-500' : 'bg-purple-500';
  return (
    <div className="text-center">
      <div
        className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-1`}
      >
        {member.first_name[0]}
        {member.last_name[0]}
      </div>
      <p className="text-sm font-medium text-gray-800">{member.first_name}</p>
    </div>
  );
}
