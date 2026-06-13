'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useAppContext } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { DrawerBackdrop, CreateJobDrawer, InviteMemberDrawer, CandidateReportDrawer } from '@/components/drawers/Drawers';
import SpotlightModal from '@/components/SpotlightModal';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // ----------------------------------------------------
    // 1. Sliding Pill Tab Controller
    // ----------------------------------------------------
    const updateSlidingPill = (container: HTMLElement) => {
      if (!container) return;
      
      const containerStyle = window.getComputedStyle(container);
      if (containerStyle.position === 'static') {
        container.style.position = 'relative';
      }
      
      let pill = container.querySelector('.sliding-pill') as HTMLElement | null;
      if (!pill) {
        pill = document.createElement('span');
        pill.className = 'sliding-pill';
        container.insertBefore(pill, container.firstChild);
      }
      
      // Delay slightly to let React complete mounting/rendering the active tab element
      setTimeout(() => {
        const activeTab = container.querySelector('.active') || 
                          container.querySelector('.active-sub') ||
                          container.querySelector('.nav-item.active') || 
                          container.querySelector('.filter-tab.active') || 
                          container.querySelector('.table-tab-btn.active') || 
                          container.querySelector('.report-tab-btn.active') || 
                          container.querySelector('.jd-tab.active') ||
                          container.querySelector('.mode-toggle-btn.active') ||
                          container.querySelector('.active-tab');
                          
        if (!activeTab) {
          pill.style.opacity = '0';
          return;
        }
        
        const rect = activeTab.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        
        const top = rect.top - parentRect.top;
        const left = rect.left - parentRect.left;
        const width = rect.width;
        const height = rect.height;
        
        if (width === 0 || height === 0) {
          pill.style.opacity = '0';
          return;
        }
        
        pill.style.opacity = '1';
        pill.style.width = `${width}px`;
        pill.style.height = `${height}px`;
        pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        
        const activeStyle = window.getComputedStyle(activeTab);
        pill.style.borderRadius = activeStyle.borderRadius || '8px';
      }, 50);
    };

    const updateAllSlidingPills = () => {
      const tracks = document.querySelectorAll(
        '.sidebar-nav ul, .filter-options, .table-tabs, #team-status-tabs, .report-tabs, .jd-tabs, .sub-nav, .sourcing-mode-toggle'
      );
      tracks.forEach(track => updateSlidingPill(track as HTMLElement));
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isTab = target.closest('.nav-item, .filter-tab, .table-tab-btn, .report-tab-btn, .jd-tab, .sub-nav li, .mode-toggle-btn');
      if (isTab) {
        const track = target.closest('.sidebar-nav ul, .filter-options, .table-tabs, #team-status-tabs, .report-tabs, .jd-tabs, .sub-nav, .sourcing-mode-toggle') as HTMLElement;
        if (track) {
          updateSlidingPill(track);
        }
      }
    };

    updateAllSlidingPills();
    window.addEventListener('resize', updateAllSlidingPills);
    document.addEventListener('click', handleDocumentClick);

    // ----------------------------------------------------
    // 2. Three.js Background Shader Setup
    // ----------------------------------------------------
    const canvas = document.getElementById('crystal-shader-canvas') as HTMLCanvasElement | null;
    let renderer: THREE.WebGLRenderer | null = null;
    let clock: THREE.Clock | null = null;
    let animationFrameId = 0;
    let themeObserver: MutationObserver | null = null;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const handleMouseMoveShader = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2.0 - 1.0;
      mouseY = -(e.clientY / window.innerHeight) * 2.0 + 1.0;
    };

    const handleResizeShader = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (renderer) {
        renderer.setSize(newWidth, newHeight);
      }
      if (uniforms.u_resolution.value) {
        uniforms.u_resolution.value.set(newWidth, newHeight);
      }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_theme;
      uniform vec2 u_mouse;
      
      varying vec2 vUv;
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 uv = st;
        uv.x *= aspect;
        uv += u_mouse * 0.04;
        vec2 p = uv * 4.0;
        
        vec2 q = vec2(0.0);
        q.x = fbm(p + 0.08 * u_time);
        q.y = fbm(p + vec2(1.0) + 0.06 * u_time);
        
        vec2 r = vec2(0.0);
        r.x = fbm(p + 1.2 * q + vec2(1.7, 9.2) + 0.12 * u_time);
        r.y = fbm(p + 1.2 * q + vec2(8.3, 2.8) + 0.09 * u_time);
        
        float f = fbm(p + 1.1 * r);
        
        vec3 darkBg = vec3(0.025, 0.027, 0.035);
        vec3 darkPurple = vec3(0.035, 0.038, 0.048);
        vec3 darkBlue = vec3(0.03, 0.035, 0.045);
        vec3 darkAccent = vec3(0.02, 0.023, 0.03);
        
        vec3 darkColor = mix(darkBg, darkPurple, f * 0.4);
        darkColor = mix(darkColor, darkBlue, r.x * 0.3);
        darkColor = mix(darkColor, darkAccent, q.y * 0.2);
        
        vec3 lightBg = vec3(0.975, 0.970, 0.955);
        vec3 lightOrange = vec3(0.985, 0.925, 0.880);
        vec3 lightYellow = vec3(0.990, 0.965, 0.910);
        vec3 lightAccent = vec3(0.965, 0.945, 0.915);
        
        vec3 lightColor = mix(lightBg, lightOrange, f * 0.35);
        lightColor = mix(lightColor, lightYellow, r.y * 0.25);
        lightColor = mix(lightColor, lightAccent, q.x * 0.2);
        
        vec3 finalColor = mix(darkColor, lightColor, u_theme);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const themeState = {
      value: document.body.classList.contains('light-theme') ? 1.0 : 0.0
    };
    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_theme: { value: themeState.value },
      u_mouse: { value: new THREE.Vector2(0, 0) }
    };

    if (canvas && !canvas.dataset.initialized) {
      canvas.dataset.initialized = 'true';
      try {
        const container = canvas.parentElement;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
        camera.position.z = 1;

        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        window.addEventListener('mousemove', handleMouseMoveShader);
        window.addEventListener('resize', handleResizeShader);

        themeObserver = new MutationObserver(() => {
          const isLight = document.body.classList.contains('light-theme');
          const targetTheme = isLight ? 1.0 : 0.0;
          if (themeState.value !== targetTheme) {
            gsap.to(themeState, {
              value: targetTheme,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                uniforms.u_theme.value = themeState.value;
              }
            });
          }
        });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        clock = new THREE.Clock();
        const renderShader = () => {
          animationFrameId = requestAnimationFrame(renderShader);
          if (clock && renderer) {
            uniforms.u_time.value = clock.getElapsedTime();
            targetMouseX += (mouseX - targetMouseX) * 0.05;
            targetMouseY += (mouseY - targetMouseY) * 0.05;
            uniforms.u_mouse.value.set(targetMouseX, targetMouseY);
            renderer.render(scene, camera);
          }
        };
        renderShader();

        if (container) {
          container.classList.add('has-shader');
        }
      } catch (err) {
        console.warn("WebGL shader failed to initialize:", err);
        canvas.removeAttribute('data-initialized');
      }
    }

    // ----------------------------------------------------
    // 3. Fallback Drifting Orbs Mouse Handler
    // ----------------------------------------------------
    const handleMouseMoveFallback = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth - 0.5) * 60;
      const yPercent = (clientY / window.innerHeight - 0.5) * 60;
      
      const canvasEl = document.getElementById('crystal-shader-canvas');
      if (!canvasEl || !canvasEl.parentElement?.classList.contains('has-shader')) {
        gsap.to('.orb-1', { x: xPercent * 0.9, y: yPercent * 0.9, duration: 1.8, ease: 'power2.out' });
        gsap.to('.orb-2', { x: -xPercent * 0.7, y: -yPercent * 0.7, duration: 2.2, ease: 'power2.out' });
        gsap.to('.orb-3', { x: xPercent * 0.6, y: -yPercent * 0.6, duration: 2.4, ease: 'power2.out' });
        gsap.to('.orb-4', { x: -xPercent * 0.5, y: yPercent * 0.5, duration: 2.6, ease: 'power2.out' });
      }
    };
    window.addEventListener('mousemove', handleMouseMoveFallback);

    // ----------------------------------------------------
    // 4. Dynamic 3D Card Hover Tilting
    // ----------------------------------------------------
    const applyTactileTiltEffects = () => {
      const cards = document.querySelectorAll(
        '.job-card, .card-metric, .panel-setting, .agent-card, .terminal-box, .table-card, .panel-preview, .sourcing-tab-card, .glass-card'
      );
      
      cards.forEach(cardEl => {
        const card = cardEl as HTMLElement;
        if (card.dataset.tiltInitialized) return;
        card.dataset.tiltInitialized = 'true';

        card.style.setProperty('--shine-x', '50%');
        card.style.setProperty('--shine-y', '50%');

        const handleMouseMoveTilt = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left; 
          const y = e.clientY - rect.top;  
          
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          
          const angleX = -(y - yc) / (rect.height / 8); 
          const angleY = (x - xc) / (rect.width / 8);  
          
          gsap.to(card, {
            rotationX: angleX,
            rotationY: angleY,
            ease: 'power1.out',
            duration: 0.2,
            transformPerspective: 800,
            transformOrigin: 'center center'
          });
          
          card.style.setProperty('--shine-x', `${(x / rect.width) * 100}%`);
          card.style.setProperty('--shine-y', `${(y / rect.height) * 100}%`);
        };

        const handleMouseLeaveTilt = () => {
          gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            ease: 'power2.out',
            duration: 0.5
          });
          card.style.setProperty('--shine-x', '50%');
          card.style.setProperty('--shine-y', '50%');
        };

        card.addEventListener('mousemove', handleMouseMoveTilt);
        card.addEventListener('mouseleave', handleMouseLeaveTilt);
      });
    };

    applyTactileTiltEffects();

    // ----------------------------------------------------
    // 5. snappier spring view transitions
    // ----------------------------------------------------
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      gsap.fromTo(mainContent, 
        { opacity: 0, scale: 0.98, y: 10 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.45, 
          ease: "back.out(1.1)",
          clearProps: "transform,scale,opacity"
        }
      );
    }

    // ----------------------------------------------------
    // 6. MutationObserver & Event Cleanups
    // ----------------------------------------------------
    const observer = new MutationObserver((mutations) => {
      let shouldUpdatePills = false;
      let shouldUpdateTilts = false;
      for (const mutation of mutations) {
        if (
          (mutation.type === 'attributes' && mutation.attributeName === 'class') ||
          mutation.type === 'childList'
        ) {
          shouldUpdatePills = true;
          shouldUpdateTilts = true;
          break;
        }
      }
      if (shouldUpdatePills) {
        updateAllSlidingPills();
      }
      if (shouldUpdateTilts) {
        applyTactileTiltEffects();
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });

    const timer1 = setTimeout(updateAllSlidingPills, 100);
    const timer2 = setTimeout(updateAllSlidingPills, 400);
    const timer3 = setTimeout(updateAllSlidingPills, 1000);

    return () => {
      window.removeEventListener('resize', updateAllSlidingPills);
      document.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('mousemove', handleMouseMoveShader);
      window.removeEventListener('resize', handleResizeShader);
      window.removeEventListener('mousemove', handleMouseMoveFallback);
      themeObserver?.disconnect();
      observer.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (renderer) {
        renderer.dispose();
      }
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  return (
    <AppProvider>
      {/* Premium Glassmorphic Background Scene */}
      <div className="scene">
        <canvas id="crystal-shader-canvas" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      <div className="noise" />
      <div className="bg-grid" />
      <div className="bg-radial" />

      <ProtectedDashboardBody>{children}</ProtectedDashboardBody>
    </AppProvider>
  );
}

function ProtectedDashboardBody({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 16,
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div className="pulsing-dot green" style={{ width: 14, height: 14, background: '#34d099', boxShadow: '0 0 16px rgba(52,208,153,0.4)', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
          Authorising Session...
        </span>
      </div>
    );
  }

  return (
    <div className="dashboard-app">
      <Sidebar />

      <main className="main-content">
        <DashboardHeader />
        <div className="dashboard-view-body">
          {children}
        </div>
      </main>

      {/* Drawers */}
      <DrawerBackdrop />
      <CreateJobDrawer />
      <InviteMemberDrawer />
      <CandidateReportDrawer />
      
      {/* Spotlight Command Bar */}
      <SpotlightModal />
    </div>
  );
}

