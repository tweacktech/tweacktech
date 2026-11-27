import { sentenceExcerpt, stripBareImageUrls } from './text';

describe('sentenceExcerpt', () => {
  it('returns short text unchanged', () => {
    expect(sentenceExcerpt('A short note.', 240)).toBe('A short note.');
  });

  it('strips HTML before measuring', () => {
    expect(sentenceExcerpt('<p>Hello <strong>world</strong></p>', 240)).toBe(
      'Hello world',
    );
  });

  it('cuts at a sentence boundary instead of mid-word', () => {
    const text =
      'First sentence is here. Second sentence follows it closely. Third one is much longer and should be dropped entirely.';
    const result = sentenceExcerpt(text, 40);
    expect(result.endsWith('.')).toBe(true);
    expect(result).not.toContain('Third');
  });

  it('falls back to a word boundary with an ellipsis when no sentence fits', () => {
    const text = 'word '.repeat(100).trim();
    const result = sentenceExcerpt(text, 50);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(51);
  });

  it('handles empty input', () => {
    expect(sentenceExcerpt('', 240)).toBe('');
    expect(sentenceExcerpt(null as unknown as string, 240)).toBe('');
  });
});

describe('stripBareImageUrls', () => {
  it('removes an Unsplash link pasted into prose', () => {
    const input =
      'Learn React from scratch. https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800 Build real apps.';
    expect(stripBareImageUrls(input)).toBe(
      'Learn React from scratch. Build real apps.',
    );
  });

  it('removes a direct image file link', () => {
    expect(stripBareImageUrls('Cover art https://cdn.example.com/hero.webp end')).toBe(
      'Cover art end',
    );
  });

  it('leaves ordinary links alone', () => {
    const input = 'Read the docs at https://react.dev/learn for details.';
    expect(stripBareImageUrls(input)).toBe(input);
  });

  it('collapses leftover blank lines and double spaces', () => {
    expect(stripBareImageUrls('One.\n\n\nhttps://images.pexels.com/a.jpg\n\nTwo.')).toBe(
      'One.\n\nTwo.',
    );
  });

  it('handles empty input', () => {
    expect(stripBareImageUrls('')).toBe('');
    expect(stripBareImageUrls(null)).toBe('');
  });
});
