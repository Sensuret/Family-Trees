import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Family, type Member } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getFamily(), api.getMembers()])
      .then(([f, m]) => {
        setFamily(f);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const generations = new Set<number>();
  const countGenerations = (memberId: number, depth: number, visited: Set<number>) => {
    if (visited.has(memberId)) return;
    visited.add(memberId);
    generations.add(depth);
    members
      .filter((m) => m.father_id === memberId || m.mother_id === memberId)
      .forEach((child) => countGenerations(child.id, depth + 1, visited));
  };
  const roots = members.filter((m) => !m.father_id && !m.mother_id);
  roots.forEach((r) => countGenerations(r.id, 1, new Set()));

  const stats = [
    { label: 'Total Members', value: members.length, icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Generations', value: Math.max(generations.size, 1), icon: '🌳', color: 'from-green-500 to-green-600' },
    { label: 'Family Code', value: family?.family_code || '—', icon: '🔑', color: 'from-purple-500 to-purple-600' },
  ];

  const recentMembers = [...members].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user?.display_name}!
          </h1>
          <p className="text-white/80 text-lg mb-6">
            {family?.name || 'Your'} Family Tree
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/tree"
              className="bg-white text-primary px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all no-underline inline-block"
            >
              View Family Tree
            </Link>
            <Link
              to="/members"
              className="bg-white/20 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-all no-underline inline-block"
            >
              Manage Members
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/members"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group no-underline"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ➕
              </div>
              <div>
                <p className="font-medium text-gray-800">Add a Family Member</p>
                <p className="text-sm text-gray-500">Expand your family tree</p>
              </div>
            </Link>
            <Link
              to="/tree"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group no-underline"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                🌳
              </div>
              <div>
                <p className="font-medium text-gray-800">Explore Family Tree</p>
                <p className="text-sm text-gray-500">Visualize your lineage</p>
              </div>
            </Link>
            <Link
              to="/relationships"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group no-underline"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                🔗
              </div>
              <div>
                <p className="font-medium text-gray-800">Find Relationships</p>
                <p className="text-sm text-gray-500">See how members are connected</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recently Added</h2>
          {recentMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">👨‍👩‍👧‍👦</p>
              <p>No members yet. Start building your tree!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((m) => (
                <Link
                  key={m.id}
                  to={`/members/${m.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
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
                    <p className="font-medium text-gray-800">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {m.birth_date || 'No birth date'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Family Code */}
      {family && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔑</div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">Share Your Family Code</h3>
              <p className="text-gray-600 text-sm mb-3">
                Invite family members to join by sharing this code. They can sign up with it to access your family tree.
              </p>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-300">
                <span className="font-mono font-bold text-lg text-amber-700">
                  {family.family_code}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(family.family_code)}
                  className="text-amber-600 hover:text-amber-800 cursor-pointer bg-transparent border-none text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
