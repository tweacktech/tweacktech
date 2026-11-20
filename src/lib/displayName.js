// Demo/admin accounts are often seeded with the literal name "Admin User".
// Public talent and mentor pages should show the professional headline instead.
const PLACEHOLDER_NAMES = new Set([
  'admin user',
  'admin',
  'user',
  'test user',
  'demo user',
  'tweacktech',
  'tweack tech',
]);

export const publicName = (user, fallback = 'TweackTech Talent') => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (!name || PLACEHOLDER_NAMES.has(name.toLowerCase())) return fallback;
  return name;
};

export const publicInitials = (user, fallback = 'TweackTech Talent') => {
  const name = publicName(user, fallback);
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'TT'
  );
};
