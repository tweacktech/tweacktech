import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link } from 'react-router-dom';
import { Filter, Plus, RefreshCw, Search, User } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import Pagination from '../Component/Pagination';
import { useCurrency } from '../CurrencyContext';
import { getErrorMessage } from '../lib/apiError';
import { publicName, publicInitials } from '../lib/displayName';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const initials = (profile) => publicInitials(profile.user, profile.headline || 'Tech Talent');

const TalentHub = () => {
  const { api, isAuthenticated, hasPermission } = useAuth();
  const { format } = useCurrency();
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/talent?page=${page}&limit=12`);
      const payload = unwrap(res);
      setProfiles(payload?.profiles || []);
      setMeta(payload?.meta || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load the Talent Hub right now.'));
    } finally {
      setLoading(false);
    }
  }, [api, page]);

  useEffect(() => {
    load();
  }, [load]);

  const skills = useMemo(() => {
    const set = new Set();
    profiles.forEach((profile) => (profile.skills || []).forEach((skill) => set.add(skill)));
    return ['All', ...Array.from(set).sort()];
  }, [profiles]);

  const filtered = useMemo(
    () =>
      profiles.filter((profile) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          !query ||
          `${profile.user?.firstName} ${profile.user?.lastName} ${profile.headline} ${(profile.skills || []).join(' ')}`
            .toLowerCase()
            .includes(query);
        const matchesSkill =
          selectedSkill === 'All' || (profile.skills || []).includes(selectedSkill);
        const matchesAvailability =
          selectedAvailability === 'All' || profile.availability === selectedAvailability;
        return matchesSearch && matchesSkill && matchesAvailability;
      }),
    [profiles, searchQuery, selectedAvailability, selectedSkill],
  );

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">
              <User className="h-3.5 w-3.5" /> Talent Hub
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Hire vetted tech talent
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Browse TweackTech professionals, review their skills and message them directly —
              no recruiter fees.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasPermission('MANAGE_TALENT') && (
              <Link to="/admin/talent" className="btn-secondary">
                <Plus className="h-4 w-4" /> Manage profiles
              </Link>
            )}
            <button type="button" onClick={load} className="btn-secondary">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="card mt-6 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, title or skill…"
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedSkill}
                onChange={(event) => setSelectedSkill(event.target.value)}
                className="input-field !py-2.5 lg:w-44"
                aria-label="Filter by skill"
              >
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <select
                value={selectedAvailability}
                onChange={(event) => setSelectedAvailability(event.target.value)}
                className="input-field !py-2.5 lg:w-40"
                aria-label="Filter by availability"
              >
                {['All', 'Available', 'Busy', 'Open to offers'].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>
            {filtered.length} professional{filtered.length === 1 ? '' : 's'} found
          </p>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-6 p-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
              No professionals found
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((profile) => {
              const available = profile.availability === 'Available';
              return (
                <Link
                  key={profile.id}
                  to={`/talent/${profile.id}`}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative h-36 bg-gradient-to-br from-red-600 to-red-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {profile.avatar || profile.user?.avatar ? (
                        <img loading="lazy" decoding="async"
                          src={normalizeImageUrl(profile.avatar || profile.user.avatar)}
                          alt=""
                          className="h-24 w-24 rounded-2xl border-4 border-white/30 object-cover"
                        />
                      ) : (
                        <span className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-white/30 bg-white/15 text-2xl font-bold text-white">
                          {initials(profile)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        available
                          ? 'bg-emerald-400 text-emerald-950'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {available ? '● Available' : profile.availability}
                    </span>
                    {profile.isFeatured && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-950">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-bold text-slate-900 group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                      {publicName(profile.user, profile.headline || 'Tech Talent')}
                    </h2>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {profile.headline}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(profile.skills || []).slice(0, 4).map((skill) => (
                        <span key={skill} className="badge-neutral !text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{profile.location || 'Remote'}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {profile.hourlyRate
                          ? `${format(profile.hourlyRate, profile.currency)}/hr`
                          : 'Rate on request'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
                      View profile <span aria-hidden="true">→</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination meta={meta} onPage={setPage} />

        {!isAuthenticated && profiles.length > 0 && (
          <div className="card mt-8 flex flex-col items-center gap-2 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Want to be listed?
            </h2>
            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
              Create a free TweackTech account and contact the team to publish your professional profile.
            </p>
            <Link to="/register" className="btn-primary mt-2">
              Create free account
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TalentHub;
