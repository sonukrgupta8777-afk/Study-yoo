import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { SpotifyStatusResponse, SpotifyPlaylistPreset, SpotifyUserPlaylist } from '../types/index.js';
import { Music, Play, Check, ExternalLink, Settings, RefreshCw, Volume2, Copy, Sparkles, User, Link as LinkIcon, Radio } from 'lucide-react';

interface SpotifyPlayerModalProps {
  activeEmbedId: string;
  onSelectEmbed: (embedId: string, title: string) => void;
  onClose: () => void;
}

import { EXPANDED_SPOTIFY_PLAYLISTS } from '../data/studyMusic.js';

export const CURATED_PLAYLISTS: SpotifyPlaylistPreset[] = EXPANDED_SPOTIFY_PLAYLISTS;

export const SpotifyPlayerModal: React.FC<SpotifyPlayerModalProps> = ({
  activeEmbedId,
  onSelectEmbed,
  onClose,
}) => {
  const [tab, setTab] = useState<'radio' | 'custom' | 'account'>('radio');
  const [currentEmbedId, setCurrentEmbedId] = useState(activeEmbedId || CURATED_PLAYLISTS[0].embedId);
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [status, setStatus] = useState<SpotifyStatusResponse | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<SpotifyUserPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual OAuth config input state
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Load Spotify status
  const loadStatus = async () => {
    try {
      const res = await api.getSpotifyStatus();
      setStatus(res);
      if (res.connected) {
        const plRes = await api.getSpotifyPlaylists();
        setUserPlaylists(plRes.playlists || []);
      }
    } catch (err) {
      console.error('Failed to load Spotify status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Listen for cross-origin OAuth popup completion per SKILL.md
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'spotify') {
        loadStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Connect via Popup per SKILL.md guidelines
  const handleConnectSpotify = async () => {
    setLoading(true);
    try {
      const authData = await api.getSpotifyAuthUrl();
      if (!authData.configured || !authData.url) {
        setTab('account');
        setLoading(false);
        return;
      }

      // Open OAuth provider URL directly in popup
      const authWindow = window.open(
        authData.url,
        'spotify_oauth_popup',
        'width=600,height=720,menubar=no,toolbar=no'
      );

      if (!authWindow) {
        alert('Please allow popups to connect your Spotify account.');
      }
    } catch (err) {
      console.error('Error initiating Spotify connect:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect your Spotify account from ZenithStudy?')) {
      await api.disconnectSpotify();
      loadStatus();
    }
  };

  const handleSaveConfig = async () => {
    if (!clientIdInput.trim()) return;
    try {
      await api.saveSpotifyConfig(clientIdInput.trim(), clientSecretInput.trim() || undefined);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
      loadStatus();
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  // Convert any Spotify URL to Embed ID
  const handleApplyCustomLink = () => {
    const input = customLinkInput.trim();
    if (!input) return;

    // Pattern 1: https://open.spotify.com/playlist/0vvXsW14ReMV929pm5nR9r?si=...
    // Pattern 2: https://open.spotify.com/track/...
    // Pattern 3: https://open.spotify.com/album/...
    // Pattern 4: spotify:playlist:0vvXsW14ReMV929pm5nR9r
    let extractedId = input;
    const matchUrl = input.match(/spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/);
    if (matchUrl && matchUrl[2]) {
      extractedId = matchUrl[2];
    } else {
      const matchUri = input.match(/spotify:(playlist|track|album):([a-zA-Z0-9]+)/);
      if (matchUri && matchUri[2]) {
        extractedId = matchUri[2];
      }
    }

    setCurrentEmbedId(extractedId);
    onSelectEmbed(extractedId, 'Custom Spotify Music');
    setCustomLinkInput('');
  };

  const currentRedirectUri = status?.redirectUri || `${window.location.origin}/auth/callback`;

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(currentRedirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlaylists = CURATED_PLAYLISTS.filter(p => {
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchQuery = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex items-center justify-center shadow-lg shadow-[#1DB954]/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Spotify Study Player
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30">
                  Focus Audio
                </span>
              </h3>
              <p className="text-xs text-slate-400">Curated study beats, personal playlists & zero distraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-white/5">
          <button
            onClick={() => setTab('radio')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'radio'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Curated Radio</span>
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'custom'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Custom Link</span>
          </button>

          <button
            onClick={() => setTab('account')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'account'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>
              {status?.connected ? `@${status.profile?.displayName}` : 'Link Account'}
            </span>
          </button>
        </div>

        {/* Embedded Official Spotify Player Widget */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${currentEmbedId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Focus Audio Player"
            className="w-full"
          />
        </div>

        {/* TAB 1: CURATED RADIO */}
        {tab === 'radio' && (
          <div className="space-y-3">
            {/* Category Pills & Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
                {[
                  { id: 'all', label: 'All Playlists', icon: '✨' },
                  { id: 'lofi', label: 'Lo-Fi', icon: '🎧' },
                  { id: 'focus', label: 'Deep Focus', icon: '🧠' },
                  { id: 'classical', label: 'Classical', icon: '🎻' },
                  { id: 'jazz', label: 'Jazz', icon: '☕' },
                  { id: 'ambient', label: 'Ambient', icon: '🌿' },
                  { id: 'synthwave', label: 'Synthwave', icon: '⚡' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                      categoryFilter === cat.id
                        ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 shadow-sm'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Curated Focus Playlists ({filteredPlaylists.length})
              </span>
              <span className="text-[11px] text-slate-500">Official Spotify Streams</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredPlaylists.map(item => {
                const isActive = currentEmbedId === item.embedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentEmbedId(item.embedId);
                      onSelectEmbed(item.embedId, item.title);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                      isActive
                        ? 'bg-[#1DB954]/10 border-[#1DB954]/50 shadow-md shadow-[#1DB954]/10 ring-1 ring-[#1DB954]/30'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                          {item.title}
                        </h4>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#1DB954] shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM SPOTIFY LINK / SEARCH */}
        {tab === 'custom' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white">Paste Any Spotify URL</label>
              <p className="text-xs text-slate-400">
                Play any playlist, album, or track directly inside the app. Open Spotify, click "Share" → "Copy Link", and paste here:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/..."
                value={customLinkInput}
                onChange={e => setCustomLinkInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB954]"
              />
              <button
                onClick={handleApplyCustomLink}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black transition-colors shrink-0"
              >
                Load Audio
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold text-slate-400">Popular Study Picks:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Classical Essentials', id: '37i9dQZF1DX8Uebhn9wzrS' },
                  { name: 'Lo-Fi Japanese Garden', id: '37i9dQZF1DXcBWIGoYBM5M' },
                  { name: 'Ambient Chillout', id: '37i9dQZF1DX3Ogo9pFvBkY' },
                  { name: 'Chill Instrumental Beats', id: '37i9dQZF1DXdUebA9NX7Cr' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => {
                      setCurrentEmbedId(chip.id);
                      onSelectEmbed(chip.id, chip.name);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
                  >
                    {chip.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPOTIFY ACCOUNT & OAUTH INTEGRATION */}
        {tab === 'account' && (
          <div className="space-y-4">
            {/* If connected */}
            {status?.connected && status.profile ? (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status.profile.avatarUrl ? (
                      <img
                        src={status.profile.avatarUrl}
                        alt="Spotify Avatar"
                        className="w-12 h-12 rounded-full border-2 border-[#1DB954]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center text-lg">
                        {status.profile.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{status.profile.displayName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954]">
                          {status.profile.product || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{status.profile.email || 'Connected to Spotify'}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                {/* User's playlists */}
                {userPlaylists.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-slate-300">Your Playlists ({userPlaylists.length})</span>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {userPlaylists.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setCurrentEmbedId(p.id);
                            onSelectEmbed(p.id, p.name);
                          }}
                          className="p-2 rounded-xl bg-slate-950 border border-white/5 hover:border-[#1DB954]/50 cursor-pointer flex items-center gap-2.5 transition-colors"
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs">🎵</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.tracksCount} tracks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* If not connected */
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Connect Your Spotify Account</h4>
                    <p className="text-xs text-slate-400">Sync personal study playlists & listen directly in ZenithStudy</p>
                  </div>
                </div>

                <button
                  onClick={handleConnectSpotify}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <span>{loading ? 'Opening Authorization...' : 'Connect with Spotify'}</span>
                </button>

                {/* Spotify Developer Setup Helper per SKILL.md */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>OAuth Setup Details</span>
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1DB954] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Spotify Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    To link your personal account, add this Redirect URI in your Spotify App settings:
                  </p>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/50 border border-white/5">
                    <code className="text-[11px] font-mono text-emerald-400 flex-1 truncate">
                      {currentRedirectUri}
                    </code>
                    <button
                      onClick={copyRedirectUri}
                      className="p-1.5 rounded text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 shrink-0 flex items-center gap-1 text-[10px]"
                      title="Copy Redirect URI"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Optional Client ID & Secret configuration directly in UI */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Configure Spotify App Credentials:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Spotify Client ID"
                        value={clientIdInput}
                        onChange={e => setClientIdInput(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB954]"
                      />
                      <input
                        type="password"
                        placeholder="Spotify Client Secret"
                        value={clientSecretInput}
                        onChange={e => setClientSecretInput(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB954]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      {configSuccess && <span className="text-[11px] text-emerald-400">Credentials saved!</span>}
                      <button
                        onClick={handleSaveConfig}
                        className="ml-auto px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                      >
                        Save Credentials
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>Plays in background during focus sessions</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
