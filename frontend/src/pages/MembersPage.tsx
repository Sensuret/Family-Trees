import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Member } from '../api/client';
import AddMemberModal from '../components/AddMemberModal';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const loadMembers = () => {
    api.getMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filtered = members.filter(
    (m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (m.maiden_name && m.maiden_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    await api.deleteMember(id);
    loadMembers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Family Members</h1>
          <p className="text-gray-500 text-sm">{members.length} members in your family</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer border-none flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white shadow-sm"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Members Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search ? 'No members found' : 'No members yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Try a different search term' : 'Start building your family tree by adding members'}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer border-none"
            >
              Add Your First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden border border-gray-100"
            >
              <div
                className={`h-2 ${
                  m.gender === 'male'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                    : m.gender === 'female'
                    ? 'bg-gradient-to-r from-pink-400 to-pink-600'
                    : 'bg-gradient-to-r from-purple-400 to-purple-600'
                }`}
              />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        m.gender === 'male'
                          ? 'bg-blue-500'
                          : m.gender === 'female'
                          ? 'bg-pink-500'
                          : 'bg-purple-500'
                      }`}
                    >
                      {m.first_name[0]}
                      {m.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {m.first_name} {m.last_name}
                      </h3>
                      {m.maiden_name && (
                        <p className="text-xs text-gray-400">née {m.maiden_name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all cursor-pointer bg-transparent border-none p-1"
                    title="Remove member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {m.birth_date && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Born:</span> {m.birth_date}
                    </p>
                  )}
                  {m.birth_place && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Place:</span> {m.birth_place}
                    </p>
                  )}
                  {m.death_date && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Died:</span> {m.death_date}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/members/${m.id}`}
                    className="flex-1 text-center py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors no-underline"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddMemberModal
          members={members}
          onClose={() => setShowModal(false)}
          onAdded={() => {
            setShowModal(false);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}
