import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/Icon';

// ── Turlar ──────────────────────────────────────────────────
interface AudioRecorderProps {
  /** Ovozli xabar yozib bo'lganda chaqiriladi — Blob va davomiyligi (soniyada) */
  onRecorded: (blob: Blob, durationSec: number) => void;
  /** Yozish jarayonida bo'lsa true */
  disabled?: boolean;
}

// ── AudioRecorder komponenti ────────────────────────────────
/**
 * Mikrofon tugmasi:
 * - Bosib turish = yozish boshlash
 * - Qo'yib yuborish = yozishni tugatish va yuborish
 * - Yozish paytida qizil pulsatsiya + davomiylik ko'rinadi
 */
export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Yozishni boshlash
  const startRecording = useCallback(async () => {
    if (disabled || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // MediaRecorder MIME turini aniqlash
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSec = (Date.now() - startTimeRef.current) / 1000;

        // Juda qisqa yozuvlarni (0.5 sekunddan kam) yubormaymiz
        if (durationSec >= 0.5) {
          onRecorded(blob, durationSec);
        }

        // Oqimni to'xtatish
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      startTimeRef.current = Date.now();
      setDuration(0);
      setRecording(true);
      mediaRecorder.start(100); // Har 100ms da ma'lumot olish

      // Davomiylikni yangilash
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch {
      // Mikrofon ruxsati yo'q yoki qurilma topilmadi
      console.warn('Mikrofon ruxsati berilmadi');
    }
  }, [disabled, recording, onRecorded]);

  // Yozishni to'xtatish
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRecording(false);
    setDuration(0);
  }, []);

  // Komponent unmount bo'lganda tozalash
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Vaqtni formatlash (00:05 ko'rinishida)
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative flex items-center">
      {/* Yozish paytidagi holat ko'rsatkichi */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="absolute right-14 flex items-center gap-2 bg-error/10 px-3 py-1.5 rounded-full"
          >
            {/* Qizil nuqta — pulsatsiya */}
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2.5 h-2.5 rounded-full bg-error"
            />
            <span className="text-label-sm font-label-sm text-error font-mono tabular-nums">
              {formatTime(duration)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mikrofon tugmasi */}
      <motion.button
        onPointerDown={(e) => {
          // Faqat asosiy tugma (sichqoncha chap yoki touch)
          if (e.button !== 0) return;
          e.preventDefault();
          startRecording();
        }}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording} // Barmoqni siljitsa ham to'xtatish
        disabled={disabled}
        whileTap={{ scale: 0.85 }}
        aria-label={recording ? "Yozishni to'xtatish" : 'Ovozli xabar yozish'}
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${
          recording
            ? 'bg-error text-on-error shadow-lg shadow-error/30'
            : 'bg-surface-container text-primary'
        } press disabled:opacity-50`}
      >
        <Icon
          name={recording ? 'stop' : 'mic'}
          className="text-[22px]"
        />
      </motion.button>
    </div>
  );
}

// ── AudioWaveform — ovozli xabar bubble'ida ko'rinish ───────
interface AudioWaveformProps {
  /** Ovozli xabar URL'i */
  src: string;
  /** Davomiylik (soniyada) */
  duration?: number;
  /** O'z xabari yoki boshqaniki */
  mine?: boolean;
}

/**
 * Ovozli xabar o'ynatgich: waveform ko'rinishi + play/pause tugmasi.
 * Haqiqiy audio data'dan waveform chizadi.
 */
export function AudioWaveform({ src, duration = 0, mine }: AudioWaveformProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>();

  // Audio elementini yaratish
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [src]);

  // Progress yangilash
  useEffect(() => {
    const tick = () => {
      if (audioRef.current && playing) {
        const pct = audioRef.current.currentTime / (audioRef.current.duration || 1);
        setProgress(pct);
        animRef.current = requestAnimationFrame(tick);
      }
    };

    if (playing) {
      animRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing]);

  // Play/Pause
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  // Vaqtni formatlash
  const formatDur = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  // Statik waveform chizish (tasodifiy balandliklar — haqiqiy audio emas, lekin vizual yaxshi)
  const bars = 24;
  const barHeights = useRef(
    Array.from({ length: bars }, () => 0.2 + Math.random() * 0.8),
  ).current;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      {/* Play/Pause tugmasi */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          mine
            ? 'bg-on-primary/20 text-on-primary'
            : 'bg-primary/15 text-primary'
        }`}
      >
        <Icon name={playing ? 'pause' : 'play_arrow'} fill className="text-[20px]" />
      </motion.button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-[2px] h-8">
        {barHeights.map((h, i) => {
          const filled = i / bars <= progress;
          return (
            <motion.div
              key={i}
              className={`flex-1 rounded-full transition-colors duration-150 ${
                filled
                  ? mine
                    ? 'bg-on-primary'
                    : 'bg-primary'
                  : mine
                    ? 'bg-on-primary/30'
                    : 'bg-on-surface/20'
              }`}
              style={{ height: `${h * 100}%` }}
              initial={false}
              animate={
                playing && filled
                  ? { scaleY: [1, 1.2, 1], transition: { duration: 0.4 } }
                  : {}
              }
            />
          );
        })}
      </div>

      {/* Davomiylik */}
      <span
        className={`text-[10px] font-mono tabular-nums shrink-0 ${
          mine ? 'text-on-primary/70' : 'text-on-surface-variant/70'
        }`}
      >
        {playing && audioRef.current
          ? formatDur(audioRef.current.currentTime)
          : formatDur(duration)}
      </span>
    </div>
  );
}
