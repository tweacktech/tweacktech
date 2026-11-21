import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

export type TutorMode = 'explain' | 'takeaways' | 'quiz' | 'ask';

export interface TutorReply {
  reply: string;
  mode: TutorMode;
  provider: 'gemini' | 'lesson';
  suggestions: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at', 'for',
  'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'you', 'we', 'they', 'my', 'your', 'our', 'their', 'me', 'us',
  'them', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'what', 'why',
  'how', 'when', 'where', 'which', 'who', 'from', 'by', 'about', 'into', 'so', 'then',
  'than', 'just', 'also', 'more', 'most', 'some', 'any', 'all', 'one', 'two', 'get',
]);

const TASK_PROMPT: Record<TutorMode, string> = {
  explain:
    'Explain the lesson content in simple, beginner-friendly terms. Use short paragraphs and include one small, practical example where useful.',
  takeaways:
    'List the 5 most important takeaways from the lesson as concise bullet points.',
  quiz:
    'Create 3 short practice questions based only on the lesson content, then list the answers under "Answers:".',
  ask:
    'Answer the student question using only the lesson content. If the answer is not covered, say so and suggest what to ask instead.',
};

const SUGGESTIONS: Record<TutorMode, string[]> = {
  explain: ['Key takeaways', 'Quiz me', 'Give me an example'],
  takeaways: ['Explain simply', 'Quiz me', 'Ask a question'],
  quiz: ['Explain simply', 'Key takeaways', 'Ask a question'],
  ask: ['Explain simply', 'Key takeaways', 'Quiz me'],
};

// Short, accurate background notes for common lesson topics. Used only by the
// offline tutor so answers stay useful even when a reading guide is generic.
const TOPIC_NOTES: Array<[RegExp, string]> = [
  [/use\s*effect/i, 'useEffect is a React Hook for synchronising a component with something outside React — fetching data, subscribing to events, or starting a timer. It runs after render, and any function it returns is a cleanup that runs before the next effect or when the component unmounts.'],
  [/use\s*state|state hook/i, 'useState adds local state to a function component. It returns the current value and a setter function; calling the setter schedules a re-render with the new value.'],
  [/hooks?/i, 'Hooks are React functions that let function components use state and lifecycle features. Common ones are useState, useEffect and useContext.'],
  [/props/i, 'Props are read-only inputs passed from a parent component to a child. They let you reuse a component with different data.'],
  [/component/i, 'A component is a reusable piece of UI. In React it is a function that takes props and returns JSX describing what should appear on screen.'],
  [/java\s*script|javascript|\bjs\b/i, 'JavaScript is the programming language of the web. It runs in the browser and, with Node.js, on the server. It supports variables, functions, objects, arrays and asynchronous code via promises and async/await.'],
  [/async|await|promise/i, 'A promise represents a value that will be available later. async/await is syntax for working with promises: await pauses inside an async function until the promise settles.'],
  [/array/i, 'An array is an ordered list of values. You access items by index (starting at 0) and use methods like map, filter and reduce to transform them.'],
  [/function/i, 'A function is a reusable block of code that takes inputs (parameters), performs work, and can return a result.'],
  [/loop|for each|while/i, 'A loop repeats a block of code. Use a for loop when you know how many times to repeat, and a while loop when repetition depends on a condition.'],
  [/python/i, 'Python is a readable, general-purpose language widely used for web apps, data analysis and automation. It uses indentation to define blocks.'],
  [/dictionary|\bdict\b/i, 'A dictionary stores key-value pairs. You look up a value by its key instead of by position, which makes retrieval fast and code easy to read.'],
  [/node(\.js)?\b/i, 'Node.js runs JavaScript outside the browser. It is commonly used to build APIs and command-line tools, and uses an event loop for non-blocking I/O.'],
  [/express/i, 'Express is a minimal Node.js web framework. It provides routing, middleware and helpers for building HTTP APIs quickly.'],
  [/sql|mysql|database|query/i, 'SQL is the language for querying relational databases. SELECT reads rows, INSERT adds them, UPDATE changes them, and DELETE removes them. MySQL is a popular relational database engine.'],
  [/php/i, 'PHP is a server-side scripting language used to build dynamic websites. It runs on the server and sends HTML to the browser.'],
  [/html/i, 'HTML is the markup language that structures a web page. Elements such as headings, paragraphs, links and forms describe the content.'],
  [/css/i, 'CSS controls how HTML looks — layout, colours, spacing and typography. Selectors target elements and declarations set their properties.'],
  [/git|version control/i, 'Git is a version control system. It records snapshots of your project so you can track changes, branch, and merge work with others.'],
  [/api|rest/i, 'An API lets one program talk to another. A REST API exposes resources over HTTP using methods like GET (read), POST (create), PUT/PATCH (update) and DELETE (remove).'],
  [/object.orient|\boop\b|class/i, 'Object-oriented programming organises code into classes and objects. A class is a blueprint; an object is an instance with its own data and behaviour.'],
];

function topicNote(title: string): string {
  const found = TOPIC_NOTES.find(([pattern]) => pattern.test(title));
  return found ? found[1] : '';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Admin-controlled switch, stored in the existing SiteSetting table. */
  async isTutorEnabled(): Promise<boolean> {
    try {
      const row = await this.prisma.siteSetting.findUnique({
        where: { key: 'ai_tutor_enabled' },
      });
      if (!row) return true;
      return String(row.value).toLowerCase() !== 'false';
    } catch {
      return true;
    }
  }

  async setTutorEnabled(enabled: boolean) {
    await this.prisma.siteSetting.upsert({
      where: { key: 'ai_tutor_enabled' },
      update: { value: String(enabled), type: 'boolean' },
      create: {
        key: 'ai_tutor_enabled',
        value: String(enabled),
        type: 'boolean',
        description: 'Allow students to use the AI study partner in lessons',
      },
    });
    return { enabled };
  }

  async tutor(input: {
    lessonId: string;
    question?: string;
    mode?: TutorMode;
  }): Promise<TutorReply> {
    const mode: TutorMode = ['explain', 'takeaways', 'quiz', 'ask'].includes(
      String(input.mode || ''),
    )
      ? (input.mode as TutorMode)
      : 'explain';
    if (!(await this.isTutorEnabled())) {
      return {
        reply:
          'The AI study partner is currently turned off by your administrator. You can still use the lesson guide, Code Playground and module quizzes.',
        mode,
        provider: 'lesson',
        suggestions: [],
      };
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: input.lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        readingContent: true,
        module: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const question = String(input.question || '').trim().slice(0, 500);

    const body =
      this.stripHtml(lesson.readingContent || '') || String(lesson.description || '');
    const context = [
      `Course: ${lesson.module?.course?.title || 'TweackTech course'}`,
      `Module: ${lesson.module?.title || ''}`,
      `Lesson: ${lesson.title}`,
      '',
      body || lesson.description || '',
    ]
      .join('\n')
      .slice(0, 12000);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey && context.trim()) {
      try {
        const reply = await this.callGemini(apiKey, context, mode, question);
        return { reply, mode, provider: 'gemini', suggestions: SUGGESTIONS[mode] };
      } catch (error) {
        this.logger.warn(
          `AI provider unavailable, using lesson-based tutor: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    const reply = this.lessonReply(body, mode, question, lesson.title);
    return { reply, mode, provider: 'lesson', suggestions: SUGGESTIONS[mode] };
  }

  private async callGemini(
    apiKey: string,
    context: string,
    mode: TutorMode,
    question: string,
  ): Promise<string> {
    const prompt = [
      'You are a warm, patient tutor in the TweackTech learning platform.',
      'Ground every answer in the LESSON CONTENT below. Do not invent facts.',
      'Keep answers concise and formatted for a chat window (short paragraphs or bullet points).',
      '',
      'LESSON CONTENT:',
      context,
      '',
      'TASK:',
      TASK_PROMPT[mode],
      question ? `\nSTUDENT QUESTION: ${question}` : '',
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
        }),
      },
    );
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const data: any = await response.json();
    const text = (data?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!text) throw new Error('AI provider returned an empty answer');
    return text;
  }

  /** Deterministic, content-grounded tutor used when no AI key is configured. */
  private lessonReply(
    body: string,
    mode: TutorMode,
    question: string,
    lessonTitle: string,
  ): string {
    const sentences = this.sentences(body);
    const note = topicNote(lessonTitle);
    if (!sentences.length && !note) {
      return `I don't have a reading guide for "${lessonTitle}" yet. Ask your instructor to add one, then I can explain it, pull out the key points, or quiz you on it.`;
    }

    if (mode === 'takeaways') {
      const picked = [
        ...(note ? [note] : []),
        ...this.keySentences(sentences, note ? 4 : 5),
      ];
      return `Here are the key takeaways from **${lessonTitle}**:\n\n${picked
        .map((sentence, index) => `${index + 1}. ${sentence}`)
        .join('\n')}`;
    }

    if (mode === 'quiz') {
      const pool = [
        ...(note ? this.sentences(note) : []),
        ...this.keySentences(sentences, 3),
      ].slice(0, 3);
      if (!pool.length) {
        return `I need a little more content to quiz you on "${lessonTitle}". Try **Explain simply** first.`;
      }
      const questions = pool.map((sentence, index) => {
        const term = this.keyword(sentence);
        const blanked = term
          ? sentence.replace(new RegExp(`\\b${this.escape(term)}\\b`, 'i'), '______')
          : sentence;
        return `**${index + 1}.** ${blanked}`;
      });
      const answers = pool.map((sentence, index) => {
        const term = this.keyword(sentence);
        return `${index + 1}. ${term || 'Review this sentence in the reading guide.'}`;
      });
      return `Try these quick questions on **${lessonTitle}** (fill in the blank):\n\n${questions.join(
        '\n\n',
      )}\n\n**Answers:**\n${answers.join('\n')}`;
    }

    if (mode === 'ask' && question) {
      const terms = question
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
      const scored = sentences
        .map((sentence) => {
          const lower = sentence.toLowerCase();
          const score = terms.reduce(
            (total, term) => total + (lower.includes(term) ? 1 : 0),
            0,
          );
          return { sentence, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((row) => row.sentence);

      if (!scored.length && !note) {
        return `I couldn't find a direct answer to that in the "${lessonTitle}" guide. Try asking about a term from the lesson, or use **Explain simply** / **Key takeaways** and I'll walk you through it.`;
      }
      const lines = note ? [`**Quick background:** ${note}`] : [];
      scored.forEach((sentence) => lines.push(`• ${sentence}`));
      return `Here is what I found for "${lessonTitle}":\n\n${lines.join('\n')}`;
    }

    const parts: string[] = [];
    if (note) parts.push(`**Quick background:** ${note}`);
    if (sentences.length) {
      parts.push(`**From your lesson guide:**\n${sentences.slice(0, 5).join(' ')}`);
    }
    return `Here is "${lessonTitle}" in plain language:\n\n${parts.join(
      '\n\n',
    )}\n\nWant the short version? Tap **Key takeaways**, or test yourself with **Quiz me**.`;
  }

  private stripHtml(html: string): string {
    return String(html || '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|pre)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim();
  }

  private sentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter((sentence) => sentence.length >= 25)
      .slice(0, 60);
  }

  private keySentences(sentences: string[], limit: number): string[] {
    const markers = /\b(is|are|means|refers to|used to|allows|helps|important|note|example|such as|defined as|must|should)\b/i;
    const scored = sentences
      .map((sentence, index) => ({
        sentence,
        score: (markers.test(sentence) ? 2 : 0) + (index < 8 ? 1 : 0),
        index,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .sort((a, b) => a.index - b.index);
    return scored.map((row) => row.sentence);
  }

  private keyword(sentence: string): string {
    const words = sentence
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4 && !STOP_WORDS.has(word.toLowerCase()));
    return words.sort((a, b) => b.length - a.length)[0] || '';
  }

  private escape(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
