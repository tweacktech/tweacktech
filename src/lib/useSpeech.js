import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cross-browser text-to-speech using the device's built-in voices.
 * No network calls, no API keys, no AI — works offline.
 *
 * Mobile browsers (notably iOS Safari) stop a single long utterance after
 * ~15 seconds and often never fire `onend`. We therefore speak short chunks
 * one after another with a watchdog, and warm up speech on the first gesture.
 */

const MAX_CHUNK = 190;

export const speechSupported = () =>
  typeof window !== 'undefined' &&
  typeof window.speechSynthesis !== 'undefined' &&
  typeof window.SpeechSynthesisUtterance !== 'undefined';

/** HTML lesson guide → natural spoken text (code blocks are skipped). */
export function htmlToSpeechText(html = '') {
  return String(html || '')
    .replace(/<(script|style|pre|code)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<li[^>]*>/gi, 'Item: ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s*\.\s*(\.\s*)+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoChunks(text) {
  const source = String(text || '').trim();
  if (!source) return [];

  const pieces = source
    .split(/(?<=[.!?])\s+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const piece of pieces) {
    if (piece.length > MAX_CHUNK) {
      // Very long sentence: break on clauses, then on words.
      const clauses = piece.split(/,\s+|;\s+|:\s+/).filter(Boolean);
      let clauseText = '';
      for (const clause of clauses) {
        const words = clause.split(/\s+/);
        let line = '';
        for (const word of words) {
          if ((line + ' ' + word).trim().length > MAX_CHUNK && line) {
            if (clauseText) {
              push();
              current = clauseText + '. ';
              clauseText = '';
            }
            chunks.push(line.trim());
            line = word;
          } else {
            line = line ? `${line} ${word}` : word;
          }
        }
        clauseText = clauseText ? `${clauseText}, ${line}` : line;
      }
      current = `${current}${clauseText}`.trim();
      push();
      continue;
    }
    if ((current + ' ' + piece).trim().length > MAX_CHUNK) {
      push();
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
  }
  push();
  return chunks;
}

function voiceScore(voice) {
  const name = String(voice?.name || '').toLowerCase();
  const lang = String(voice?.lang || '').toLowerCase();
  let score = 0;
  if (/natural|premium|enhanced|neural/.test(name)) score += 10;
  if (voice.localService) score += 4;
  if (/^en[-_]/i.test(lang)) score += 5;
  if (/samantha|aria|jenny|google uk english|google us english|daniel|alex|karen|serena|moira|tessa|zira|hazel|ava|guy|female|male/.test(name)) score += 4;
  if (/compact|novelty|eloquence|declamation|whisper|orgasmic|bad|albert|fred/.test(name)) score -= 10;
  return score;
}

function englishVoices() {
  if (!speechSupported()) return [];
  const all = window.speechSynthesis.getVoices() || [];
  const english = all.filter((voice) => /^en/i.test(voice.lang || ''));
  return (english.length ? english : all).slice().sort((a, b) => voiceScore(b) - voiceScore(a));
}

/**
 * @param {string} text  Plain text to speak (use htmlToSpeechText for HTML).
 */
export default function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(() => {
    try {
      return localStorage.getItem('tweack-voice-uri') || '';
    } catch {
      return '';
    }
  });
  const [rate, setRate] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('tweack-speech-rate'));
      return [0.85, 1, 1.15].includes(saved) ? saved : 1;
    } catch {
      return 1;
    }
  });
  const cancelledRef = useRef(false);
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (!speechSupported()) return undefined;
    const load = () => setVoices(englishVoices());
    load();
    const synth = window.speechSynthesis;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', load);
    } else if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = load;
    }
    const timer = setTimeout(load, 600); // Safari sometimes fires late
    return () => {
      clearTimeout(timer);
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', load);
      }
      synth.cancel();
    };
  }, []);

  useEffect(() => {
    try {
      if (voiceURI) localStorage.setItem('tweack-voice-uri', voiceURI);
      localStorage.setItem('tweack-speech-rate', String(rate));
    } catch {
      /* storage may be disabled */
    }
  }, [voiceURI, rate]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (speechSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!speechSupported()) return;
      cancelledRef.current = false;
      const chunks = splitIntoChunks(text);
      if (!chunks.length) return;

      const synth = window.speechSynthesis;
      const available = englishVoices();
      const effectiveURI = available.some((item) => item.voiceURI === voiceURI)
        ? voiceURI
        : available[0]?.voiceURI || '';
      const voice = available.find((item) => item.voiceURI === effectiveURI) || null;

      // Cancel any previous speech first. iOS only allows speech started from
      // a real user gesture, so on the first tap we immediately speak a tiny
      // utterance inside that gesture to unlock the engine.
      synth.cancel();
      if (!unlockedRef.current) {
        unlockedRef.current = true;
        try {
          synth.speak(new SpeechSynthesisUtterance(' '));
        } catch {
          /* ignore */
        }
      }
      setSpeaking(true);
      setPaused(false);

      let index = 0;
      const speakNext = () => {
        if (cancelledRef.current) return;
        if (index >= chunks.length) {
          setSpeaking(false);
          setPaused(false);
          return;
        }
        const piece = chunks[index++];
        const utterance = new SpeechSynthesisUtterance(piece);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-US';
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;

        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          clearTimeout(watchdog);
          if (cancelledRef.current) return;
          // A short gap between chunks sounds more natural and gives mobile
          // browsers time to reset their speech engine.
          setTimeout(speakNext, 90);
        };
        const watchdog = setTimeout(
          finish,
          Math.max(6000, (piece.length / 11) * 1000 + 5000),
        );

        utterance.onend = finish;
        utterance.onerror = finish;
        // Chrome Android occasionally pauses itself after cancel() — resume
        // before speaking the next chunk.
        if (synth.paused) {
          try {
            synth.resume();
          } catch {
            /* ignore */
          }
        }
        // A tiny delay after cancel() is required by iOS before speaking.
        setTimeout(() => {
          if (!cancelledRef.current) {
            try {
              synth.speak(utterance);
            } catch {
              finish();
            }
          }
        }, 40);
      };

      setTimeout(speakNext, 120);
    },
    [voiceURI, rate],
  );

  const togglePause = useCallback(() => {
    if (!speechSupported() || !speaking) return;
    try {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
    } catch {
      /* some browsers do not support pause — leave state unchanged */
    }
  }, [paused, speaking]);

  const selectedVoice = voices.find((item) => item.voiceURI === voiceURI) || null;
  const effectiveVoiceURI = voices.some((item) => item.voiceURI === voiceURI)
    ? voiceURI
    : voices[0]?.voiceURI || '';

  return {
    supported: speechSupported(),
    speaking,
    paused,
    voices,
    voice: selectedVoice,
    voiceURI: effectiveVoiceURI,
    setVoiceURI,
    rate,
    setRate,
    speak,
    stop,
    togglePause,
  };
}
