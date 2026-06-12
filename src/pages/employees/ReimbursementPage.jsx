import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ReimbursementPage() {
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  const fetchData = (page = 1) => {
    setLoading(true);
    api.get(`/reimbursements?page=${page}&per_page=15`).then((r) => { setData(r.data); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, action) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this reimbursement?`)) return;
    try {
      await api.post(`/reimbursements/${id}/${action}`);
      showMsg(`${action === 'approve' ? 'Approved' : 'Rejected'}`);
      fetchData(data.current_page);
    } catch (err) { showMsg('Error', 'error'); }
  };

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Reimbursements</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Reimbursements</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => fetchData(1)}>⟳ Refresh</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Employee</th><th>Title</th><th>Amount</th><th>Bill Date</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={7} className="muted text-c" style={{ padding: 16 }}>Loading...</td></tr>
            )) : data.data.length === 0 ? (
              <tr><td colSpan={7} className="muted text-c" style={{ padding: 32 }}>No reimbursement records</td></tr>
            ) : data.data.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.employee?.first_name} {r.employee?.last_name}</td>
                <td>{r.title}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                <td style={{ fontSize: 12.5 }}>{r.bill_date ? new Date(r.bill_date).toLocaleDateString('en-IN') : '-'}</td>
                <td style={{ fontSize: 12.5 }}>{r.submitted_date ? new Date(r.submitted_date).toLocaleDateString('en-IN') : '-'}</td>
                <td><span className={`tag ${r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'}`}>{r.status}</span></td>
                <td>
                  {r.status === 'pending' ? (
                    <div className="flex" style={{ gap: 4 }}>
                      <span style={{ color: 'var(--green)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => handleAction(r.id, 'approve')}>✓ Approve</span>
                      <span style={{ color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => handleAction(r.id, 'reject')}>✕ Reject</span>
                    </div>
                  ) : (
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {r.status === 'approved' ? '✓ Approved' : r.status === 'rejected' ? '✕ Rejected' : r.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Total: {data.total}</span>
          <div className="flex gap-8">
            <button disabled={data.current_page <= 1} onClick={() => fetchData(data.current_page - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{data.current_page} / {data.last_page}</span>
            <button disabled={data.current_page >= data.last_page} onClick={() => fetchData(data.current_page + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
