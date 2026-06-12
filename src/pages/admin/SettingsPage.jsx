import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    api.get('/settings').then((r) => {
      if (r.data && typeof r.data === 'object') setSettings(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', settings);
      showMsg('Settings saved');
    } catch (err) { showMsg('Error saving settings', 'error'); }
    setSaving(false);
  };

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" /></div></div>;

  const fields = [
    { key: 'company_name', label: 'Company Name', type: 'text' },
    { key: 'company_email', label: 'Company Email', type: 'email' },
    { key: 'company_phone', label: 'Company Phone', type: 'tel' },
    { key: 'company_address', label: 'Company Address', type: 'textarea' },
    { key: 'company_gst', label: 'GST Number', type: 'text' },
    { key: 'company_pan', label: 'PAN Number', type: 'text' },
    { key: 'currency', label: 'Currency', type: 'text' },
    { key: 'timezone', label: 'Timezone', type: 'text' },
    { key: 'date_format', label: 'Date Format', type: 'text' },
    { key: 'financial_year_start', label: 'Financial Year Start', type: 'text' },
  ];

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Company Settings</h1>
          <div className="breadcrumb"><span>Admin</span><span>/</span><span className="c">Settings</span></div>
        </div>
        <div className="head-actions">
          <button className="btn-primary btn btn-sm" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : '💾 Save Settings'}</button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card" style={{ padding: 24 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fields.map((f) => (
            <div key={f.key} style={f.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
              <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={settings[f.key] || ''} onChange={(e) => update(f.key, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical', minHeight: 80 }} />
              ) : (
                <input type={f.type} value={settings[f.key] || ''} onChange={(e) => update(f.key, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : '💾 Save Settings'}</button>
        </div>
      </form>
    </div>
  );
}
