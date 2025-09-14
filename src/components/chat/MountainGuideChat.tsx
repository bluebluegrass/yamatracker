'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type Mountain = {
  id: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  region: string;
  difficulty: string | null;
  elevation_m: number | null;
};

type Suggestion = { mountain_id: string; title?: string; reason?: string };

export default function MountainGuideChat({
  locale,
  completedIds,
  mountains,
  onClose,
}: {
  locale: 'en' | 'ja' | 'zh';
  completedIds: string[];
  mountains: Mountain[];
  onClose?: () => void;
}) {
  const t = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const mountainById = useMemo(() => {
    const m = new Map<string, Mountain>();
    for (const x of mountains) m.set(x.id, x as Mountain);
    return m;
  }, [mountains]);

  const displayName = (m: Mountain | undefined) => {
    if (!m) return '';
    return locale === 'ja' ? m.name_ja : locale === 'zh' ? m.name_zh : m.name_en;
  };

  // Quick filter chips state
  const REGION_KEYS = ['北海道','東北','関東','中部','関西','中国','四国','九州'] as const;
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const toggleRegion = (r: string) =>
    setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const STAR_KEYS = ['★','★★','★★★','★★★★','★★★★★'] as const;
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const toggleStar = (s: string) =>
    setSelectedStars(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  type Season = 'spring' | 'summer' | 'autumn' | 'winter';
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const SEASONS: { key: Season; label: string }[] = useMemo(() => {
    if (locale === 'ja') return [
      { key: 'spring', label: '春' },
      { key: 'summer', label: '夏' },
      { key: 'autumn', label: '秋' },
      { key: 'winter', label: '冬' },
    ];
    if (locale === 'zh') return [
      { key: 'spring', label: '春' },
      { key: 'summer', label: '夏' },
      { key: 'autumn', label: '秋' },
      { key: 'winter', label: '冬' },
    ];
    return [
      { key: 'spring', label: 'Spring' },
      { key: 'summer', label: 'Summer' },
      { key: 'autumn', label: 'Autumn' },
      { key: 'winter', label: 'Winter' },
    ];
  }, [locale]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setLoading(true);

    // Clear previous suggestions to avoid visual confusion with new turn
    setSuggestions(null);

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    // Scroll to bottom immediately after adding the user message
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          completed_ids: completedIds,
          messages: newMessages.filter(m => m.role === 'user').slice(-5),
          preferences: {
            regions: selectedRegions.length ? selectedRegions : undefined,
            difficulty: selectedStars.length ? selectedStars : undefined,
            season: selectedSeason ?? undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || '暂时无法获取推荐结果，请稍后再试。';
        // Render as assistant message instead of red error to keep the flow
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
        return;
      }

      const s: Suggestion[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(s);

      if (s.length === 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: t('chat.noResults') }]);
        return;
      }

      // Add a brief assistant summary message
      const lines = s.map((it, idx) => {
        const m = mountainById.get(it.mountain_id);
        const name = displayName(m) || it.mountain_id;
        return `${idx + 1}. ${name}${it.title ? ` — ${it.title}` : ''}`;
      });
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: lines.length ? `Here are some options:\n${lines.join('\n')}` : 'I could not find a good match. Try adjusting your preferences.',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold text-gray-800">{t('chat.title')}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {/* Quick Filters */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">{t('chat.region')}</span>
            {REGION_KEYS.map((rk) => (
              <button
                key={rk}
                onClick={() => toggleRegion(rk)}
                className={`px-2 py-1 rounded-full text-xs border ${selectedRegions.includes(rk) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                {t?.(`regions.${rk}` as any) ?? rk}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">{t('chat.difficulty')}</span>
            {STAR_KEYS.map((s) => (
              <button
                key={s}
                onClick={() => toggleStar(s)}
                className={`px-2 py-1 rounded-full text-xs border ${selectedStars.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
                aria-pressed={selectedStars.includes(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">{t('chat.season')}</span>
            {SEASONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedSeason(prev => prev === s.key ? null : s.key)}
                className={`px-2 py-1 rounded-full text-xs border ${selectedSeason === s.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
                aria-pressed={selectedSeason === s.key}
              >
                {s.label}
              </button>
            ))}
            {(selectedRegions.length || selectedStars.length || selectedSeason) ? (
              <button
                onClick={() => { setSelectedRegions([]); setSelectedStars([]); setSelectedSeason(null); }}
                className="ml-2 px-2 py-1 rounded-full text-xs border bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                {t('chat.clear')}
              </button>
            ) : null}
          </div>
        </div>

        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="text-left">
            <div className="inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-600 animate-pulse">
              {t('chat.typing')}
            </div>
          </div>
        )}
        {suggestions && suggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="text-sm font-medium text-gray-700">Suggestions</div>
            {suggestions.map((it, idx) => {
              const m = mountainById.get(it.mountain_id);
              return (
                <div key={idx} className="p-3 bg-white border rounded-md">
                  <div className="font-medium text-gray-800">
                    {displayName(m)} <span className="text-gray-500">({it.mountain_id})</span>
                  </div>
                  {it.title && (
                    <div className="text-sm text-gray-700">{it.title}</div>
                  )}
                  {it.reason && (
                    <div className="text-sm text-gray-600 mt-1">{it.reason}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-gray-600 border-gray-300"
          placeholder={t('chat.askPlaceholder')}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? t('chat.typing') : t('chat.send')}
        </button>
      </div>
    </div>
  );
}
