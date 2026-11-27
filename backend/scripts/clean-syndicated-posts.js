/* eslint-disable no-console */
/**
 * Repair syndicated RSS posts that were published with copied body text,
 * duplicated excerpts or half-written summaries.
 *
 * Run: npm run clean:syndicated
 *
 * Idempotent: safe to re-run. Only posts carrying the old "Read the original
 * source" markup or a broken excerpt are touched. The bionic-hands post is
 * replaced with an original, commentary-led article.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BIONIC_SLUG = 'the-next-generation-of-bionic-hands-is-here-and-they-can-feel';

const BIONIC_CONTENT = `<p>A prosthetic hand that can report how hard it is gripping an object is a milestone in interface design, not just a medical story. For most of the history of assistive devices, the engineering goal was motion: open, close, rotate, repeat. The interesting frontier is now feedback — giving the user a usable signal about what the device is actually doing.</p>

<h2>Why feedback matters more than another motor</h2>
<p>A hand with more joints is not automatically more useful. Someone holding an egg, a coffee cup or another person's hand needs to know how much force is being applied. Without that information, the only strategy is to watch the hand closely and guess. Adding a motor increases capability; adding a feedback channel increases control.</p>
<p>This distinction is familiar to anyone who has used a tool with poor tactile response. A screwdriver that you cannot feel slipping turns a simple task into a cautious one. The same is true at a much higher stakes scale for a prosthetic user.</p>

<h2>The nervous system is part of the interface</h2>
<p>The most promising approach does not put a display on the wrist. It connects sensors in the hand to nerves in the forearm, so pressure becomes a sensation the user can interpret. That changes the design problem from "how do we build a better gripper" to "how do we build a signal the nervous system can understand".</p>
<p>It also explains why progress is slow. Nerves are delicate, signals drift over time, and every person's anatomy is different. A device that works for one participant may need substantial recalibration for another.</p>

<h2>What software teams can learn from it</h2>
<p>The lessons travel well beyond medical hardware. First, observability is a feature: a system that cannot report its own state forces the operator to guess. Second, calibration is unavoidable whenever a system meets the physical world, so design for it openly instead of hiding it. Third, latency is part of the experience — a pressure signal that arrives half a second late is worse than no signal at all, because it invites overcorrection.</p>
<p>These are the same constraints that shape robotics, remote surgery and even real-time web applications. The domain changes; the need for trustworthy feedback does not.</p>

<h2>The access question</h2>
<p>Experimental devices reach a tiny number of people. A breakthrough that helps nine trial participants is real progress, but it is not yet a product. Cost, clinical support, maintenance and training all decide whether a device can leave the laboratory. Any serious discussion of bionic hands has to include who is allowed to use them, not just whether the technology works.</p>
<p>That is why user involvement early in the design process matters. People who live with a device notice problems that a test bench cannot: comfort over a full day, reliability in rain, how a hand feels when it is cold.</p>

<h2>What to watch next</h2>
<p>Three things will tell us whether this generation of devices is a turning point. Are feedback signals stable for months rather than weeks? Can the fitting process be standardised across clinics? And do users report that the hand reduces effort in ordinary tasks, not just that it performs well in a demonstration?</p>
<p>If the answer to those questions is yes, the impact will be larger than a better prosthetic. It will be proof that careful interface design can turn a mechanical tool into something that feels like part of a person.</p>

<h2>Key takeaways</h2>
<ul><li>Feedback is as important as motion in an assistive device.</li><li>Connecting to nerves turns a hardware problem into a human-interface problem.</li><li>Observability, calibration and latency are design requirements, not afterthoughts.</li><li>Access and clinical support determine whether a laboratory result becomes a product.</li></ul>

<p><a href="https://www.technologyreview.com/2026/11/26/1149923/the-next-generation-of-bionic-hands-is-here-and-they-can-feel/" rel="nofollow noopener" target="_blank">Further reading: the original report</a></p>`;

const BIONIC_EXCERPT =
  'A prosthetic hand that can report how hard it is gripping an object is a milestone in interface design, not just a medical story.';

const plain = (value) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Cut at a complete sentence, never in the middle of a word. */
const sentence = (value, max = 240) => {
  const text = plain(value);
  if (text.length <= max && /[.!?…]["')\]]?$/.test(text)) return text;
  const window = text.slice(0, max + 60);
  const stop = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  if (stop > 0) return window.slice(0, stop + 1);
  const space = window.lastIndexOf(' ', max);
  return `${window.slice(0, space > 0 ? space : max).replace(/[,;:\s]+$/, '')}…`;
};

async function main() {
  const bionic = await prisma.blogPost.findUnique({
    where: { slug: BIONIC_SLUG },
    select: { id: true, isPublished: true },
  });
  if (bionic) {
    await prisma.blogPost.update({
      where: { id: bionic.id },
      data: {
        content: BIONIC_CONTENT,
        excerpt: BIONIC_EXCERPT,
        metaDescription: sentence(BIONIC_EXCERPT, 155),
        isPublished: true,
        tags: 'assistive technology, engineering, accessibility, bionics',
      },
    });
    console.log('Rewrote the bionic-hands article with original commentary.');
  } else {
    console.log('Bionic-hands post not present; nothing to rewrite.');
  }

  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, excerpt: true, content: true },
  });
  let cleaned = 0;
  for (const post of posts) {
    const content = String(post.content || '');
    const excerpt = plain(post.excerpt);
    const hasSourceLink = content.includes('Read the original source');
    const brokenExcerpt =
      excerpt.length > 120 && !/[.!?…]["')\]]?$/.test(excerpt);
    if (!hasSourceLink && !brokenExcerpt) continue;

    const data = {};
    if (hasSourceLink) {
      data.content = content.replaceAll(
        'Read the original source',
        'Further reading: the original report',
      );
    }
    if (brokenExcerpt) {
      const body = plain(content);
      data.excerpt = sentence(excerpt || body);
      data.metaDescription = sentence(data.excerpt, 155);
    }
    await prisma.blogPost.update({ where: { id: post.id }, data });
    cleaned += 1;
    console.log(`Cleaned ${post.slug}`);
  }
  console.log(`Posts cleaned: ${cleaned}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
