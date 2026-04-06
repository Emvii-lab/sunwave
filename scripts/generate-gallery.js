#!/usr/bin/env node
/**
 * Sunwave Hub — Weekly Gallery Generator
 * Calls the Gemini API to generate 6 retrowave images and saves them as PNG files.
 * Run via: node scripts/generate-gallery.js
 * Requires env: GEMINI_API_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// --- PROMPT RANDOMIZER ---
// Each image slot picks one subject, one mood, one detail, and one style tag at random.
// This ensures every weekly batch looks different.

const SUBJECTS = [
    'an infinite neon grid highway stretching to the horizon',
    'a glowing sun setting over a flat desert landscape',
    'a futuristic cityscape with towering neon skyscrapers',
    'silhouettes of palm trees against a vivid sunset',
    'a lone chrome sports car on an empty coastal road',
    'a massive wireframe pyramid floating above clouds',
    'a retro cassette tape melting into a gradient sunset',
    'an astronaut drifting through a synthwave nebula',
    'a chrome motorcycle speeding down a neon-lit tunnel',
    'a beach at golden hour with laser beams in the sky',
    'a retro arcade cabinet glowing in a dark neon room',
    'floating geometric shapes and chrome orbs in a starfield',
    'a neon-lit underground subway station with no passengers',
    'a synthwave wolf howling at a massive neon moon',
    'a retro boombox surrounded by glowing equalizer bars',
    'a rainy city street reflecting purple and pink neon signs',
    'a vinyl record spinning against a retrowave sunset',
    'a retro TV set showing static on a glowing grid floor',
    'an eagle made of neon light soaring over mountains',
    'a retrofuturistic spaceship flying over a neon ocean',
];

const MOODS = [
    'at night with a deep purple sky full of stars',
    'bathed in warm pink and orange sunset light',
    'under a vivid magenta and cyan gradient sky',
    'in a rainy atmosphere with neon reflections on wet ground',
    'in a surreal dreamscape with glowing fog',
    'in a crisp dawn light with golden and violet hues',
    'under a stormy sky lit by flashes of electric blue',
    'in total darkness lit only by neon signs and laser grids',
    'in a hazy golden hour with long lens flares',
    'beneath a massive full moon casting neon shadows',
];

const DETAILS = [
    'with a perspective grid receding to a distant vanishing point',
    'with scanlines and VHS glitch artifacts overlaid',
    'with chrome reflections and metallic surfaces',
    'with glowing particles and light trails',
    'with vivid lens flares and bokeh light orbs',
    'with retro 80s geometric shapes and patterns',
    'with volumetric fog and atmospheric depth',
    'with holographic elements and translucent overlays',
    'with sharp neon outlines and deep shadow contrast',
    'with a low camera angle emphasizing epic scale',
];

const STYLES = [
    'synthwave digital art, ultra-detailed, vibrant neon colors, 4K',
    'outrun aesthetic, cinematic composition, rich saturated palette',
    'retrowave illustration, bold graphic style, high contrast neon',
    'vaporwave art direction, dreamy soft glow, pastel neon palette',
    'sunwave aesthetic, warm gradient colors, tropical retro feel',
    '80s science fiction concept art, polished and hyper-detailed',
    'dark synthwave, moody atmosphere, electric cyan and hot pink',
    'retrowave poster art style, clean composition, iconic imagery',
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildPrompt() {
    return `${pick(SUBJECTS)}, ${pick(MOODS)}, ${pick(DETAILS)}, ${pick(STYLES)}`;
}

const GALLERY_IMAGES = [
    { filename: 'neon_horizon.png' },
    { filename: 'vhs_dreams.png' },
    { filename: 'retro_highway.png' },
    { filename: 'city_of_lights.png' },
    { filename: 'laser_palm.png' },
    { filename: 'magenta_sky.png' },
].map(img => ({ ...img, prompt: buildPrompt() }));

async function generateImage(prompt) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT']
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No content parts in response');

    for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
            return Buffer.from(part.inlineData.data, 'base64');
        }
    }
    throw new Error('No image data found in response');
}

async function main() {
    console.log('Sunwave Hub — Generating weekly gallery images with Gemini...\n');

    for (const img of GALLERY_IMAGES) {
        const outputPath = path.join(OUTPUT_DIR, img.filename);
        console.log(`Generating: ${img.filename}...`);
        try {
            const imageBuffer = await generateImage(img.prompt);
            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`  ✓ Saved to ${img.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
        } catch (err) {
            console.error(`  ✗ Failed: ${err.message}`);
            // Don't exit — continue with remaining images
        }
        // Small delay to avoid hitting rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\nDone.');
}

main();
