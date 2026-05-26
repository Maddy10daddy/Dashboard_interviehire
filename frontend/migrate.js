const fs = require('fs');
const html = fs.readFileSync('../devasri-dashboard/dashboard.html', 'utf8');
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
if (!bodyMatch) throw new Error('No body found');
let bodyHTML = bodyMatch[1];
// Escape backticks and $ for template literal
bodyHTML = bodyHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$');

const pageTsx = `'use client';

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const { status, messages } = useWebSocket({ url: wsUrl });
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // Dynamically import the legacy vanilla JS files
    const loadLegacy = async () => {
      try {
        // Expose GSAP and THREE globally since main.js might expect them
        window.THREE = await import('three');
        window.gsap = (await import('gsap')).gsap;
        
        await import('../legacy/dashboard.js');
        await import('../legacy/main.js');
      } catch (err) {
        console.error('Failed to load legacy scripts', err);
      }
    };
    
    // Give DOM a tick to paint before firing heavy Three/GSAP logic
    setTimeout(loadLegacy, 100);
  }, []);

  return (
    <>
      <div 
        dangerouslySetInnerHTML={{ __html: \`${bodyHTML}\` }} 
      />
      {/* Invisible status tracker for WS */}
      <div 
        id="nextjs-ws-status" 
        data-status={status} 
        style={{ display: 'none' }}
      ></div>
    </>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', pageTsx);
console.log('Successfully migrated HTML to page.tsx');
