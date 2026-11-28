import {
  canUsePlayground,
  detectLanguage,
  extractCode,
  extractOutput,
} from './lessonCode';

describe('lesson code helpers', () => {
  it('detects a language from the course title', () => {
    expect(detectLanguage('React for Beginners')).toBe('javascript');
    expect(detectLanguage('Python Data Analysis')).toBe('python');
    expect(detectLanguage('MySQL Fundamentals')).toBe('sql');
    expect(detectLanguage('PHP and Laravel')).toBe('php');
    expect(detectLanguage('Something else')).toBe('javascript');
  });

  it('extracts the first runnable block and decodes entities', () => {
    const html =
      '<pre data-lang="python"><code>print(&quot;hi&quot; &amp; welcome)</code></pre>';
    expect(extractCode(html)).toEqual({
      language: 'python',
      code: 'print("hi" & welcome)',
    });
  });

  it('returns an empty example when none exists', () => {
    expect(extractCode('<p>no code</p>')).toEqual({
      language: 'javascript',
      code: '',
    });
    expect(extractCode()).toEqual({ language: 'javascript', code: '' });
  });

  it('offers the playground only for languages it can actually run', () => {
    expect(canUsePlayground({ language: 'javascript', code: 'console.log(1)' })).toBe(true);
    expect(canUsePlayground({ language: 'html', code: '<h1>Hi</h1>' })).toBe(true);
    expect(canUsePlayground({ language: 'php', code: '<?php echo 1;' })).toBe(false);
    expect(canUsePlayground({ language: 'go', code: 'package main' })).toBe(false);
    expect(canUsePlayground({ language: 'javascript', code: '' })).toBe(false);
  });

  it('extracts the stated output', () => {
    const html =
      '<p class="lesson-output"><strong>Output:</strong> <code>42</code></p>';
    expect(extractOutput(html)).toBe('42');
    expect(extractOutput('<p>nothing</p>')).toBe('');
  });
});
