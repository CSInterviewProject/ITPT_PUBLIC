// 파일 목적: InterviewQuestionStudyPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpenText, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { fetchRandomQuestion, type ServerQuestion } from '../../lib/api';

type StudyCategory = {
  key: string;
  label: string;
  description: string;
};

type BookmarkItem = {
  id: string;
  topic: string;
  savedAt: string;
  question: ServerQuestion;
};

const BOOKMARK_STORAGE_KEY = 'itpt.study.bookmarks.v1';

const CATEGORIES: StudyCategory[] = [
  { key: 'OS', label: 'OS', description: '운영체제' },
  { key: 'Network', label: 'Network', description: '네트워크' },
  { key: 'Database', label: 'Database', description: '데이터베이스' },
  { key: 'DataStructure', label: 'Data Structure', description: '자료구조' },
  { key: 'Spring', label: 'Spring', description: '스프링' },
  { key: 'JPA', label: 'JPA', description: 'JPA' },
  { key: 'Java', label: 'Java', description: '언어' },
  { key: 'C', label: 'C', description: '언어' },
  { key: 'C++', label: 'C++', description: '언어' },
  { key: 'Python', label: 'Python', description: '언어' },
];

// 함수 목적: make bookmark id 로직을 구현한다.
function makeBookmarkId(topic: string, question: ServerQuestion): string {
  return `${topic}:${question.id}:${question.questionText}`;
}

// 함수 목적: stored bookmark를 파싱한다.
function parseStoredBookmark(raw: unknown): BookmarkItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as BookmarkItem;
  if (typeof candidate.id !== 'string') return null;
  if (typeof candidate.topic !== 'string') return null;
  if (typeof candidate.savedAt !== 'string') return null;
  if (!candidate.question || typeof candidate.question !== 'object') return null;
  if (typeof candidate.question.questionText !== 'string') return null;
  return candidate;
}

// 함수 목적: load bookmarks 로직을 구현한다.
function loadBookmarks(): BookmarkItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseStoredBookmark)
      .filter((item): item is BookmarkItem => item !== null);
  } catch {
    return [];
  }
}

// 함수 목적: save bookmarks 로직을 구현한다.
function saveBookmarks(bookmarks: BookmarkItem[]) {
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
}

// 함수 목적: difficulty label 로직을 구현한다.
function difficultyLabel(difficulty: number) {
  if (difficulty <= 1) return 'Lv.1';
  if (difficulty === 2) return 'Lv.2';
  return 'Lv.3';
}

// 함수 목적: InterviewQuestionStudyPage 컴포넌트를 렌더링한다.
export function InterviewQuestionStudyPage() {
  const navigate = useNavigate();

  const [selectedTopic, setSelectedTopic] = useState<string>(CATEGORIES[0].key);
  const [question, setQuestion] = useState<ServerQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => loadBookmarks());
  const skipAutoLoadRef = useRef(false);

  const activeCategory = useMemo(
    () => CATEGORIES.find(category => category.key === selectedTopic) ?? CATEGORIES[0],
    [selectedTopic]
  );

  const currentBookmarkId = question ? makeBookmarkId(selectedTopic, question) : null;
  const isBookmarked =
    currentBookmarkId != null && bookmarks.some(bookmark => bookmark.id === currentBookmarkId);

  const loadQuestion = useCallback(async (topic: string) => {
    setLoading(true);
    setError('');
    setShowAnswer(false);

    try {
      const nextQuestion = await fetchRandomQuestion(topic);
      setQuestion(nextQuestion);
    } catch (e) {
      const message = e instanceof Error ? e.message : '질문을 불러오지 못했습니다.';
      setQuestion(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipAutoLoadRef.current) {
      skipAutoLoadRef.current = false;
      return;
    }
    void loadQuestion(selectedTopic);
  }, [selectedTopic, loadQuestion]);

  // 함수 목적: toggle bookmark 처리를 담당한다.
  const handleToggleBookmark = () => {
    if (!question) return;

    const bookmarkId = makeBookmarkId(selectedTopic, question);
    const exists = bookmarks.some(bookmark => bookmark.id === bookmarkId);
    const nextBookmarks = exists
      ? bookmarks.filter(bookmark => bookmark.id !== bookmarkId)
      : [
          {
            id: bookmarkId,
            topic: selectedTopic,
            savedAt: new Date().toISOString(),
            question,
          },
          ...bookmarks,
        ];

    setBookmarks(nextBookmarks);
    saveBookmarks(nextBookmarks);
  };

  // 함수 목적: remove bookmark 처리를 담당한다.
  const handleRemoveBookmark = (bookmarkId: string) => {
    const nextBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    setBookmarks(nextBookmarks);
    saveBookmarks(nextBookmarks);
  };

  return (
    <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <div className="glow-blob glow-blob-primary" style={{ top: '-120px', left: '32%' }} />
      <div className="glow-blob glow-blob-secondary" style={{ bottom: '-80px', right: '-60px' }} />

      <header className="itpt-header">
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text2)',
            fontSize: '0.875rem',
            fontFamily: 'Noto Sans KR, sans-serif',
          }}
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} /> 돌아가기
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span className="tag blue">QUESTION STUDY</span>
          <ThemeToggle size="sm" />
        </div>
      </header>

      <div
        className="study-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '3rem 1.5rem 5rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1.25rem',
        }}
      >
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="dark-card anim-1" style={{ padding: '1.5rem' }}>
            <p className="section-label">// STUDY MODE</p>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>면접 질문 공부</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>
              카테고리를 고르고 질문/모범답안을 빠르게 반복 학습하세요.
            </p>
          </div>

          <div className="dark-card anim-2" style={{ padding: '1.25rem' }}>
            <p className="section-label">// CATEGORY FILTER</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.6rem',
              }}
            >
              {CATEGORIES.map(category => {
                const isActive = selectedTopic === category.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedTopic(category.key)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 0.8rem',
                      borderRadius: '10px',
                      border: isActive ? '1px solid rgba(79,124,255,0.45)' : '1px solid var(--border)',
                      background: isActive ? 'rgba(79,124,255,0.12)' : 'var(--bg3)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{category.label}</div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.68rem',
                        color: 'var(--text3)',
                        marginTop: '0.15rem',
                      }}
                    >
                      {category.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dark-card anim-3" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem' }}>
              <div>
                <p className="section-label">// QUESTION CARD</p>
                <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem' }}>{activeCategory.label}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                  {question ? difficultyLabel(question.difficulty) : '질문 로드 중'}
                </p>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => void loadQuestion(selectedTopic)}
                disabled={loading}
              >
                <RefreshCw size={14} /> 다음 문제
              </button>
            </div>

            <div
              style={{
                marginTop: '1rem',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem 1.1rem',
                minHeight: '120px',
              }}
            >
              {loading && (
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>질문을 불러오는 중입니다...</p>
              )}

              {!loading && error && (
                <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>오류: {error}</p>
              )}

              {!loading && !error && question && (
                <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.75 }}>
                  {question.questionText}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                onClick={() => setShowAnswer(prev => !prev)}
                disabled={!question || loading}
              >
                <BookOpenText size={14} /> {showAnswer ? '답변 가리기' : '답변 보기'}
              </button>

              <button
                className="btn-ghost"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                onClick={handleToggleBookmark}
                disabled={!question || loading}
              >
                {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isBookmarked ? '북마크 해제' : '북마크 저장'}
              </button>
            </div>

            {showAnswer && question && (
              <div
                style={{
                  marginTop: '0.9rem',
                  background: 'rgba(34,211,160,0.08)',
                  border: '1px solid rgba(34,211,160,0.24)',
                  borderRadius: '12px',
                  padding: '1rem 1.1rem',
                }}
              >
                <p className="section-label" style={{ marginBottom: '0.4rem', color: 'var(--green)' }}>
                  // 모범 답안
                </p>
                <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {question.modelAnswer || '모범답안이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="dark-card anim-4" style={{ padding: '1.25rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="section-label">// BOOKMARK</p>
              <h3 style={{ color: 'var(--text)' }}>북마크</h3>
            </div>
            <span className="tag">{bookmarks.length}개</span>
          </div>

          <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {bookmarks.length === 0 && (
              <p style={{ fontSize: '0.84rem', color: 'var(--text3)' }}>저장된 질문이 없습니다.</p>
            )}

            {bookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.7rem',
                }}
              >
                <button
                  onClick={() => {
                    skipAutoLoadRef.current = bookmark.topic !== selectedTopic;
                    setSelectedTopic(bookmark.topic);
                    setQuestion(bookmark.question);
                    setShowAnswer(false);
                    setError('');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.2rem' }}>
                    {bookmark.topic}
                  </div>
                  <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {bookmark.question.questionText}
                  </div>
                </button>
                <button
                  onClick={() => handleRemoveBookmark(bookmark.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    padding: 0,
                  }}
                >
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .study-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
