import { useEffect, useState } from 'react';

type HealthResponse = {
  ok: boolean;
  service?: string;
  timestamp?: string;
};

const quickLinks = [
  { label: 'Frontend principal', href: 'http://localhost:5173/login' },
  { label: 'Workspace AI', href: 'http://localhost:3000/login' },
  { label: 'API health', href: 'http://localhost:3001/api/health' }
];

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetch('http://localhost:3001/api/health')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as HealthResponse;
      })
      .then((data) => {
        if (active) {
          setHealth(data);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudo consultar la API');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Whirlpool Adaptive Platform</p>
        <h1>Proyecto listo para desarrollo local</h1>
        <p className="lead">
          El backend, la app principal y el workspace AI ya están preparados. Esta pantalla confirma
          que la app raíz está levantando correctamente con Vite.
        </p>

        <div className="status-row">
          <span className={`status-pill ${health?.ok ? 'ok' : 'pending'}`}>
            {health?.ok ? 'API activa' : 'API verificando'}
          </span>
          <span className="status-text">
            {health?.service ?? 'backend'} {health?.timestamp ? `- ${health.timestamp}` : ''}
          </span>
        </div>

        {error ? <p className="error-box">{error}</p> : null}

        <div className="link-grid">
          {quickLinks.map((link) => (
            <a key={link.label} className="link-card" href={link.href} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              <strong>{link.href}</strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
