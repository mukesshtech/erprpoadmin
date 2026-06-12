import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('erp@dipanshutech.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, marginBottom: 16 }}>◎</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--ink)' }}>Smart<span style={{ color: 'var(--primary)' }}>HR</span></h1>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>Sign in to your ERP account</p>
          </div>
          <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 28 }}>
            {error && <div style={{ background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5, outline: 'none', background: '#F5F6FA', color: 'var(--ink)' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5, outline: 'none', background: '#F5F6FA', color: 'var(--ink)' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn" style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 13.5 }}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
