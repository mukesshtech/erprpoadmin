import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  New: { bg: '#EFF6FF', border: '#3B7DDD', dot: '#3B7DDD' },
  Contacted: { bg: '#F5F3FF', border: '#8B5CF6', dot: '#8B5CF6' },
  Qualified: { bg: '#ECFEFF', border: '#06B6D4', dot: '#06B6D4' },
  Proposal: { bg: '#FFFBEB', border: '#F59E0B', dot: '#F59E0B' },
  Negotiation: { bg: '#FFF7ED', border: '#F97316', dot: '#F97316' },
  Won: { bg: '#F0FDF4', border: '#10B981', dot: '#10B981' },
  Lost: { bg: '#FEF2F2', border: '#EF4444', dot: '#EF4444' },
};

export default function LeadPipelinePage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState({ title: '', company: '', contact_person: '', email: '', phone: '', status_id: '', source: '', deal_value: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const dragNode = useRef(null);

  const showMsg = (t, type = 'success') => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        api.get('/leads?per_page=100'),
        api.get('/lead-statuses?per_page=20'),
      ]);
      setLeads(l.data.data || []);
      setStatuses(s.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditLead(null); setForm({ title: '', company: '', contact_person: '', email: '', phone: '', status_id: '', source: '', deal_value: '' }); setShowModal(true); };
  const openEdit = (lead) => { setEditLead(lead); setForm({ title: lead.title, company: lead.company || '', contact_person: lead.contact_person || '', email: lead.email || '', phone: lead.phone || '', status_id: lead.status_id || lead.status?.id || '', source: lead.source || '', deal_value: lead.deal_value || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editLead) { await api.put(`/leads/${editLead.id}`, form); showMsg('Lead updated'); }
      else { await api.post('/leads', form); showMsg('Lead added'); }
      setShowModal(false);
      fetchData();
    } catch (err) { showMsg(err.response?.data?.message || 'Error saving', 'error'); }
    setSaving(false);
  };

  const handleStatusChange = async (leadId, newStatusId) => {
    try {
      await api.post(`/leads/${leadId}/status`, { status_id: newStatusId });
      showMsg('Lead moved');
      fetchData();
    } catch (err) { showMsg('Error moving lead', 'error'); }
  };

  const handleDragStart = (e, lead) => {
    dragNode.current = lead;
    setDraggingLeadId(lead.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id.toString());
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverStatus(null);
    dragNode.current = null;
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(statusId);
  };

  const handleDragLeave = (e, statusId) => {
    if (dragOverStatus === statusId) setDragOverStatus(null);
  };

  const handleDrop = (e, targetStatusId) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData('text/plain'));
    if (leadId && targetStatusId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status_id !== targetStatusId) {
        handleStatusChange(leadId, targetStatusId);
      }
    }
    setDraggingLeadId(null);
    setDragOverStatus(null);
  };

  const filteredLeads = leads.filter(l => (l.title || '').toLowerCase().includes(search.toLowerCase()) || (l.company || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Lead Pipeline</h1>
          <div className="breadcrumb"><span>CRM</span><span>/</span><span className="c">Lead Pipeline</span></div>
        </div>
        <div className="head-actions">
          <div className="search" style={{ width: 200, marginRight: 8 }}>
            <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={openAdd}>+ Add Lead</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 20, minHeight: '60vh' }}>
        {statuses.map(status => {
          const color = COLORS[status.name] || { bg: '#F8F9FC', border: '#9CA3AF', dot: '#6B7280' };
          const statusLeads = filteredLeads.filter(l => l.status_id === status.id || l.status?.name === status.name);
          const isDragOver = dragOverStatus === status.id;
          return (
            <div
              key={status.id}
              style={{ flexShrink: 0, width: 270 }}
              onDragOver={e => handleDragOver(e, status.id)}
              onDragLeave={e => handleDragLeave(e, status.id)}
              onDrop={e => handleDrop(e, status.id)}
            >
              <div className="flex between" style={{ marginBottom: 12, padding: '0 4px' }}>
                <div className="flex items-center gap-8">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color.dot }} />
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{status.name}</h3>
                  <span style={{ fontSize: 11, color: 'var(--muted)', background: '#F4F6FA', padding: '1px 7px', borderRadius: 10 }}>{statusLeads.length}</span>
                </div>
              </div>
              <div
                style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  minHeight: 80, padding: 4, borderRadius: 8,
                  background: isDragOver ? '#F0FDF4' : 'transparent',
                  border: isDragOver ? '2px dashed var(--green)' : '2px dashed transparent',
                  transition: 'background .15s, border .15s'
                }}
              >
                {statusLeads.map(lead => {
                  const isDragging = draggingLeadId === lead.id;
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: '#fff', borderRadius: 10, border: '1px solid var(--line)',
                        borderLeft: `3px solid ${color.border}`, padding: 12,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.4 : 1,
                        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
                        transition: 'opacity .15s, transform .15s',
                        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.12)' : 'none',
                        userSelect: 'none',
                      }}
                      onClick={() => !isDragging && openEdit(lead)}
                    >
                      <div className="flex between">
                        <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{lead.title}</h4>
                        <span className="muted" style={{ cursor: isDragging ? 'grabbing' : 'grab', fontSize: 13 }}>⠿</span>
                      </div>
                      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {lead.company && <span>🏢 {lead.company}</span>}
                        {lead.contact_person && <span>👤 {lead.contact_person}</span>}
                        {lead.deal_value && <span>💰 ${Number(lead.deal_value).toLocaleString()}</span>}
                        {lead.email && <span>✉ {lead.email}</span>}
                      </div>
                      <div className="flex" style={{ gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                        {statuses.filter(s => s.id !== lead.status_id).slice(0, 3).map(s => (
                          <span key={s.id} className="tag" style={{ background: '#F4F6FA', fontSize: 10, cursor: 'pointer' }}
                            onClick={e => { e.stopPropagation(); handleStatusChange(lead.id, s.id); }}>
                            → {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {statusLeads.length === 0 && (
                  <div className="muted text-c" style={{ fontSize: 12, padding: '24px 8px', border: '1px dashed var(--line)', borderRadius: 8 }}>
                    {isDragOver ? 'Drop here' : 'No leads'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="card" style={{ maxWidth: 540, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between">
            <h3>{editLead ? 'Edit Lead' : 'Add New Lead'}</h3>
            <span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowModal(false)}>✕</span>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Lead Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter lead title" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Company</label>
                <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Contact Person</label>
                <input type="text" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Full name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Source</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="">Select source</option>
                  <option value="Google">Google</option>
                  <option value="Paid">Paid</option>
                  <option value="Campaigns">Campaigns</option>
                  <option value="Referrals">Referrals</option>
                  <option value="Social Media">Social Media</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Deal Value</label>
                <input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} placeholder="5000" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Status</label>
                <select required value={form.status_id} onChange={e => setForm(f => ({ ...f, status_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="">Select status</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : editLead ? 'Update' : 'Create Lead'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
