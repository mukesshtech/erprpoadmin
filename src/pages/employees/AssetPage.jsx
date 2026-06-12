import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AssetPage() {
  const [assets, setAssets] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  const fetchData = (page = 1) => {
    setLoading(true);
    api.get(`/assets?page=${page}&per_page=15`).then((r) => { setAssets(r.data); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setFormData({ name: '', type: '', serial_no: '', model: '', purchase_date: '', purchase_cost: '', warranty_expiry: '', status: 'available' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) await api.put(`/assets/${editItem.id}`, formData);
      else await api.post('/assets', formData);
      setShowModal(false);
      showMsg(editItem ? 'Updated' : 'Added');
      fetchData(assets.current_page);
    } catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this asset?')) return;
    await api.delete(`/assets/${id}`);
    showMsg('Deleted');
    fetchData(assets.current_page);
  };

  const stats = [
    { label: 'Total Assets', value: assets.total },
    { label: 'Available', value: assets.data.filter((a) => a.status === 'available').length },
    { label: 'Assigned', value: assets.data.filter((a) => a.status === 'assigned').length },
    { label: 'Maintenance', value: assets.data.filter((a) => a.status === 'maintenance').length },
  ];

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Asset Management</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Assets</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => fetchData(1)}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={openAdd}>+ Add Asset</button>
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
            <tr><th>Name</th><th>Type</th><th>Serial No</th><th>Model</th><th>Purchase Date</th><th>Cost</th><th>Status</th><th>Assigned To</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={9} className="muted text-c" style={{ padding: 16 }}>Loading...</td></tr>
            )) : assets.data.length === 0 ? (
              <tr><td colSpan={9} className="muted text-c" style={{ padding: 32 }}>No assets found</td></tr>
            ) : assets.data.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.name}</td>
                <td>{a.type || '-'}</td>
                <td className="muted" style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{a.serial_no || '-'}</td>
                <td>{a.model || '-'}</td>
                <td style={{ fontSize: 12.5 }}>{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString('en-IN') : '-'}</td>
                <td style={{ fontWeight: 600 }}>₹{Number(a.purchase_cost).toLocaleString('en-IN')}</td>
                <td><span className={`tag ${a.status === 'available' ? 'green' : a.status === 'assigned' ? 'blue' : a.status === 'maintenance' ? 'amber' : ''}`}>{a.status}</span></td>
                <td>{a.assignedTo ? `${a.assignedTo.first_name || ''} ${a.assignedTo.last_name || ''}` : '-'}</td>
                <td>
                  <div className="flex" style={{ gap: 4 }}>
                    <span className="muted" style={{ cursor: 'pointer' }} onClick={() => { setEditItem(a); setFormData(a); setShowModal(true); }}>✏</span>
                    <span className="muted" style={{ cursor: 'pointer', color: 'var(--red)' }} onClick={() => handleDelete(a.id)}>🗑</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Total: {assets.total}</span>
          <div className="flex gap-8">
            <button disabled={assets.current_page <= 1} onClick={() => fetchData(assets.current_page - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{assets.current_page} / {assets.last_page}</span>
            <button disabled={assets.current_page >= assets.last_page} onClick={() => fetchData(assets.current_page + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="card" style={{ maxWidth: 520, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>{editItem ? 'Edit Asset' : 'Add Asset'}</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowModal(false)}>✕</span></div>
          <form onSubmit={handleSave}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name *</label><input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Type</label><input value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Model</label><input value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Serial No</label><input value={formData.serial_no || ''} onChange={e => setFormData({...formData, serial_no: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label>
                <select value={formData.status || 'available'} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="available">Available</option><option value="assigned">Assigned</option><option value="maintenance">Maintenance</option><option value="disposed">Disposed</option>
                </select>
              </div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Purchase Date</label><input type="date" value={formData.purchase_date || ''} onChange={e => setFormData({...formData, purchase_date: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Purchase Cost</label><input type="number" value={formData.purchase_cost || ''} onChange={e => setFormData({...formData, purchase_cost: e.target.value})} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm">{editItem ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
