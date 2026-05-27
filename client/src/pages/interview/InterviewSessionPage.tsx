// 파일 목적: InterviewSessionPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/interview/InterviewSessionPage.tsx
// 디자인: 포트폴리오 스타일 (다크/라이트 테마 대응)

import { ArrowLeft, CheckCircle, Mic, MicOff, SkipForward, StopCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../types/question';
import {
  createInterviewSession,
  endInterviewSession,
  fetchRandomQuestion,
  getAccessToken,
  getStoredUser,
  mapTopicToServer,
  postAnswer,
  postInterviewTurn,
} from '../../lib/api';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../../components/theme/ThemeToggle';

// 1. WebM Blob을 진짜 WAV Blob으로 변환하는 함수 (CLOVA 최적화: 16kHz 고정)
async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const wavBuffer = audioBufferToWav(audioBuffer);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// 2. AudioBuffer를 WAV 포맷의 ArrayBuffer로 만들어주는 헬퍼 함수
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let sample, offset = 0, pos = 0;

  // 함수 목적: uint16를 설정한다.
  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  // 함수 목적: uint32를 설정한다.
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // WAV 헤더 작성
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // PCM 데이터 작성
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return arrayBuffer;
}

const requestStt = async (blob: Blob): Promise<string> => {
  // webm은 CLOVA STT 미지원 → WAV로 변환
  let uploadBlob = blob;
  if (blob.type.includes('webm') || blob.type.includes('ogg')) {
    try {
      uploadBlob = await convertWebmToWav(blob);
    } catch (e) {
      console.warn('[STT] WAV conversion failed, using original blob', e);
      uploadBlob = blob;
    }
  }

  const form = new FormData();
  const file = new File([uploadBlob], 'record.wav', { type: 'audio/wav' });

  form.append('file', file);
  form.append('language', 'ko-KR');

  const token = getAccessToken();
  const res = await fetch('/api/stt/recognize', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const err = await res.json().catch(() => null);
      console.error('[STT error response]', err);
      throw new Error(err?.message ?? err?.detail ?? 'STT 요청 실패');
    }
    const text = await res.text().catch(() => 'STT 요청 실패');
    console.error('[STT error text]', text);
    throw new Error(text);
  }

  const data = await res.json();

  const text =
      data?.text ??
      data?.result?.text ??
      data?.result?.transcript ??
      data?.result ??
      data?.transcript ??
      data?.data?.text ??
      data?.data?.transcript ??
      '';

  const normalized = String(text ?? '').trim();

  if (!normalized) {
    throw new Error(`STT 응답에 유효한 text가 없습니다: ${JSON.stringify(data)}`);
  }

  return normalized;
};

type SessionState = 'question' | 'recording' | 'processing' | 'review' | 'result';
const AUTO_NEXT_DELAY_MS = 5 * 60 * 1000;

type TurnLog = { questionText: string; transcript: string; score: number; feedback: string; topic: string };

// ── 스코어 색상 (CSS 변수 기반) ──
const scoreAccent = (s: number) => {
  if (s >= 85) return { color: 'var(--green)',  bg: 'rgba(34,211,160,0.1)',  border: 'rgba(34,211,160,0.25)' };
  if (s >= 70) return { color: 'var(--accent)',  bg: 'rgba(79,124,255,0.1)',  border: 'rgba(79,124,255,0.25)' };
  if (s >= 50) return { color: 'var(--amber)',   bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' };
  return           { color: '#ef4444',           bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  };
};

// 함수 목적: InterviewSession 컴포넌트를 렌더링한다.
export function InterviewSession() {
  const navigate  = useNavigate();
  const params    = useParams();
  const category  = params.category ?? '';
  const location  = useLocation();
  const locState  = (location.state as { difficulty?: number | null; serverTopic?: string } | null) ?? {};
  const difficulty = locState.difficulty ?? null;

  const [user] = useState(() => getStoredUser());

  useEffect(() => { if (!category) navigate('/dashboard', { replace: true }); }, [category, navigate]);

  const [state,              setState]              = useState<SessionState>('question');
  const [sessionId,          setSessionId]          = useState<number | null>(null);
  const [currentQuestion,    setCurrentQuestion]    = useState<Question | null>(null);
  const [currentQuestionId,  setCurrentQuestionId]  = useState<number | null>(null);
  const [answeredQuestion,   setAnsweredQuestion]   = useState<Question | null>(null);
  const [nextQuestion,       setNextQuestion]       = useState<Question | null>(null);
  const [isRecording,        setIsRecording]        = useState(false);
  const [recordingTime,      setRecordingTime]      = useState(0);
  const [transcript,         setTranscript]         = useState('');
  const [score,              setScore]              = useState(0);
  const [feedback,           setFeedback]           = useState('');
  const [isEditingTranscript,setIsEditingTranscript]= useState(false);
  const [turnLogs,           setTurnLogs]           = useState<TurnLog[]>([]);
  const [audioBlob,          setAudioBlob]          = useState<Blob | null>(null);
  const [audioUrl,           setAudioUrl]           = useState('');
  const [recordError,        setRecordError]        = useState('');
  const [sttLoading,         setSttLoading]         = useState(false);
  const [evalLoading,        setEvalLoading]        = useState(false);
  const [sttError,           setSttError]           = useState('');
  const [autoNextLeftMs,     setAutoNextLeftMs]     = useState<number | null>(null);

  const pendingExitRef          = useRef<null | 'quit' | 'score'>(null);
  const pendingExitTargetRef    = useRef<'/history' | '/dashboard'>('/history');
  const autoNextTimeoutRef      = useRef<number | null>(null);
  const autoNextTickTimeoutRef  = useRef<number | null>(null);
  const timerRef                = useRef<number | null>(null);
  const streamRef               = useRef<MediaStream | null>(null);
  const recorderRef             = useRef<MediaRecorder | null>(null);
  const chunksRef               = useRef<BlobPart[]>([]);

  // 함수 목적: pick best mime type 로직을 구현한다.
  const pickBestMimeType = () => {
    const candidates = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];
    // 함수 목적: supported 여부를 확인한다.
    const isSupported = (m: string) =>
        typeof MediaRecorder !== 'undefined' &&
        typeof (MediaRecorder as any).isTypeSupported === 'function' &&
        (MediaRecorder as any).isTypeSupported(m);
    for (const c of candidates) if (isSupported(c)) return c;
    return '';
  };

  // 함수 목적: build insecure context message 로직을 구현한다.
  const buildInsecureContextMessage = () =>
    `마이크는 HTTPS(또는 localhost) 접속에서만 사용할 수 있습니다. 현재 주소: ${window.location.origin}`;

  const getMicStartErrorMessage = (error: unknown): string => {
    const err = error as { name?: string; message?: string } | undefined;
    const name = err?.name ?? '';
    const message = err?.message ?? '';

    if (message.includes('HTTPS(또는 localhost)')) return message;
    if (!window.isSecureContext) return buildInsecureContextMessage();

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return '마이크 권한이 차단되었습니다. 브라우저 주소창의 권한 설정에서 마이크를 허용해 주세요.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return '사용 가능한 마이크 장치를 찾을 수 없습니다. 마이크 연결 상태를 확인해 주세요.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return '마이크가 다른 앱에서 사용 중입니다. 다른 앱을 종료한 뒤 다시 시도해 주세요.';
    }
    if (name === 'SecurityError') {
      return '브라우저 보안 정책으로 마이크 접근이 차단되었습니다.';
    }
    if (message) return message;
    return '마이크 접근에 실패했습니다. 브라우저/권한 설정을 확인해 주세요.';
  };
  // 함수 목적: stop tracks 로직을 구현한다.
  const stopTracks = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  // 함수 목적: ms to min sec를 포맷한다.
  const formatMsToMinSec = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };
  // 함수 목적: time를 포맷한다.
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (autoNextTimeoutRef.current) window.clearTimeout(autoNextTimeoutRef.current);
    if (autoNextTickTimeoutRef.current) window.clearTimeout(autoNextTickTimeoutRef.current);
  }, [audioUrl]);

  useEffect(() => {
    // 함수 목적: run 로직을 구현한다.
    const run = async () => {
      if (!user?.id) return;
      try {
        const res = await createInterviewSession({ userId: user.id, topic: mapTopicToServer(category), difficulty });
        setSessionId(res.sessionId);
      } catch { setSessionId(null); }
    };
    void run();
  }, [category, user?.id]);

  // 함수 목적: reset for new question 로직을 구현한다.
  const resetForNewQuestion = () => {
    setState('question'); setTranscript(''); setScore(0); setFeedback('');
    setRecordingTime(0); setAutoNextLeftMs(null); setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl('');
    setRecordError(''); setSttLoading(false); setEvalLoading(false);
    setSttError(''); setIsEditingTranscript(false);
    setAnsweredQuestion(null); setNextQuestion(null);
  };

  // 함수 목적: load question 로직을 구현한다.
  const loadQuestion = async () => {
    resetForNewQuestion();
    const q = await fetchRandomQuestion(mapTopicToServer(category), difficulty);
    setCurrentQuestionId(q.id);
    setCurrentQuestion(q);
  };

  useEffect(() => {
    loadQuestion().catch(() => { setCurrentQuestion(null); setCurrentQuestionId(null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const normalizeNextQuestion = async (next: any): Promise<Question | null> => {
    const qt = (next?.questionText ?? '').toString().trim();
    if (!qt) return null;
    return {
      ...(next as Partial<Question>),
      id: typeof next?.id === 'number' ? next.id : -1,
      questionText: qt,
      modelAnswer: typeof next?.modelAnswer === 'string' && next.modelAnswer.trim()
          ? next.modelAnswer : '생성형 질문입니다. 모범답안이 제공되지 않습니다.',
      requiredKeywords: Array.isArray(next?.requiredKeywords) ? next.requiredKeywords : [],
      optionalKeywords: Array.isArray(next?.optionalKeywords) ? next.optionalKeywords : [],
    };
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [isRecording]);

  // 함수 목적: start recording 처리를 담당한다.
  const handleStartRecording = async () => {
    setIsRecording(true); setRecordingTime(0); setState('recording');
    setRecordError(''); setTranscript(''); setAudioBlob(null); setAutoNextLeftMs(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl('');
    chunksRef.current = []; setSttLoading(false); setEvalLoading(false); setSttError('');

    try {
      if (!window.isSecureContext) throw new Error(buildInsecureContextMessage());
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저 환경에서는 마이크 API를 사용할 수 없습니다.');
      if (typeof MediaRecorder === 'undefined') throw new Error('이 브라우저는 MediaRecorder를 지원하지 않습니다.');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      const mimeType = pickBestMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setRecordError('녹음 중 오류가 발생했습니다.');
        setIsRecording(false);
        setState('question');
        stopTracks();
      };

      recorder.onstop = () => {
        const finalType = mimeType || chunksRef.current.find(Boolean)?.type || 'application/octet-stream';
        const blob = new Blob(chunksRef.current, { type: finalType });

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stopTracks();
      };

      recorder.start(500);
    } catch (e: any) {
      console.error('[Recorder start error]', e);
      setRecordError(getMicStartErrorMessage(e));
      setIsRecording(false); setState('question'); stopTracks();
    }
  };

  useEffect(() => {
    if (!audioBlob) return;
    let cancelled = false;
    // 함수 목적: run 로직을 구현한다.
    const run = async () => {
      try {
        setSttLoading(true); setSttError('');
        const text = await requestStt(audioBlob);
        if (cancelled) return;
        if (!text) throw new Error('STT 결과가 비어있습니다.');
        setTranscript(text); setIsEditingTranscript(false); setState('review');
        if (pendingExitRef.current && !cancelled) {
          const mode = pendingExitRef.current;
          const target = pendingExitTargetRef.current;
          pendingExitRef.current = null;
          pendingExitTargetRef.current = '/history';
          void handleEvaluateTranscript(text, { exitAfterEvaluate: true, exitMode: mode, redirectTo: target });
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error('[STT process error]', e);
        setSttError(e?.message ?? '처리 중 오류가 발생했습니다.');
        setIsRecording(false); setState('question');
      } finally { if (!cancelled) setSttLoading(false); }
    };
    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  // 함수 목적: stop recording 처리를 담당한다.
  const handleStopRecording = () => {
    setIsRecording(false); setSttLoading(true); setEvalLoading(false); setSttError(''); setState('processing');
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
  };

  // 함수 목적: clear auto next 로직을 구현한다.
  const clearAutoNext = () => {
    if (autoNextTimeoutRef.current) window.clearTimeout(autoNextTimeoutRef.current);
    if (autoNextTickTimeoutRef.current) window.clearTimeout(autoNextTickTimeoutRef.current);
    autoNextTimeoutRef.current = null; autoNextTickTimeoutRef.current = null;
  };

  // 함수 목적: go next question 로직을 구현한다.
  const goNextQuestion = async () => {
    clearAutoNext(); resetForNewQuestion();
    if (nextQuestion) { setCurrentQuestion(nextQuestion); setCurrentQuestionId(nextQuestion.id); setState('question'); return; }
    await loadQuestion();
  };

  // 함수 목적: close session and navigate 로직을 구현한다.
  const closeSessionAndNavigate = async (target: '/history' | '/dashboard') => {
    try { if (sessionId != null) await endInterviewSession(sessionId); } catch { /* ignore */ }
    navigate(target);
  };

  const handleEvaluateTranscript = async (
      overrideText?: string,
      opts?: { exitAfterEvaluate?: boolean; exitMode?: 'quit' | 'score'; redirectTo?: '/history' | '/dashboard' },
  ) => {
    if (!user?.id) { navigate('/login', { replace: true }); return; }
    const text = (overrideText ?? transcript ?? '').trim();
    if (!text) { setSttError('답변 텍스트가 비어있습니다.'); setState('review'); return; }
    clearAutoNext();
    try {
      setEvalLoading(true); setSttLoading(false); setSttError(''); setState('processing');
      const serverTopic = mapTopicToServer(category);
      const qid = currentQuestionId ?? currentQuestion?.id ?? -1;
      const payload: any = { userId: user.id, sessionId: sessionId ?? undefined, questionId: qid, topic: serverTopic, transcript: text };
      if (qid <= 0) {
        payload.questionText = (currentQuestion?.questionText ?? '').trim();
        payload.modelAnswer  = currentQuestion?.modelAnswer ?? '';
        payload.requiredKeywords = currentQuestion?.requiredKeywords ?? [];
        payload.optionalKeywords = currentQuestion?.optionalKeywords ?? [];
        payload.generated = true;
      }
      const turnRes = await postInterviewTurn(payload);
      setAnsweredQuestion(currentQuestion);
      setTranscript(text); setScore(turnRes.evaluation.score); setFeedback(turnRes.evaluation.feedback);
      setTurnLogs(prev => [...prev, { questionText: currentQuestion?.questionText ?? '', transcript: text, score: turnRes.evaluation.score, feedback: turnRes.evaluation.feedback, topic: serverTopic }]);
      if (qid > 0) {
        try { await postAnswer({ userId: user.id, questionId: qid, topic: serverTopic, userAnswer: text, score: turnRes.evaluation.score, feedback: turnRes.evaluation.feedback }); } catch { /* ignore */ }
      }
      if (opts?.exitAfterEvaluate) {
        await closeSessionAndNavigate(opts.redirectTo ?? '/history'); return;
      }
      setNextQuestion(await normalizeNextQuestion(turnRes.nextQuestion));
      setState('result');
      setAutoNextLeftMs(AUTO_NEXT_DELAY_MS);
      const startAt = Date.now();
      // 함수 목적: tick 로직을 구현한다.
      const tick = () => {
        const left = Math.max(0, AUTO_NEXT_DELAY_MS - (Date.now() - startAt));
        setAutoNextLeftMs(left);
        if (left > 0) autoNextTickTimeoutRef.current = window.setTimeout(tick, 250);
      };
      autoNextTickTimeoutRef.current = window.setTimeout(tick, 250);
      autoNextTimeoutRef.current = window.setTimeout(() => void goNextQuestion(), AUTO_NEXT_DELAY_MS);
    } catch (e: any) {
      setSttError(e?.message ?? '채점 중 오류가 발생했습니다.'); setState('review');
    } finally { setEvalLoading(false); }
  };

  // 함수 목적: quit interview 처리를 담당한다.
  const handleQuitInterview = async () => {
    clearAutoNext();
    if (state === 'recording') { pendingExitRef.current = 'quit'; pendingExitTargetRef.current = '/history'; handleStopRecording(); return; }
    if (state === 'processing') { pendingExitRef.current = 'quit'; pendingExitTargetRef.current = '/history'; return; }
    if (state === 'review' && (transcript ?? '').trim()) { await handleEvaluateTranscript(undefined, { exitAfterEvaluate: true, exitMode: 'quit', redirectTo: '/history' }); return; }
    await closeSessionAndNavigate('/history');
  };

  // 함수 목적: score so far 처리를 담당한다.
  const handleScoreSoFar = async () => {
    clearAutoNext();
    if (state === 'recording') { pendingExitRef.current = 'score'; pendingExitTargetRef.current = '/history'; handleStopRecording(); return; }
    if (state === 'processing') { pendingExitRef.current = 'score'; pendingExitTargetRef.current = '/history'; return; }
    if (state === 'review' && (transcript ?? '').trim()) { await handleEvaluateTranscript(undefined, { exitAfterEvaluate: true, exitMode: 'score', redirectTo: '/history' }); return; }
    await closeSessionAndNavigate('/history');
  };

  // 함수 목적: back to dashboard 처리를 담당한다.
  const handleBackToDashboard = async () => {
    clearAutoNext();
    if (state === 'recording') { pendingExitRef.current = 'quit'; pendingExitTargetRef.current = '/dashboard'; handleStopRecording(); return; }
    if (state === 'processing') { pendingExitRef.current = 'quit'; pendingExitTargetRef.current = '/dashboard'; return; }
    if (state === 'review' && (transcript ?? '').trim()) {
      await handleEvaluateTranscript(undefined, { exitAfterEvaluate: true, exitMode: 'quit', redirectTo: '/dashboard' });
      return;
    }
    await closeSessionAndNavigate('/dashboard');
  };

  if (!currentQuestion) {
    return (
        <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text3)' }}>loading...</div>
        </div>
    );
  }

  const resultQuestion = answeredQuestion ?? currentQuestion;
  const mergedKeywords = [...(resultQuestion.requiredKeywords ?? []), ...(resultQuestion.optionalKeywords ?? [])];
  const sc = scoreAccent(score);

  const card: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '1.75rem 2rem',
  };
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.65rem',
    color: 'var(--accent)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '0.4rem',
  };

  return (
      <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

        <div className="glow-blob glow-blob-primary"   style={{ top: '-80px', left: '30%' }} />
        <div className="glow-blob glow-blob-secondary" style={{ bottom: '0', right: '-60px' }} />

        <header className="itpt-header">
          <button
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '0.875rem', fontFamily: 'Noto Sans KR, sans-serif' }}
              onClick={() => void handleBackToDashboard()}
          >
            <ArrowLeft size={16} /> 돌아가기
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="tag blue" style={{ fontSize: '0.72rem' }}>{category}</span>

            {difficulty != null && difficulty > 0 && (
                <span
                    className="tag"
                    style={{
                      fontSize: '0.72rem',
                      background: difficulty === 1 ? 'rgba(34,211,160,0.12)' : difficulty === 2 ? 'rgba(79,124,255,0.12)' : 'rgba(236,72,153,0.12)',
                      color: difficulty === 1 ? 'var(--green)' : difficulty === 2 ? 'var(--accent)' : '#ec4899',
                      border: `1px solid ${difficulty === 1 ? 'rgba(34,211,160,0.3)' : difficulty === 2 ? 'rgba(79,124,255,0.3)' : 'rgba(236,72,153,0.3)'}`,
                    }}
                >
              {difficulty === 1 ? 'Lv.1 쉬움' : difficulty === 2 ? 'Lv.2 보통' : 'Lv.3 어려움'}
            </span>
            )}

            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text3)' }}>
            {turnLogs.length}문항 완료
          </span>

            <ThemeToggle size="sm" />

            <button className="btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
                    onClick={() => void handleScoreSoFar()}>
              지금까지 채점하기
            </button>

            <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => void handleQuitInterview()}
            >
              <StopCircle size={13} /> 그만하기
            </button>
          </div>
        </header>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto', padding: '3.5rem 2rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={card}>
            <p style={sectionLabel}>// QUESTION {turnLogs.length + 1}</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: state !== 'question' ? 0 : '1.5rem' }}>
              {currentQuestion.questionText}
            </p>

            {state === 'question' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {recordError && (
                      <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#ef4444' }}>
                        {recordError}
                      </div>
                  )}
                  <button className="btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '0.95rem' }}
                          onClick={() => void handleStartRecording()}>
                    <Mic size={18} /> 답변 시작
                  </button>
                </div>
            )}
          </div>

          {state === 'recording' && (
              <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}>
                  <Mic size={28} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recording</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#ef4444,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {formatTime(recordingTime)}
                </p>
                <button
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 2rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={handleStopRecording}>
                  <MicOff size={16} /> 녹음 완료
                </button>
                {recordError && (
                    <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#ef4444' }}>
                      {recordError}
                    </div>
                )}
              </div>
          )}

          {state === 'processing' && (
              <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={sectionLabel}>
                  {sttLoading ? '// STT 변환 중' : evalLoading ? '// AI 채점 중' : '// 처리 중'}
                </p>
                <p style={{ color: 'var(--text2)', fontSize: '0.88rem', fontWeight: 300 }}>
                  {sttLoading ? '음성을 텍스트로 변환하고 있습니다' : evalLoading ? 'AI가 답변을 채점하고 있습니다' : '잠시만 기다려 주세요'}
                </p>
                {sttError && (
                    <div style={{ width: '100%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--amber)' }}>
                      {sttError}
                    </div>
                )}
                {audioUrl && (
                    <div style={{ width: '100%', marginTop: '0.5rem' }}>
                      <p style={{ ...sectionLabel, marginBottom: '0.6rem' }}>// 녹음 확인</p>
                      <audio style={{ width: '100%' }} controls src={audioUrl} />
                    </div>
                )}
              </div>
          )}

          {state === 'review' && (
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={sectionLabel}>// STT RESULT</p>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>STT 변환 결과</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 300 }}>오타가 있으면 수정 후 채점하세요.</p>
                  </div>
                  <button className="btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                          onClick={() => setIsEditingTranscript(v => !v)}>
                    {isEditingTranscript ? '수정 종료' : '수정'}
                  </button>
                </div>

                {sttError && (
                    <div style={{ marginBottom: '1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--amber)' }}>
                      {sttError}
                    </div>
                )}

                {isEditingTranscript ? (
                    <textarea
                        value={transcript}
                        onChange={e => setTranscript(e.target.value)}
                        style={{ width: '100%', minHeight: '160px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 300, resize: 'vertical', outline: 'none' }}
                        placeholder="STT 결과를 수정해 주세요."
                    />
                ) : (
                    <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.8, whiteSpace: 'pre-wrap', minHeight: '100px' }}>
                      {transcript}
                    </div>
                )}

                {audioUrl && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ ...sectionLabel, marginBottom: '0.5rem' }}>// 녹음 확인</p>
                      <audio style={{ width: '100%' }} controls src={audioUrl} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                          onClick={() => { setTranscript(''); setSttError(''); setIsEditingTranscript(false); setAudioBlob(null); setState('question'); }}>
                    다시 녹음
                  </button>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                          onClick={() => void handleEvaluateTranscript()}>
                    채점하기
                  </button>
                </div>
              </div>
          )}

          {state === 'result' && (
              <>
                <div style={{ ...card, background: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <p style={{ ...sectionLabel, color: sc.color }}>// RESULT</p>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>채점 결과</p>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '3.5rem', letterSpacing: '-0.04em', color: sc.color, lineHeight: 1 }}>
                      {score}<span style={{ fontSize: '1.2rem', fontWeight: 600, marginLeft: '2px' }}>점</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                    <p style={{ ...sectionLabel, marginBottom: '0.5rem' }}>// AI FEEDBACK</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.8 }}>{feedback}</p>
                    {autoNextLeftMs != null && (
                        <p style={{ marginTop: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text3)' }}>
                          {formatMsToMinSec(autoNextLeftMs)} 후 자동으로 다음 질문으로 이동합니다
                        </p>
                    )}
                  </div>

                  {audioUrl && (
                      <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <p style={{ ...sectionLabel, marginBottom: '0.5rem' }}>// 내 녹음</p>
                        <audio style={{ width: '100%' }} controls src={audioUrl} />
                      </div>
                  )}
                </div>

                <div style={card}>
                  <p style={sectionLabel}>// MY ANSWER</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg3)', borderRadius: '10px', padding: '1rem 1.25rem', marginTop: '0.75rem' }}>
                    {transcript}
                  </p>
                </div>

                <div style={card}>
                  <p style={sectionLabel}>// MODEL ANSWER</p>
                  <pre style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '0.88rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg3)', borderRadius: '10px', padding: '1rem 1.25rem', marginTop: '0.75rem' }}>
                {resultQuestion.modelAnswer || '모범답안이 없습니다.'}
              </pre>
                </div>

                {mergedKeywords.length > 0 && (
                    <div style={card}>
                      <p style={sectionLabel}>// KEY WORDS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {mergedKeywords.map((kw, i) => (
                            <span key={i} style={{ padding: '0.3rem 0.8rem', background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.25)', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--accent2)' }}>
                      {kw}
                    </span>
                        ))}
                      </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                          onClick={() => void goNextQuestion()}>
                    <SkipForward size={15} /> 다음 질문으로
                  </button>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                          onClick={() => void handleBackToDashboard()}>
                    대시보드로
                  </button>
                </div>
              </>
          )}
        </div>

        <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      </div>
  );
}
