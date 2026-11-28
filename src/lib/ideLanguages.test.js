import { LANGUAGES, getLanguage, newFile, nextFileName, renameExtension } from './ideLanguages';

describe('IDE language registry', () => {
  it('offers every advertised language with a runner mode', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(18);
    LANGUAGES.forEach((item) => {
      expect(item).toEqual(
        expect.objectContaining({ id: expect.any(String), label: expect.any(String), ext: expect.any(String), starter: expect.any(String) }),
      );
      expect(['browser', 'preview', 'remote', 'text']).toContain(item.mode);
      if (item.mode === 'remote') expect(item.judge0).toBeGreaterThan(0);
    });
  });

  it('names new files with the right extension and never reuses a name', () => {
    const first = newFile('python');
    expect(first.name).toBe('page.py');
    const second = newFile('python', [first]);
    expect(second.name).toBe('page1.py');
    expect(nextFileName([first, second], 'python')).toBe('page2.py');
    expect(nextFileName([first], 'go')).toBe('page.go');
  });

  it('renames the extension when a file changes language', () => {
    expect(renameExtension('notes.py', 'go')).toBe('notes.go');
    expect(renameExtension('my.script', 'typescript')).toBe('my.ts');
  });

  it('falls back to the first language for unknown ids', () => {
    expect(getLanguage('not-a-language').id).toBe('javascript');
  });
});
