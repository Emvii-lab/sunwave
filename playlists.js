// Sunwave Hub — Playlists Page
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'sunwave' }
});

async function fetchAllPlaylists() {
    const grid = document.getElementById('playlists-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="text-white/30 col-span-full text-center py-20 text-sm uppercase tracking-widest">Chargement...</p>';

    const { data, error } = await _supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching playlists:', error);
        grid.innerHTML = '<p class="text-red-400 col-span-full text-center py-20 text-sm">Erreur de chargement.</p>';
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = '<p class="text-white/30 col-span-full text-center py-20 text-sm uppercase tracking-widest">Aucune playlist pour le moment.</p>';
        return;
    }

    grid.innerHTML = '';
    data.forEach((p, index) => {
        const borderColor = p.platform === 'Spotify' ? 'border-t-cyan-500/30' : 'border-t-pink-500/30';
        const tagBg = p.platform === 'Spotify' ? 'bg-cyan-400/10' : 'bg-pink-400/10';
        const tagColor = p.platform === 'Spotify' ? 'text-cyan-400' : 'text-pink-400';
        const iframeHeight = p.platform === 'Spotify' ? '352' : '315';
        const safeTitle = p.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safePlatform = p.platform.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const card = document.createElement('div');
        card.className = `premium-card rounded-2xl p-6 border-t-2 ${borderColor} relative`;
        card.innerHTML = `
            ${index === 0 ? '<div class="absolute top-4 right-4 px-2 py-0.5 rounded sunset-static text-[8px] font-black text-white uppercase tracking-widest">Dernière ajoutée</div>' : ''}
            <div class="flex items-center justify-between mb-4 ${index === 0 ? 'pr-28' : ''}">
               <div class="text-xs font-black tracking-widest uppercase">${safeTitle}</div>
               <span class="text-[9px] font-bold ${tagColor} uppercase tracking-widest ${tagBg} px-2 py-0.5 rounded">${safePlatform}</span>
            </div>
            <div class="rounded-xl overflow-hidden border border-white/5 shadow-2xl">
              <iframe src="${p.embed_url}" width="100%" height="${iframeHeight}" loading="lazy" style="border:0;" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAllPlaylists();
    if (window.feather) feather.replace();
});
