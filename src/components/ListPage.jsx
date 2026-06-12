import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';

const inputTypes = { text: 'text', number: 'number', email: 'email', date: 'date', tel: 'tel', textarea: 'textarea', select: 'select' };

function guessFieldType(column, sampleValue) {
  if (column.endsWith('_id')) return inputTypes.select;
  if (column.endsWith('_date') || column === 'date') return inputTypes.date;
  if (column.includes('email')) return inputTypes.email;
  if (column.includes('phone')) return inputTypes.tel;
  if (column.includes('price') || column.includes('amount') || column.includes('revenue') || column.includes('cost') || column.includes('salary') || column.includes('rate') || column.includes('pay') || column.includes('deduction')) return inputTypes.number;
  if (column.includes('description') || column.includes('notes') || column.includes('address') || column.includes('reason') || column.includes('requirements')) return inputTypes.textarea;
  if (['status', 'priority', 'gender', 'employment_type', 'source', 'type', 'unit'].includes(column)) return inputTypes.select;
  return inputTypes.text;
}

function getSelectOptions(column) {
  const options = {
    status: ['active', 'inactive', 'pending', 'approved', 'rejected', 'draft', 'paid', 'unpaid', 'partial', 'open', 'closed', 'new', 'contacted', 'qualified', 'won', 'lost', 'converted', 'in_progress', 'cancelled', 'sent', 'confirmed', 'received', 'processing', 'shipped', 'delivered'],
    priority: ['low', 'medium', 'high', 'urgent'],
    gender: ['male', 'female', 'other'],
    employment_type: ['permanent', 'probation', 'contract', 'intern', 'temporary'],
    source: ['Website', 'LinkedIn', 'Google Ads', 'Facebook', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show'],
    type: ['public', 'optional', 'restricted'],
    unit: ['pcs', 'box', 'kg', 'litre', 'meter', 'hours', 'months'],
  };
  return options[column] || [];
}

function FormatVal({ val }) {
  if (val === null || val === undefined) return <span className="muted">-</span>;
  if (typeof val === 'boolean') return <span>{val ? 'Yes' : 'No'}</span>;
  if (typeof val === 'object') return <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{val?.name || val?.title || val?.label || 'Object'}</span>;
  return <span>{String(val)}</span>;
}

export default function ListPage({ title, endpoint, columns: customColumns }) {
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState('');

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    api.get(`${endpoint}?page=${page}&search=${search}&per_page=15`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [endpoint, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => { e.preventDefault(); fetchData(1); };
  const handleClearSearch = () => { setSearch(''); setTimeout(() => fetchData(1), 0); };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    await api.delete(`${endpoint}/${id}`);
    showMsg('Record deleted');
    fetchData(data.current_page);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected records?`)) return;
    await Promise.all(selected.map((id) => api.delete(`${endpoint}/${id}`).catch(() => {})));
    setSelected([]);
    showMsg(`${selected.length} records deleted`);
    fetchData(data.current_page);
  };

  const openAdd = () => {
    setEditItem(null);
    const fd = {};
    if (data.data.length > 0) {
      Object.keys(data.data[0]).forEach((k) => { if (!['id', 'created_at', 'updated_at', 'deleted_at', 'pivot'].includes(k)) fd[k] = ''; });
    }
    setFormData(fd);
    setViewItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const fd = {};
    Object.keys(item).forEach((k) => {
      if (!['id', 'created_at', 'updated_at', 'deleted_at', 'pivot'].includes(k)) {
        fd[k] = typeof item[k] === 'object' && item[k] ? item[k]?.id || '' : item[k] ?? '';
      }
    });
    setFormData(fd);
    setViewItem(null);
    setModalOpen(true);
  };

  const handleInputChange = (col, value) => setFormData(prev => ({ ...prev, [col]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) { await api.put(`${endpoint}/${editItem.id}`, formData); showMsg('Updated successfully'); }
      else { await api.post(endpoint, formData); showMsg('Created successfully'); }
      setModalOpen(false);
      fetchData(data.current_page);
    } catch (err) { alert(err.response?.data?.message || 'Error saving record'); }
    setSaving(false);
  };

  const columns = customColumns || (data.data.length > 0
    ? Object.keys(data.data[0]).filter(k => !['id', 'created_at', 'updated_at', 'deleted_at', 'pivot'].includes(k))
    : []);

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <div className="breadcrumb"><span>Manage</span><span>/</span><span className="c">{title}</span></div>
        </div>
        <div className="head-actions">
          <form onSubmit={handleSearch} style={{ position: 'relative', display: 'inline-block' }}>
            <div className="search" style={{ width: 200 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
            </div>
            {search && <span className="muted" style={{ position: 'absolute', right: 8, top: 7, cursor: 'pointer', fontSize: 14 }} onClick={handleClearSearch}>✕</span>}
          </form>
          {selected.length > 0 && <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleBulkDelete}>Delete ({selected.length})</button>}
          <button className="btn btn-sm" onClick={() => fetchData(data.current_page)}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={openAdd}>+ Add New</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" checked={selected.length === data.data.length && data.data.length > 0}
                  onChange={e => setSelected(e.target.checked ? data.data.map(r => r.id) : [])} />
              </th>
              <th>#</th>
              {columns.slice(0, 7).map(col => <th key={col}>{col.replace(/_/g, ' ')}</th>)}
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={columns.slice(0, 7).length + 3}><div className="muted text-c" style={{ padding: 16 }}>Loading...</div></td></tr>
            )) : data.data.length === 0 ? (
              <tr><td colSpan={columns.slice(0, 7).length + 3}><div className="muted text-c" style={{ padding: 40 }}>No records found</div></td></tr>
            ) : data.data.map((row, i) => (
              <tr key={row.id} style={{ background: selected.includes(row.id) ? '#F5F3FF' : undefined }}>
                <td>
                  <input type="checkbox" checked={selected.includes(row.id)}
                    onChange={e => setSelected(e.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))} />
                </td>
                <td className="muted">{(data.current_page - 1) * 15 + i + 1}</td>
                {columns.slice(0, 7).map(col => {
                  const val = row[col];
                  const isDate = col.endsWith('_date') || col === 'date' || col === 'created_at';
                  const isMoney = typeof val === 'number' && ['price', 'amount', 'revenue', 'cost', 'salary', 'pay', 'budget', 'total'].some(k => col.includes(k));
                  const isStatus = ['status', 'delivery_status', 'employment_type'].includes(col);
                  return (
                    <td key={col}>
                      {typeof val === 'object' && val ? <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{val?.name || val?.title || 'Object'}</span>
                      : isStatus ? <span className={`tag ${val === 'active' || val === 'paid' || val === 'approved' || val === 'delivered' || val === 'won' || val === 'completed' ? 'green' : val === 'pending' || val === 'draft' ? 'amber' : val === 'cancelled' || val === 'lost' || val === 'rejected' ? 'red' : 'blue'}`}>{val || '-'}</span>
                      : isDate ? <span className="muted" style={{ fontSize: 11.5 }}>{val ? new Date(val).toLocaleDateString() : '-'}</span>
                      : isMoney ? <b>${Number(val).toLocaleString()}</b>
                      : <FormatVal val={val} />}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'right' }}>
                  <div className="flex" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <span className="muted" style={{ cursor: 'pointer', fontSize: 12.5 }} onClick={() => { setViewItem(row); setModalOpen(true); }}>👁</span>
                    <span className="muted" style={{ cursor: 'pointer', fontSize: 12.5 }} onClick={() => openEdit(row)}>✎</span>
                    <span className="muted" style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--red)' }} onClick={() => handleDelete(row.id)}>✕</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#F8F9FC', fontSize: 12.5 }}>
          <span className="muted">Total <b style={{ color: 'var(--ink)' }}>{data.total}</b> records {selected.length > 0 && <span style={{ color: 'var(--blue)' }}>| {selected.length} selected</span>}</span>
          <div className="flex items-center gap-12">
            <button className="btn btn-sm" disabled={data.current_page <= 1} onClick={() => fetchData(data.current_page - 1)}>← Previous</button>
            <span className="muted" style={{ fontSize: 12 }}>Page {data.current_page} of {data.last_page}</span>
            <button className="btn btn-sm" disabled={data.current_page >= data.last_page} onClick={() => fetchData(data.current_page + 1)}>Next →</button>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen && !viewItem} onClose={() => { if (!saving) setModalOpen(false); }} title={editItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`} size="xl">
        <form onSubmit={handleSave}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.keys(formData).filter(k => !['id', 'created_at', 'updated_at', 'deleted_at', 'pivot', 'token'].includes(k)).slice(0, 12).map(col => {
              const type = guessFieldType(col, formData[col]);
              const options = getSelectOptions(col);
              const isLong = type === inputTypes.textarea;
              return (
                <div key={col} style={isLong ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
                    {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                  {type === inputTypes.textarea ? (
                    <textarea value={formData[col] || ''} onChange={e => handleInputChange(col, e.target.value)} rows={3} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical' }} />
                  ) : type === inputTypes.select ? (
                    <select value={formData[col] || ''} onChange={e => handleInputChange(col, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                      <option value="">Select...</option>
                      {options.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={formData[col] || ''} onChange={e => handleInputChange(col, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <button type="button" className="btn btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalOpen && viewItem !== null} onClose={() => { setViewItem(null); setModalOpen(false); }} title={`${title.slice(0, -1)} Details`} size="2xl">
        {viewItem && (
          <>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {Object.keys(viewItem).filter(k => !['pivot'].includes(k)).map(col => {
                const val = viewItem[col];
                const isLong = col === 'description' || col === 'notes' || col === 'address' || col === 'requirements';
                const isDate = col.endsWith('_date') || col === 'date';
                const isMoney = typeof val === 'number' && ['price', 'amount', 'revenue', 'cost', 'salary', 'total'].some(k => col.includes(k));
                const isStatus = ['status', 'delivery_status', 'employment_type'].includes(col);
                return (
                  <div key={col} style={isLong ? { gridColumn: '1 / -1' } : {}}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>{col.replace(/_/g, ' ')}</label>
                    <div style={{ marginTop: 2, fontSize: 13 }}>
                      {typeof val === 'object' && val ? <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{val?.name || val?.title || '-'}</span>
                      : isStatus ? <span className={`tag ${val === 'active' || val === 'paid' ? 'green' : val === 'pending' ? 'amber' : 'red'}`}>{val || '-'}</span>
                      : isDate ? <span>{val ? new Date(val).toLocaleDateString() : '-'}</span>
                      : isMoney ? <b>${Number(val).toLocaleString()}</b>
                      : <span>{String(val ?? '-')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-8 mt-16" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <button className="btn btn-sm" onClick={() => { setViewItem(null); setModalOpen(false); }}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
