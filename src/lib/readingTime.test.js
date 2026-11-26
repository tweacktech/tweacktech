import { formatReadingStats, readingStats } from './readingTime';

describe('reading stats', () => {
  it('counts words while ignoring HTML tags', () => {
    expect(readingStats('<p>Hello <strong>world</strong></p>').words).toBe(2);
  });

  it('never reports less than one minute', () => {
    expect(readingStats('short').minutes).toBe(1);
    expect(readingStats('').minutes).toBe(1);
  });

  it('rounds to the nearest minute at 200 words per minute', () => {
    const words = Array.from({ length: 1000 }, () => 'word').join(' ');
    expect(readingStats(words).minutes).toBe(5);
  });

  it('formats both minutes and word count', () => {
    expect(formatReadingStats('<p>one two three</p>')).toContain('1 min read');
    expect(formatReadingStats('<p>one two three</p>')).toContain('3 words');
  });
});
