import React, { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Star,
  UserX,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import ShareButtons from '../Component/ShareButtons';
import { useAuth } from '../AuthContext';
import { useSeo } from '../Component/useSeo';
import { useCurrency } from '../CurrencyContext';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const TalentDetail = () => {
  const { id } = useParams();
  const { api, isAuthenticated, user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useSeo({
    title: profile
      ? `${profile.user?.firstName || ''} ${profile.user?.lastName || ''} — ${profile.headline}`
      : 'Developer Talent',
    description:
      profile?.bio ||
      'Discover developers and their skills on the TweackTech talent hub.',
    image: profile?.avatar || profile?.user?.avatar || '/icon-512.png',
    url: `/talent/${id}`,
    author: 'Meyor Dari · TweackTech',
    section: 'Talent hub',
    keywords: `${(profile?.skills || []).join(', ')}, TweackTech talent hub, hire developers, Meyor Dari`,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/talent/${id}`)
      .then((res) => !cancelled && setProfile(unwrap(res)))
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.status === 404
            ? 'This talent profile could not be found or is no longer published.'
            : getErrorMessage(err, 'Unable to load this profile.'),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  const message = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/talent/${id}` } });
      return;
    }
    if (profile?.userId === user?.id) {
      navigate('/messages');
      return;
    }
    setStarting(true);
    try {
      const res = await api.post(`/chat/direct/${profile.userId}`);
      const room = unwrap(res);
      navigate(`/messages?room=${room.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start a chat with this professional.'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <Link
          to="/talent"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Talent Hub
        </Link>

        {loading ? (
          <div className="card mt-6 flex items-center justify-center gap-3 p-16 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-red-600" /> Loading profile…
          </div>
        ) : error || !profile ? (
          <div className="card mt-6 p-10 text-center">
            <UserX className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Profile not found</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {error || 'This professional may have unpublished their profile.'}
            </p>
            <Link to="/talent" className="btn-primary mt-4">Browse Talent Hub</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <section className="space-y-5 lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-red-600 to-red-900" />
                <div className="px-6 pb-6">
                  <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                      {profile.avatar || profile.user?.avatar ? (
                        <img
                          src={normalizeImageUrl(profile.avatar || profile.user.avatar)}
                          alt=""
                          className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                        />
                      ) : (
                        <span className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-500 shadow-lg dark:border-slate-900 dark:bg-slate-800">
                          {`${profile.user?.firstName?.[0] || ''}${profile.user?.lastName?.[0] || ''}`}
                        </span>
                      )}
                      <div className="pb-1">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {profile.user?.firstName} {profile.user?.lastName}
                        </h1>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          {profile.headline}
                        </p>
                      </div>
                    </div>
                    <span
                      className={
                        profile.availability === 'Available'
                          ? 'badge-success'
                          : 'badge-warning'
                      }
                    >
                      ● {profile.availability}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                    {profile.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {profile.location}
                      </span>
                    )}
                    {profile.experienceYears && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" /> {profile.experienceYears} years experience
                      </span>
                    )}
                    {profile.hourlyRate && (
                      <span className="flex items-center gap-1.5">
                        <Star className="h-4 w-4" /> {format(profile.hourlyRate, profile.currency)}/hr
                      </span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(profile.skills || []).map((skill) => (
                      <span key={skill} className="badge-info">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <ShareButtons
                    className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800"
                    url={`/talent/${id}`}
                    title={`${profile.user?.firstName} ${profile.user?.lastName} — ${profile.headline}`}
                    description={profile.bio || 'TweackTech Talent Hub profile'}
                  />
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">About</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {profile.bio ||
                    'This professional has not added a longer bio yet. Reach out to discuss your project.'}
                </p>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  {profile.user?.website && (
                    <a href={profile.user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                      <ExternalLink className="h-4 w-4" /> Website
                    </a>
                  )}
                  {profile.user?.github && (
                    <a href={profile.user.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <ExternalLink className="h-4 w-4" /> GitHub
                    </a>
                  )}
                  {profile.user?.linkedin && (
                    <a href={profile.user.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <ExternalLink className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Work with {profile.user?.firstName}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {profile.hourlyRate
                    ? `${format(profile.hourlyRate, profile.currency)}/hr`
                    : 'Rate on request'}
                </p>
                <button
                  type="button"
                  onClick={message}
                  disabled={starting}
                  className="btn-primary mt-4 w-full"
                >
                  <MessageCircle className="h-4 w-4" />
                  {starting ? 'Opening chat…' : 'Message'}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Chat inside TweackTech — no contact details shared until you choose.
                </p>
              </div>

              <div className="card p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <BadgeCheck className="h-4 w-4 text-emerald-500" /> Verified professional
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Profiles are reviewed by the TweackTech team. Report anything suspicious to support.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TalentDetail;
