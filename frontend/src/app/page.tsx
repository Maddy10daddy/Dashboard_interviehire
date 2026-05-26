import styles from './page.module.css';
import { Briefcase, Activity, Users, Settings } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>
          <span style={{ color: 'hsl(var(--accent-violet))' }}>Intervie</span>Hire
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <Briefcase size={18} />
            <span>Jobs</span>
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', color: 'hsl(var(--text-muted))' }}>
            <Activity size={18} />
            <span>Usage Overview</span>
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', color: 'hsl(var(--text-muted))' }}>
            <Users size={18} />
            <span>Team Access</span>
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', color: 'hsl(var(--text-muted))', marginTop: 'auto' }}>
            <Settings size={18} />
            <span>Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Good morning, User 🌤️</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
              Hiring decisions, now made with confidence
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={styles.statusIndicator}></span>
            <span style={{ fontSize: '0.875rem' }}>System Operational</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Senior Frontend Engineer</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
              <span>Published</span>
              <span>12 Candidates</span>
            </div>
            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Resume</span>
                <span>Screening</span>
                <span>Functional</span>
              </div>
            </div>
          </div>
          
          <div className={styles.card}>
            <div className={styles.cardTitle}>Backend Developer</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
              <span>Draft</span>
              <span>0 Candidates</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
