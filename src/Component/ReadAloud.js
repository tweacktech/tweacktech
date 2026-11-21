import React, { useEffect } from 'react';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import useSpeech, { htmlToSpeechText } from '../lib/useSpeech';

/**
 * "Start reading" control. Uses the browser's own speech engine — free,
 * offline and available on every modern phone browser.
 */
const ReadAloud = ({ html, lessonId, compact = false }) => {
  const {
    supported,
    speaking,
    paused,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    speak,
    stop,
    togglePause,
  } = useSpeech();

  // Never keep reading a previous lesson after the student navigates.
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  if (!supported) return null;

  const start = () => speak(htmlToSpeechText(html));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={speaking ? stop : start}
        className={compact ? 'btn-secondary !py-1.5 text-xs' : 'btn-secondary !py-1.5 text-xs'}
        aria-label={speaking ? 'Stop reading' : 'Start reading'}
      >
        {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        {speaking ? 'Stop reading' : 'Start reading'}
      </button>

      {speaking && (
        <button
          type="button"
          onClick={togglePause}
          className="btn-secondary !py-1.5 text-xs"
          aria-label={paused ? 'Resume reading' : 'Pause reading'}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
      )}

      {voices.length > 1 && (
        <select
          value={voiceURI}
          onChange={(event) => setVoiceURI(event.target.value)}
          className="input-field !w-auto max-w-full !py-1.5 text-xs"
          aria-label="Reading voice"
          title="Choose a voice installed on your device"
        >
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      )}

      <select
        value={rate}
        onChange={(event) => setRate(Number(event.target.value))}
        className="input-field !w-auto !py-1.5 text-xs"
        aria-label="Reading speed"
        title="Reading speed"
      >
        <option value={0.85}>Slow</option>
        <option value={1}>Normal</option>
        <option value={1.15}>Fast</option>
      </select>
    </div>
  );
};

export default ReadAloud;
