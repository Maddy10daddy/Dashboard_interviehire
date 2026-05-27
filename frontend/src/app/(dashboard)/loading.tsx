export default function DashboardLoading() {
  return (
    <section className="dashboard-view active-view">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px 0',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {/* Skeleton bars */}
        <div style={{ height: 20, width: '40%', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 180, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>
    </section>
  );
}
