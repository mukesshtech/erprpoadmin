import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function LeavePage() {
  const [leaves, setLeaves] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  const fetchLeaves = (page = 1) => {
    setLoading(true);
    api.get(`/leaves?page=${page}&per_page=15&search=${search}`).then((r) => { setLeaves(r.data); setLoading(false); });
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (id, action) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this leave request?`)) return;
    try {
      await api.post(`/leaves/${id}/${action}`);
      showMsg(`${action === 'approve' ? 'Approved' : 'Rejected'}`);
      fetchLeaves(leaves.current_page);
    } catch (err) { showMsg('Error', 'error'); }
  };

  const filtered = leaves.data.filter((l) => filter === 'all' || l.status === filter);

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Leave Management</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Leaves</span></div>
        </div>
        <div className="head-actions">
          <div className="filter-group" style={{ display: 'flex', gap: 4, marginRight: 8 }}>
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-xs ${filter === f ? 'btn-primary' : ''}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="search" style={{ width: 160, marginRight: 8 }}>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchLeaves(1)} />
          </div>
          <button className="btn btn-sm" onClick={() => fetchLeaves(1)}>⟳ Refresh</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={8} className="muted text-c" style={{ padding: 16 }}>Loading...</td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="muted text-c" style={{ padding: 32 }}>No leave records found</td></tr>
            ) : filtered.map((l) => {
              const start = new Date(l.start_date);
              const end = new Date(l.end_date);
              const days = Math.ceil((end - start) / (86400000)) + 1;
              return (
                <tr key={l.id}>
                  <td>
                    <b>{l.employee?.first_name} {l.employee?.last_name}</b>
                    <span className="muted block" style={{ fontSize: 11 }}>{l.employee?.employee_code}</span>
                  </td>
                  <td>{l.leave_type?.name || '-'}</td>
                  <td style={{ fontSize: 12.5 }}>{start.toLocaleDateString('en-IN')}</td>
                  <td style={{ fontSize: 12.5 }}>{end.toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>{days}</td>
                  <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '-'}</td>
                  <td><span className={`tag ${l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : l.status === 'pending' ? 'amber' : ''}`}>{l.status}</span></td>
                  <td>
                    {l.status === 'pending' ? (
                      <div className="flex" style={{ gap: 4 }}>
                        <span style={{ color: 'var(--green)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => handleAction(l.id, 'approve')}>✓ Approve</span>
                        <span style={{ color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => handleAction(l.id, 'reject')}>✕ Reject</span>
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: 11.5 }}>
                        {l.status === 'approved' ? '✓ Approved' : l.status === 'rejected' ? '✕ Rejected' : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Total: {leaves.total}</span>
          <div className="flex gap-8">
            <button disabled={leaves.current_page <= 1} onClick={() => fetchLeaves(leaves.current_page - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{leaves.current_page} / {leaves.last_page}</span>
            <button disabled={leaves.current_page >= leaves.last_page} onClick={() => fetchLeaves(leaves.current_page + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
