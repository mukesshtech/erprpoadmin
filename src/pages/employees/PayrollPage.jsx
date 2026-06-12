import { useState, useEffect } from 'react';
import api from '../../services/api';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  const fetchPayrolls = (page = 1) => {
    setLoading(true);
    api.get(`/payrolls?page=${page}&per_page=15`).then((r) => { setPayrolls(r.data); setLoading(false); });
  };

  useEffect(() => {
    fetchPayrolls();
    api.get('/employees?per_page=100').then((r) => setEmployees(r.data.data || []));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payrolls/generate', genForm);
      setShowGenerate(false);
      showMsg('Payroll generated');
      fetchPayrolls();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const stats = [
    { label: 'Total Payrolls', value: payrolls.total },
    { label: 'This Month', value: payrolls.data.filter((p) => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()).length },
    { label: 'Paid', value: payrolls.data.filter((p) => p.status === 'paid').length },
    { label: 'Pending', value: payrolls.data.filter((p) => p.status === 'pending').length },
  ];

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Payroll Management</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Payroll</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => fetchPayrolls(1)}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => setShowGenerate(true)}>+ Generate Payroll</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat">
            <span className="muted" style={{ fontSize: 12 }}>{s.label}</span>
            <b style={{ fontSize: 22, color: 'var(--ink)' }}>{s.value}</b>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Employee</th><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Gross</th><th>Net Pay</th><th>Status</th><th>Paid On</th></tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={9} className="muted text-c" style={{ padding: 16 }}>Loading...</td></tr>
            )) : payrolls.data.length === 0 ? (
              <tr><td colSpan={9} className="muted text-c" style={{ padding: 32 }}>No payroll records</td></tr>
            ) : payrolls.data.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.employee?.first_name} {p.employee?.last_name}</b>
                  <span className="muted block" style={{ fontSize: 11 }}>{p.employee?.employee_code}</span>
                </td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{monthNames[p.month - 1]} {p.year}</td>
                <td>₹{Number(p.basic_salary).toLocaleString('en-IN')}</td>
                <td>₹{Number(p.allowances).toLocaleString('en-IN')}</td>
                <td>₹{Number(p.deductions).toLocaleString('en-IN')}</td>
                <td>₹{Number(p.gross_pay).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: 'var(--ink)' }}>₹{Number(p.net_pay).toLocaleString('en-IN')}</td>
                <td><span className={`tag ${p.status === 'paid' ? 'green' : p.status === 'pending' ? 'amber' : 'red'}`}>{p.status}</span></td>
                <td style={{ fontSize: 12.5 }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Total: {payrolls.total}</span>
          <div className="flex gap-8">
            <button disabled={payrolls.current_page <= 1} onClick={() => fetchPayrolls(payrolls.current_page - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{payrolls.current_page} / {payrolls.last_page}</span>
            <button disabled={payrolls.current_page >= payrolls.last_page} onClick={() => fetchPayrolls(payrolls.current_page + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>

      {showGenerate && <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
        <div className="card" style={{ maxWidth: 460, margin: '10vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Generate Payroll</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowGenerate(false)}>✕</span></div>
          <form onSubmit={handleGenerate}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Employee</label>
                <select value={genForm.employee_id} onChange={(e) => setGenForm({ ...genForm, employee_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="">All Employees</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </select>
              </div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Month</label>
                <select value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: parseInt(e.target.value) })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  {monthNames.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                </select>
              </div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Year</label>
                <select value={genForm.year} onChange={(e) => setGenForm({ ...genForm, year: parseInt(e.target.value) })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowGenerate(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Generate'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
