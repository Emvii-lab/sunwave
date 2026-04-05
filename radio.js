// Sunwave Hub — Radio Receiver v3 Obsidian Edition
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIGURATION ---
// These variables are injected by Vite at build time from .env or GitHub Secrets
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STATIONS = {
    '1': 'PLyIFQr1wryPKulMOzAKzBt8EoQD6vMPzA',
    '2': 'PLyIFQr1wryPKEzgoT30OgiY7oNzQP5wK1',
    '3': 'PLyIFQr1wryPJis3divgiT8FPdI4SqrnRj'
};

const FREQS = { '1': '88.4', '2': '92.1', '3': '104.5' };
const NAMES = { 
    '1': 'CH-01 // NEON DRIFT', 
    '2': 'CH-02 // SUNSET VIBES', 
    '3': 'CH-03 // CYBERPUNK NIGHTS' 
};

let player;
let currentStation = '1';
let isPowerOn = false;
let audioContext;
let isPlayerReady = false;

// Initialize YouTube Iframe API
function onYouTubeIframeAPIReady() {
    if (player) return; // Prevent double init
    
    player = new YT.Player('radio-player-iframe', {
        height: '0',
        width: '0',
        playerVars: {
            'listType': 'playlist',
            'list': STATIONS[currentStation],
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'enablejsapi': 1,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    console.log("Obsidian Receiver v3 — Locked & Loaded.");
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING && isPowerOn) {
        updateTrackInfo();
    }
    if (event.data === YT.PlayerState.ENDED && isPowerOn) {
        player.playVideo();
    }
}

function updateTrackInfo() {
    if (player && typeof player.getVideoData === 'function') {
        const data = player.getVideoData();
        const titleEl = document.getElementById('track-title');
        if (titleEl && data.title) {
            titleEl.textContent = data.title.toUpperCase();
        }
    }
}

// Power Toggle
function togglePower() {
    const unit = document.querySelector('.radio-receiver-v3');
    const screen = document.getElementById('radio-screen');
    const status1 = document.getElementById('status-led-1');
    const status2 = document.getElementById('status-led-2');
    
    isPowerOn = !isPowerOn;
    
    if (isPowerOn) {
        unit.classList.add('power-on');
        screen.classList.add('screen-on');
        
        status1.style.background = '#ff5a87';
        status1.style.boxShadow = '0 0 8px #ff5a87';
        status2.style.background = '#3b82f6';
        status2.style.boxShadow = '0 0 8px #3b82f6';
        
        playStaticNoise(800);
        
        setTimeout(() => {
            if (isPlayerReady && player && typeof player.loadPlaylist === 'function') {
                player.loadPlaylist({
                    listType: 'playlist',
                    list: STATIONS[currentStation],
                    index: Math.floor(Math.random() * 5)
                });
                
                setTimeout(() => {
                    player.setShuffle(true);
                    player.playVideo();
                }, 500);
            }
            updateDisplay();
            syncHeaderButton();
        }, 600);
    } else {
        unit.classList.remove('power-on');
        screen.classList.remove('screen-on');
        status1.style.background = '';
        status1.style.boxShadow = '';
        status2.style.background = '';
        status2.style.boxShadow = '';
        player.pauseVideo();
        resetVu();
        syncHeaderButton();
        
        // Reset Display
        const titleEl = document.getElementById('track-title');
        if (titleEl) titleEl.textContent = 'SIGNAL LOST...';
        const nameEl = document.getElementById('station-name');
        if (nameEl) nameEl.textContent = '---';
        const freqEl = document.getElementById('frequency-value');
        if (freqEl) freqEl.textContent = '---';
    }
}

// Station Switching
function switchStation(id) {
    if (!isPowerOn) return;
    
    const btns = document.querySelectorAll('.station-btn-v3');
    btns.forEach(b => b.classList.remove('active'));
    
    const targetBtn = document.getElementById(`btn-ch${id}`);
    if (targetBtn) targetBtn.classList.add('active');
    
    currentStation = id;
    playStaticNoise(500);
    
    if (isPlayerReady && player && typeof player.loadPlaylist === 'function') {
        player.loadPlaylist({
            listType: 'playlist',
            list: STATIONS[id],
            index: Math.floor(Math.random() * 5)
        });
        setTimeout(() => {
            player.setShuffle(true);
            player.playVideo();
        }, 400);
    }
    updateDisplay();
}

function updateDisplay() {
    const freqEl = document.getElementById('frequency-value');
    const nameEl = document.getElementById('station-name');
    if (freqEl) freqEl.textContent = FREQS[currentStation];
    if (nameEl) nameEl.textContent = NAMES[currentStation];
}

// White Noise Generator
function playStaticNoise(duration) {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const bufferSize = audioContext.sampleRate * (duration / 1000);
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        gainNode.gain.value = 0.02;
        
        whiteNoise.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        whiteNoise.start();
    } catch (e) {
        console.warn("Audio Context blocked or failed.");
    }
}

// VU Meter Logic
setInterval(() => {
    if (!isPowerOn) return;
    const segments = document.querySelectorAll('.vu-bar-v3');
    const mid = segments.length / 2;
    const level = Math.floor(Math.random() * (mid - 2)) + 2; 
    
    segments.forEach((seg, idx) => {
        const normalizedIdx = idx % mid;
        if (normalizedIdx < level) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });
}, 80);

function resetVu() {
    document.querySelectorAll('.vu-bar-v3').forEach(s => s.classList.remove('active'));
}

// Global Trigger (Header)
function triggerRadio() {
    const radioSection = document.getElementById('obsidian-radio-unit');
    if (!radioSection) return;
    
    radioSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (!isPowerOn) {
        setTimeout(() => {
            togglePower();
        }, 800);
    }
}

// Remote Trigger from Cards
function playPlaylist(id) {
    const radioSection = document.getElementById('obsidian-radio-unit');
    if (!radioSection) return;
    
    radioSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (!isPowerOn) {
        togglePower();
    }
    
    setTimeout(() => {
        switchStation(id);
    }, 600);
}

// Sync Status Header Button
function syncHeaderButton() {
    const headerBtn = document.getElementById('header-play-btn');
    if (!headerBtn) return;
    
    if (isPowerOn) {
        headerBtn.classList.add('is-active');
        const textSpan = headerBtn.querySelector('.header-btn-text');
        if (textSpan) textSpan.textContent = 'Radio en direct';
        headerBtn.style.boxShadow = '0 0 20px rgba(255, 90, 135, 0.4)';
    } else {
        headerBtn.classList.remove('is-active');
        const textSpan = headerBtn.querySelector('.header-btn-text');
        if (textSpan) textSpan.textContent = 'Lancer radio';
        headerBtn.style.boxShadow = '';
    }
}

// Check for late API load
if (window.YT && window.YT.Player) {
    onYouTubeIframeAPIReady();
}

// --- PLAYLIST SUBMISSION & SUPABASE LOGIC ---

/**
 * Parses a Spotify or YouTube URL into an embed-friendly format.
 */
function parseUrlToEmbed(url) {
    if (/spotify\.com/i.test(url)) {
        const m = url.match(/spotify\.com\/(?:embed\/)?(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
        if (m) return { platform: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: 352 };
    }
    if (/youtu\.be|youtube\.com/i.test(url)) {
        const list = url.match(/[?&]list=([\w-]+)/);
        if (list) return { platform: 'YouTube', src: `https://www.youtube.com/embed/videoseries?list=${list[1]}`, height: 315 };
        const v = url.match(/[?&]v=([\w-]+)/);
        if (v) return { platform: 'YouTube', src: `https://www.youtube.com/embed/${v[1]}`, height: 315 };
        const short = url.match(/youtu\.be\/([\w-]+)/);
        if (short) return { platform: 'YouTube', src: `https://www.youtube.com/embed/${short[1]}`, height: 315 };
    }
    return null;
}

/**
 * Fetches approved playlists from Supabase and renders them.
 */
async function fetchPlaylists() {
    if (!_supabase) return;
    
    const { data, error } = await _supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching playlists:", error);
        return;
    }

    renderPlaylists(data);
}

/**
 * Renders the fetched playlists into the DOM.
 */
function renderPlaylists(playlists) {
    const grid = document.getElementById('embeds-grid');
    if (!grid) return;

    // We keep the initial hardcoded ones or clear them? 
    // Clearing for a clean "Approved" feed, but keeping the "Sélection Musicale" static cards.
    // Let's just append the new ones for now.
    
    playlists.forEach(p => {
        const card = document.createElement('div');
        const borderColor = p.platform === 'Spotify' ? 'border-t-cyan-500/30' : 'border-t-pink-500/30';
        const tagBg = p.platform === 'Spotify' ? 'bg-cyan-400/10' : 'bg-pink-400/10';
        const tagColor = p.platform === 'Spotify' ? 'text-cyan-400' : 'text-pink-400';

        card.className = `premium-card rounded-2xl p-6 border-t-2 ${borderColor}`;
        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
               <div class="text-xs font-black tracking-widest uppercase">${p.title}</div>
               <span class="text-[9px] font-bold ${tagColor} uppercase tracking-widest ${tagBg} px-2 py-0.5 rounded">${p.platform}</span>
            </div>
            <div class="rounded-xl overflow-hidden border border-white/5 shadow-2xl">
              <iframe src="${p.embed_url}" width="100%" height="${p.platform === 'Spotify' ? '352' : '315'}" loading="lazy" style="border: 0;"></iframe>
            </div>
        `;
        grid.prepend(card);
    });
}

/**
 * Handles the form submission to Supabase.
 */
async function submitPlaylist() {
    const urlInput = document.getElementById('playlist-url');
    const titleInput = document.getElementById('playlist-title');
    const status = document.getElementById('submission-status');

    const url = urlInput.value.trim();
    const title = titleInput.value.trim() || "Nouvelle Playlist";

    if (!url) return;

    const embedData = parseUrlToEmbed(url);
    if (!embedData) {
        status.textContent = "URL Invalide";
        status.classList.replace('text-white/20', 'text-red-500');
        return;
    }

    if (!_supabase) {
        status.textContent = "Supabase non configuré";
        return;
    }

    status.textContent = "Envoi...";
    
    const { error } = await _supabase
        .from('playlists')
        .insert([{
            title: title,
            url: url,
            platform: embedData.platform,
            embed_url: embedData.src
        }]);

    if (error) {
        console.error("Submission error:", error);
        status.textContent = "Erreur d'envoi";
    } else {
        status.textContent = "Soumis avec succès !";
        status.classList.replace('text-white/20', 'text-emerald-500');
        urlInput.value = '';
        titleInput.value = '';
        
        // Refresh grid
        fetchPlaylists(); 
    }
}

// Initial Fetch and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchPlaylists();
    
    const form = document.getElementById('playlist-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitPlaylist();
        });
    }
});
