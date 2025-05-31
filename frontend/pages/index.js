export default function FallbackHome() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Garnet AI Compliance</h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.6 }}>
        Welcome to the Garnet AI Compliance platform. The application is currently being updated.
        Please check back soon!
      </p>
      <a 
        href="mailto:support@garnetai.com" 
        style={{ 
          marginTop: '2rem', 
          padding: '0.75rem 1.5rem', 
          backgroundColor: '#4a5568', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '0.375rem',
          fontWeight: 'bold'
        }}
      >
        Contact Support
      </a>
    </div>
  );
} 