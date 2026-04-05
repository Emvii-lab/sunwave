import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Music, Image as ImageIcon, Users, Calendar, Radio, ChevronRight, Headphones, MapPin } from "lucide-react";

// Prototype Retrowave Hub – Miami Outrun (full layout + silent mock audio)
// Brand: Sunwave — Retrowave community hub
// New: OFFICIAL EMBEDS (Spotify + YouTube) + User submission form (validates & converts to embed)
// New: Simple auth + submission gating + moderation queue + author attribution
// Hardening: tests include parser + initial embeds; no unterminated strings

/* =============================
   Branding
   ============================= */
const BRAND = { name: "Sunwave", tagline: "Retrowave community hub" };

/* =============================
   Visual presets
   ============================= */
const neonGlow = "shadow-[0_0_20px_rgba(255,105,180,0.65)]";
const cyanGlow = "shadow-[0_0_18px_rgba(0,255,240,0.6)]";
const blueGlow = "shadow-[0_0_18px_rgba(0,180,255,0.5)]";

/* =============================
   Navigation model
   ============================= */
const NAV_LINKS = [
  { href: "#music", label: "Musique", icon: Music },
  { href: "#visuals", label: "Visuels", icon: ImageIcon },
  { href: "#community", label: "Communauté", icon: Users },
  { href: "#events", label: "Événements", icon: Calendar },
];

/* =============================
   Demo data
   ============================= */
const playlists = [
  { title: "Night Drive", desc: "Synthwave pour routes nocturnes", length: "1 h 12", tag: "Vibes" },
  { title: "Arcade Dreams", desc: "Chiptune x retrowave", length: "58 min", tag: "Retro" },
  { title: "Cyberpunk City", desc: "Ambiance néon futuriste", length: "1 h 27", tag: "Dark" },
  { title: "Sunset Miami", desc: "Chaleur 80's, grooves, outrun", length: "49 min", tag: "Chill" },
];

const artworks = [
  { title: "Neon Horizon", author: "@astralgrid" },
  { title: "VHS Dreams", author: "@pixelmiami" },
  { title: "Retro Highway", author: "@polychrome" },
  { title: "City of Lights", author: "@odyssey" },
  { title: "Laser Palm", author: "@afterglow" },
  { title: "Magenta Sky", author: "@neonspire" },
];

const events = [
  { date: "29 AOÛT 2025", title: "DJ Set – Night Riders", where: "Twitch Live", type: "Live" },
  { date: "12 SEPT 2025", title: "Release Party – Neon Pulse EP", where: "Bandcamp + Discord", type: "Release" },
  { date: "03 OCT 2025", title: "Watch & Listen – Blade Runner OST", where: "Watch Party", type: "Community" },
];

const artists = [
  { name: "The Midnight", tag: "Synthwave" },
  { name: "Essenger", tag: "Cyberpunk" },
  { name: "Sun City", tag: "Dreamwave" },
  { name: "FM-84", tag: "Outrun" },
];

/* =============================
   Official embeds (initial set)
   ============================= */
const INITIAL_EMBEDS = [
  {
    platform: "Spotify",
    title: "Playlist Synthwave – Spotify (User 1)",
    src: "https://open.spotify.com/embed/playlist/4TYSsckWGZJA3gQvpCoaLN?utm_source=generator",
    height: 352,
    author: "Sunwave Team",
    status: "approved",
    id: "seed-1",
  },
  {
    platform: "Spotify",
    title: "Playlist Synthwave – Spotify (User 2)",
    src: "https://open.spotify.com/embed/playlist/3SA018Uo3yhzvQocaF02MV?utm_source=generator",
    height: 352,
    author: "Sunwave Team",
    status: "approved",
    id: "seed-2",
  },
  {
    platform: "YouTube",
    title: "Synthwave Mix – YouTube",
    src: "https://www.youtube.com/embed/videoseries?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-",
    height: 315,
    author: "Sunwave Team",
    status: "approved",
    id: "seed-3",
  },
];

/* =============================
   URL → Embed parser (Spotify / YouTube)
   ============================= */
function detectPlatform(url) {
  if (/spotify\.com/i.test(url)) return "Spotify";
  if (/youtu\.be|youtube\.com/i.test(url)) return "YouTube";
  return null;
}

function toEmbed(url) {
  const platform = detectPlatform(url);
  if (platform === "Spotify") {
    // Accepts urls like https://open.spotify.com/playlist/ID ... or album/track/artist
    const m = url.match(/spotify\.com\/(?:embed\/)?(playlist|album|track|artist)\/([a-zA-Z0-9]+)(?:\?[^#]*)?/);
    if (m) {
      const type = m[1];
      const id = m[2];
      return { platform, src: `https://open.spotify.com/embed/${type}/${id}`, height: 352 };
    }
  }
  if (platform === "YouTube") {
    // Playlist: list=..., Video: v=..., youtu.be/ID
    const list = url.match(/[?&]list=([\w-]+)/);
    if (list) return { platform, src: `https://www.youtube.com/embed/videoseries?list=${list[1]}`, height: 315 };
    const v = url.match(/[?&]v=([\w-]+)/);
    if (v) return { platform, src: `https://www.youtube.com/embed/${v[1]}`, height: 315 };
    const short = url.match(/youtu\.be\/([\w-]+)/);
    if (short) return { platform, src: `https://www.youtube.com/embed/${short[1]}`, height: 315 };
  }
  return null;
}

/* =============================
   Silent mock player (visual only)
   ============================= */
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function useSilentMockPlayer(initialDurationSec = 227) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(initialDurationSec);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 0.5 >= duration) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return duration;
        }
        return t + 0.5;
      });
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, duration]);

  const progress = useMemo(() => (duration > 0 ? Math.min(1, currentTime / duration) : 0), [currentTime, duration]);

  const toggle = () => setIsPlaying(p => !p);
  const reset = () => setCurrentTime(0);

  return { isPlaying, currentTime, duration, progress, toggle, reset };
}

/* =============================
   Logo (retrowave sun + palm silhouette)
   ============================= */
function SunwaveLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`${neonGlow}`}>
      <defs>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a87" />
          <stop offset="50%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#fdf497" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sunGrad)" stroke="white" strokeWidth="2" />
      <rect x="30" y="24" width="4" height="22" rx="1" fill="#071018" />
      <path d="M32 24c8-8 18-7 24-1-8-2-14 3-16 7 6-2 12 1 14 6-8-4-14-1-18 2" fill="#071018" />
      <path d="M32 24c-8-8-18-7-24-1 8-2 14 3 16 7-6-2-12 1-14 6 8-4 14-1 18 2" fill="#071018" />
    </svg>
  );
}

/* =============================
   Runtime tests
   ============================= */
function runTests() {
  console.assert(typeof BRAND.name === "string" && BRAND.name.length > 0, "[TEST] BRAND.name non-empty");
  console.assert(NAV_LINKS.length === 4 && NAV_LINKS.every(l => /^#[a-z]+/.test(l.href)), "[TEST] NAV_LINKS sanity");
  console.assert(playlists.length >= 4, "[TEST] playlists length >= 4");
  console.assert(artists.some(a => a.name === "FM-84"), "[TEST] artists include FM-84");
  console.assert(events.every(e => e.date && e.title && e.where && e.type), "[TEST] events fields complete");
  console.assert(INITIAL_EMBEDS.length >= 2 && INITIAL_EMBEDS.every(e => typeof e.src === 'string' && e.src.length > 0), "[TEST] initial embeds present & valid src");
  // Parser tests
  const s1 = toEmbed("https://open.spotify.com/playlist/4TYSsckWGZJA3gQvpCoaLN");
  console.assert(s1 && s1.platform === 'Spotify' && /embed\/playlist\/4TYSsckWGZJA3gQvpCoaLN/.test(s1.src), "[TEST] spotify playlist parse");
  const y1 = toEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  console.assert(y1 && y1.platform === 'YouTube' && /embed\/dQw4w9WgXcQ/.test(y1.src), "[TEST] youtube video parse");
  // Auth & moderation seed tests
  console.assert(INITIAL_EMBEDS.every(e => e.status === 'approved' && typeof e.author === 'string'), "[TEST] initial embeds have author + approved status");
}
runTests();

/* =============================
   Main component
   ============================= */
export default function RetrowaveHubPrototype() {
  const player = useSilentMockPlayer(227);
  const [embeds, setEmbeds] = useState(INITIAL_EMBEDS);
  const progressWidth = `${Math.floor(player.progress * 100)}%`;

  // Simple auth state (demo)
  const [currentUser, setCurrentUser] = useState(null); // {name, isModerator}
  const isLoggedIn = !!currentUser;

  function toggleLogin() {
    if (currentUser) {
      setCurrentUser(null);
    } else {
      setCurrentUser({ name: "NeonFan", isModerator: false });
    }
  }
  function toggleModerator() {
    if (!currentUser) return;
    setCurrentUser(u => ({ ...u, isModerator: !u.isModerator }));
  }

  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isLoggedIn) {
      setError("Connecte-toi pour proposer une playlist.");
      return;
    }
    const parsed = toEmbed(url.trim());
    if (!parsed) {
      setError("URL invalide. Fournis un lien Spotify ou YouTube.");
      return;
    }
    const card = {
      platform: parsed.platform,
      title: title.trim() || (parsed.platform === 'Spotify' ? 'Playlist – Spotify' : 'Playlist – YouTube'),
      src: parsed.src,
      height: parsed.height,
      author: currentUser?.name || "Anonyme",
      status: "pending",
      id: `u-${Date.now()}`,
    };
    setEmbeds((prev) => [card, ...prev]);
    setUrl("");
    setTitle("");
  }

  function approveEmbed(id) {
    setEmbeds(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
  }
  function rejectEmbed(id) {
    setEmbeds(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
  }

  const pending = embeds.filter(e => e.status === 'pending');
  const approved = embeds.filter(e => e.status === 'approved');

  return (
    <div className="min-h-screen w-full text-white bg-[#071018] relative overflow-hidden">
      {/* BACKGROUND AURA */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-60 bg-gradient-to-b from-pink-500 via-fuchsia-500 to-orange-300" />
        <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-t from-[#071018] via-[#0b1322] to-transparent"/>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-20 backdrop-blur-md/30 bg-black/20 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="flex items-center gap-3">
            <SunwaveLogo size={40} />
            <div className="font-black tracking-wider text-lg">
              <span className="text-pink-400">{BRAND.name}</span>
              <span className="text-cyan-300"> Hub</span>
            </div>
          </motion.div>
          <nav className="hidden md:flex items-center gap-3 text-sm text-white/80">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="hover:text-white flex items-center gap-2 px-2">
                <Icon size={16} /> {label}
              </a>
            ))}
            <button onClick={player.toggle} className={`px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 transition ${neonGlow} flex items-center gap-2`}>
              {player.isPlaying ? <Pause size={16}/> : <Play size={16}/>} {player.isPlaying ? "Pause radio" : "Lancer radio"}
            </button>
            <div className="w-px h-5 bg-white/10 mx-2"/>
            <button onClick={toggleLogin} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">{isLoggedIn ? "Se déconnecter" : "Se connecter"}</button>
            {isLoggedIn && (
              <button onClick={toggleModerator} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">Mode modération: {currentUser.isModerator ? "ON" : "OFF"}</button>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6}}>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight">
                Bienvenue dans <span className="text-pink-400">{BRAND.name}</span><span className="text-cyan-300"> Hub</span>
              </h1>
              <p className="mt-4 text-white/80 max-w-xl">Vibes ensoleillées, autoroutes rétro, palmiers néon et synthwave enivrante. Une communauté vivante pour fans et créateurs.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={player.toggle} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>
                  <Headphones size={18}/> {player.isPlaying ? "Pause radio 24/7" : "Lancer la radio 24/7"}
                </button>
                <a href="#music" className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/90 hover:bg-cyan-300 transition ${cyanGlow}`}>
                  <ChevronRight size={18}/> Explorer le hub
                </a>
              </div>
              <div className="mt-6 flex items-center gap-6 text-xs text-white/70">
                <div className="flex items-center gap-2"><Radio size={14}/> Radio communautaire (démo silencieuse)</div>
                <div className="flex items-center gap-2"><Users size={14}/> Concours & fanzine</div>
                <div className="flex items-center gap-2"><Calendar size={14}/> Events live</div>
              </div>
            </motion.div>

            <motion.div initial={{opacity:0, scale:0.96}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{duration:0.6}} className={`rounded-2xl bg-gradient-to-br from-[#10162c] via-[#1a2340] to-[#08121c] p-6 border border-white/10 ${blueGlow}`}>
              <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Radio — Silent Demo Mode</div>
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br from-pink-400 to-orange-400 ${neonGlow}`}></div>
                <div>
                  <div className="text-lg font-bold">Sunset Drive</div>
                  <div className="text-white/60 text-sm">FM-84 — Outrun</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div style={{ width: progressWidth }} className="h-full bg-gradient-to-r from-pink-400 to-orange-400" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span>{formatTime(player.currentTime)}</span>
                  <span>{formatTime(player.duration)}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={player.toggle} className={`p-3 rounded-xl bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>{player.isPlaying ? <Pause size={18}/> : <Play size={18}/>}</button>
                <button onClick={player.reset} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm">Remettre à 0</button>
                <span className="ml-auto text-xs text-white/60">Silencieux</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MUSIC */}
      <section id="music" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3"><Music/> Sélection musicale</h2>
          <a className="text-sm text-pink-300 hover:text-pink-200 flex items-center gap-1" href="#">Tout voir <ChevronRight size={16}/></a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((p, i) => (
            <motion.div key={p.title} initial={{opacity:0, y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay: i*0.05}} className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-[#151c36] to-[#0b1222] hover:from-[#182044] hover:to-[#10162e] ${blueGlow}`}>
              <div className="h-28 w-full rounded-xl bg-gradient-to-br from-pink-400/70 to-orange-300/70 mb-3"/>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-lg">{p.title}</div>
                  <div className="text-white/60 text-sm">{p.desc}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">{p.tag}</span>
              </div>
              <div className="mt-3 text-xs text-white/60">{p.length}</div>
              <button onClick={player.toggle} className={`mt-4 w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-400 transition ${neonGlow} flex items-center justify-center gap-2`}>
                <Play size={16}/> Écouter (démo)
              </button>
            </motion.div>
          ))}
        </div>

        {/* SUBMISSION FORM */}
        <div id="submit-playlist" className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Proposer une playlist (Spotify / YouTube)</h3>
            <span className="text-xs text-white/60">Tu colles l’URL → on génère l’embed officiel.</span>
          </div>
          <form onSubmit={handleSubmit} className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-[#141a32] to-[#0c1226] ${blueGlow}`}>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Colle un lien Spotify ou YouTube (playlist, album, track, vidéo)"
                className="md:col-span-2 w-full px-3 py-2 rounded-xl bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-white/60 disabled:opacity-50"
                disabled={!isLoggedIn}
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full px-3 py-2 rounded-xl bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-white/60 disabled:opacity-50"
                disabled={!isLoggedIn}
              />
            </div>
            {!isLoggedIn && <div className="mt-2 text-sm text-white/70">Connecte-toi pour proposer une playlist.</div>}
            {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
            <div className="mt-3 flex items-center gap-3">
              <button type="submit" disabled={!isLoggedIn} className={`px-4 py-2 rounded-xl ${!isLoggedIn ? 'bg-white/10 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-400'} transition ${neonGlow}`}>Ajouter l’embed</button>
              <a href="#embeds" className="text-sm text-white/70 hover:text-white">Aller aux embeds</a>
              {!isLoggedIn && <button type="button" onClick={toggleLogin} className="ml-auto px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">Se connecter</button>}
            </div>
          </form>
        </div>

        {/* MODERATION QUEUE */}
        <div id="moderation" className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg md:text-xl font-extrabold tracking-tight">File d’attente (modération)</h3>
            <div className="text-xs text-white/60">{pending.length} en attente</div>
          </div>
          {pending.length === 0 ? (
            <div className="text-sm text-white/60">Aucune soumission en attente.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {pending.map((e) => (
                <div key={e.id} className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-[#1b2446] to-[#0c1226] ${blueGlow}`}>
                  <div className="text-sm text-white/70 mb-2">{e.title} <span className="text-white/40">· {e.platform}</span></div>
                  <div className="text-xs text-white/60 mb-3">Proposé par <span className="text-white">{e.author}</span></div>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <iframe title={e.title} src={e.src} width="100%" height={e.height} loading="lazy" style={{ border: 0 }} />
                  </div>
                  {currentUser?.isModerator ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => approveEmbed(e.id)} className={`px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>Approuver</button>
                      <button onClick={() => rejectEmbed(e.id)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">Refuser</button>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-white/50">En attente d’un modérateur.</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isLoggedIn && (
            <div className="mt-3 text-xs text-white/60">Astuce (démo) : active le <span className="text-white">Mode modération</span> dans la barre du haut pour tester l’approbation.</div>
          )}
        </div>

        {/* OFFICIAL EMBEDS */}
        <div id="embeds" className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Intégrations officielles (embeds approuvés)</h3>
            <span className="text-xs text-white/60">La lecture est gérée par Spotify/YouTube (licences couvertes par eux).</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {approved.map((e, idx) => (
              <div key={`${e.id}-${idx}`} className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-[#141a32] to-[#0c1226] ${blueGlow}`}>
                <div className="text-sm text-white/70 mb-1">{e.title} <span className="text-white/40">· {e.platform}</span></div>
                <div className="text-xs text-white/50 mb-2">par <span className="text-white">{e.author}</span></div>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {/* Note: Some environments block external iframes; this is a visual mock*/}
                  <iframe
                    title={e.title}
                    src={e.src}
                    width="100%"
                    height={e.height}
                    loading="lazy"
                    allow={e.platform === 'Spotify' ? 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'}
                    style={{ border: 0 }}
                  />
                </div>
                <div className="mt-2 text-xs text-white/60">Si l’aperçu ne s’affiche pas ici, il s’ouvrira en externe.</div>
              </div>
            ))}
          </div>
        </div>

        {/* ARTISTES À LA UNE */}
        <div className="mt-12 rounded-2xl border border-white/10 p-4 bg-gradient-to-r from-pink-500/10 via-orange-400/10 to-cyan-400/10">
          <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Artistes à la une</div>
          <div className="flex flex-wrap gap-3">
            {artists.map(a => (
              <span key={a.name} className={`text-sm px-3 py-1.5 rounded-full bg-white/10 ${neonGlow}`}>{a.name} · <span className="text-white/70">{a.tag}</span></span>
            ))}
          </div>
        </div>
      </section>

      {/* VISUALS */}
      <section id="visuals" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3"><ImageIcon/> Galerie visuelle</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {artworks.map((a, i) => (
            <motion.div key={a.title} initial={{opacity:0, y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay: i*0.03}} className="group">
              <div className={`aspect-square w-full rounded-xl border border-white/10 bg-gradient-to-br from-pink-400/60 to-orange-400/60 ${neonGlow} transition-transform duration-300 group-hover:scale-[1.02]`} />
              <div className="mt-2 text-sm font-semibold">{a.title}</div>
              <div className="text-xs text-white/60">{a.author}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section id="community" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3"><Users/> Communauté</h2>
          <a className="text-sm text-pink-300 hover:text-pink-200 flex items-center gap-1" href="#">Rôles & badges <ChevronRight size={16}/></a>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-[#16213d] to-[#0d1426] ${blueGlow}`}>
            <div className="text-sm text-white/70">Chat en direct</div>
            <div className="mt-3 h-48 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-white/50">(Aperçu du chat / embed Discord)</div>
            <div className="mt-4 flex gap-3">
              <button className={`px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>Rejoindre le Discord</button>
              <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition">Créer un post</button>
            </div>
          </div>
          <div className={`rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-[#16213d] to-[#0d1426] ${blueGlow}`}>
            <div className="text-sm text-white/70">Badges & rôles</div>
            <ul className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
              <li className="rounded-xl bg-white/10 p-3 flex items-center justify-between"><span>Night Rider</span><span className="text-white/60 text-xs">playlists</span></li>
              <li className="rounded-xl bg-white/10 p-3 flex items-center justify-between"><span>Synth Master</span><span className="text-white/60 text-xs">créateur</span></li>
              <li className="rounded-xl bg-white/10 p-3 flex items-center justify-between"><span>Arcade Kid</span><span className="text-white/60 text-xs">mini-jeux</span></li>
              <li className="rounded-xl bg-white/10 p-3 flex items-center justify-between"><span>VHS Collector</span><span className="text-white/60 text-xs">galerie</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3"><Calendar/> Événements</h2>
          <a className="text-sm text-pink-300 hover:text-pink-200 flex items-center gap-1" href="#">Calendrier <ChevronRight size={16}/></a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {events.map((e,i) => (
            <motion.div key={e.title} initial={{opacity:0, y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.05}} className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-[#141a32] to-[#0c1226] hover:from-[#1a2344] hover:to-[#111830] ${cyanGlow}`}>
              <div className="text-xs text-white/60">{e.date}</div>
              <div className="mt-1 font-bold text-lg">{e.title}</div>
              <div className="mt-1 text-sm flex items-center gap-2 text-white/70"><MapPin size={14}/>{e.where}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">{e.type}</span>
                <button className={`ml-auto px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>Participer</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className={`rounded-3xl border border-white/10 p-8 md:p-10 text-center bg-gradient-to-r from-pink-500/20 via-orange-400/10 to-cyan-400/20 ${neonGlow}`}>
          <h3 className="text-2xl md:text-4xl font-extrabold">Rejoins la communauté {BRAND.name}</h3>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">Partage tes découvertes, propose ta musique (The Midnight, Essenger, Sun City, FM-84 & co), expose tes visuels, et vis des événements en live.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="#community" className={`px-5 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 transition ${neonGlow}`}>Créer un compte</a>
            <a href="#music" className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition">Parcourir en invité</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-6 text-sm text-white/70">
          <div>
            <div className="flex items-center gap-2 font-black text-white"><SunwaveLogo size={20}/><span>{BRAND.name}</span><span className="text-pink-400"> Hub</span></div>
            <p className="mt-2">Projet communautaire non-officiel, par des fans de retrowave pour les fans.</p>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Sections</div>
            <ul className="space-y-1">
              {NAV_LINKS.concat([{ href: "#submit-playlist", label: "Proposer" }, { href: "#moderation", label: "Modération" }, { href: "#embeds", label: "Embeds" }, { href: "#join", label: "Rejoindre" }]).map((l) => (
                <li key={l.href}><a href={l.href} className="hover:text-white">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Ressources</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Fanzine</a></li>
              <li><a href="#" className="hover:text-white">Charte des créateurs</a></li>
              <li><a href="#" className="hover:text-white">Proposer un morceau</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Suivre</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Discord</a></li>
              <li><a href="#" className="hover:text-white">YouTube</a></li>
              <li><a href="#" className="hover:text-white">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-white/50">© 2025 {BRAND.name} Hub — Prototype UI</div>
      </footer>
    </div>
  );
}
