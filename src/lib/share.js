export const absoluteUrl = (path) =>
  typeof window === 'undefined' ? path : `${window.location.origin}${path}`;

export const mentorShareText = (mentor) =>
  mentor
    ? `Learn ${mentor.skills?.slice(0, 3).join(', ') || 'in-demand skills'} with ${
        mentor.user?.firstName || 'our mentor'
      } ${mentor.user?.lastName || ''} at TweackTech.`.replace(/\s+/g, ' ').trim()
    : 'Find expert mentors at TweackTech.';

export const mentorShareLinks = (mentor) => {
  const url = absoluteUrl(`/mentors/${mentor.userId || mentor.id}`);
  const text = mentorShareText(mentor);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  return {
    url,
    text,
    links: [
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      },
      {
        id: 'x',
        label: 'X',
        href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      },
      {
        id: 'linkedin',
        label: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      },
      {
        id: 'facebook',
        label: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      },
      {
        id: 'telegram',
        label: 'Telegram',
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      },
    ],
  };
};

export const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    /* fall through to the legacy path */
  }
  try {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  } catch (error) {
    return false;
  }
};
