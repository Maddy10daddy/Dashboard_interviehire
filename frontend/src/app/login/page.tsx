'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { soundEngine } from '@/components/SoundEngine';
import { AppProvider, useAppContext } from '@/context/AppContext';

export default function LoginPage() {
  return (
    <AppProvider>
      <LoginForm />
    </AppProvider>
  );
}

function LoginForm() {
  const { login, isAuthenticated } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to /jobs
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/jobs');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Play click sound
    soundEngine.playClick();

    try {
      const success = await login(email, password);
      if (success) {
        // Play success chime
        soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.2, 0.08);
        router.push('/jobs');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      // Play error chime
      soundEngine.playChime([220.00, 196.00], 0.3, 0.1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden',
      background: '#08090d',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Background elements */}
      <div style={{
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(0,0,0,0) 70%)',
        top: '-10%',
        left: '-10%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-15%',
        right: '-10%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Floating orbs */}
      <div className="orb orb-1" style={{ top: '20%', left: '15%', opacity: 0.3 }} />
      <div className="orb orb-2" style={{ bottom: '25%', right: '20%', opacity: 0.2 }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        zIndex: 10
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px'
        }}>
          <img src="/Logo.png" alt="intervieHire Logo" style={{ height: '36px', width: 'auto' }} />
          <span style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            intervie<span style={{ color: '#8b5cf6' }}>Hire</span>
          </span>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            Welcome Back
          </h2>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-muted)',
            marginBottom: '32px'
          }}>
            Enter your credentials to access the client portal.
          </p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#f87171',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="email" style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }} />
                <input
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="password" style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }} />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#08090d',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.25s ease',
                marginTop: '12px',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)'
              }}
            >
              {isLoading ? 'Authorising...' : 'Sign In'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Dev Hint */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            padding: '12px',
            background: 'rgba(139, 92, 246, 0.04)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            color: 'var(--color-text-muted)',
            fontSize: '0.78rem'
          }}>
            <Sparkles size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            <span>
              <strong>Dev Hint:</strong> Use email <code>devasri@zeko.ai</code> and default password <code>admin123</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
