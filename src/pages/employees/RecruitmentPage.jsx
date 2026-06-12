import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STAGE_COLORS = {
  Applied: { bg: '#EFF6FF', border: '#3B7DDD', dot: '#3B7DDD' },
  Screening: { bg: '#F5F3FF', border: '#8B5CF6', dot: '#8B5CF6' },
  Interviewed: { bg: '#FFFBEB', border: '#F59E0B', dot: '#F59E0B' },
  Shortlisted: { bg: '#ECFEFF', border: '#06B6D4', dot: '#06B6D4' },
  Hired: { bg: '#F0FDF4', border: '#10B981', dot: '#10B981' },
  Rejected: { bg: '#FEF2F2', border: '#EF4444', dot: '#EF4444' },
};

const STAGES = ['Applied', 'Screening', 'Interviewed', 'Shortlisted', 'Hired', 'Rejected'];

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('candidates');
  const [showModal, setShowModal] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', job_id: '', status: 'Applied', experience_years: '', current_company: '', resume_link: '' });
  const [jobForm, setJobForm] = useState({ title: '', department_id: '', location: '', vacancies: 1, salary_range: '', description: '', status: 'active', closing_date: '' });
  const [showJobModal, setShowJobModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [c, j] = await Promise.all([api.get('/candidates?per_page=200'), api.get('/recruitment-jobs?per_page=50')]);
      setCandidates(c.data.data || []);
      setJobs(j.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditCandidate(null); setForm({ name: '', email: '', phone: '', job_id: '', status: 'Applied', experience_years: '', current_company: '', resume_link: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditCandidate(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', job_id: c.job_id || '', status: c.status || 'Applied', experience_years: c.experience_years || '', current_company: c.current_company || '', resume_link: c.resume_link || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCandidate) { await api.put(`/candidates/${editCandidate.id}`, form); showMsg('Updated'); }
      else { await api.post('/candidates', form); showMsg('Added'); }
      setShowModal(false);
      fetchData();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const handleJobSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/recruitment-jobs', jobForm);
      setShowJobModal(false);
      setJobForm({ title: '', department_id: '', location: '', vacancies: 1, salary_range: '', description: '', status: 'active', closing_date: '' });
      showMsg('Job posted');
      fetchData();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      await api.put(`/candidates/${candidateId}`, { status: newStatus });
      showMsg(`Moved to ${newStatus}`);
      fetchData();
    } catch (err) { showMsg('Error', 'error'); }
  };

  const handleDragStart = (e, candidate) => {
    setDraggingId(candidate.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', candidate.id.toString());
  };

  const handleDragEnd = () => { setDraggingId(null); setDragOverStage(null); };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'));
    if (id) {
      const candidate = candidates.find(c => c.id === id);
      if (candidate && candidate.status !== stage) handleStatusChange(id, stage);
    }
    setDraggingId(null);
    setDragOverStage(null);
  };

  const filtered = candidates.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" /></div></div>;

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Recruitment</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Recruitment</span></div>
        </div>
        <div className="head-actions">
          <div className="search" style={{ width: 160, marginRight: 8 }}>
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          {activeTab === 'jobs' ? (
            <button className="btn-primary btn btn-sm" onClick={() => setShowJobModal(true)}>+ Post Job</button>
          ) : (
            <button className="btn-primary btn btn-sm" onClick={openAdd}>+ Add Candidate</button>
          )}
        </div>
      </div>

      <div className="flex items-center" style={{ gap: 4, marginBottom: 16 }}>
        <button className={`btn btn-sm ${activeTab === 'candidates' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('candidates')}>
          🧑‍💼 Candidates {filtered.length}
        </button>
        <button className={`btn btn-sm ${activeTab === 'jobs' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('jobs')}>
          📋 Jobs ({jobs.length})
        </button>
      </div>

      {activeTab === 'candidates' ? (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20, minHeight: '60vh' }}>
          {STAGES.map(stage => {
            const color = STAGE_COLORS[stage] || { bg: '#F8F9FC', border: '#9CA3AF', dot: '#6B7280' };
            const stageCandidates = filtered.filter(c => c.status === stage);
            const isOver = dragOverStage === stage;
            return (
              <div key={stage} style={{ flexShrink: 0, width: 240 }}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => { if (dragOverStage === stage) setDragOverStage(null); }}
                onDrop={e => handleDrop(e, stage)}>
                <div className="flex between" style={{ marginBottom: 10, padding: '0 4px' }}>
                  <div className="flex items-center gap-8">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color.dot }} />
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{stage}</h3>
                    <span style={{ fontSize: 11, color: 'var(--muted)', background: '#F4F6FA', padding: '1px 7px', borderRadius: 10 }}>{stageCandidates.length}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60, padding: 4, borderRadius: 8,
                  background: isOver ? '#F0FDF4' : 'transparent',
                  border: isOver ? '2px dashed var(--green)' : '2px dashed transparent',
                  transition: 'all .15s'
                }}>
                  {stageCandidates.map(c => {
                    const isDrag = draggingId === c.id;
                    return (
                      <div key={c.id} draggable onDragStart={e => handleDragStart(e, c)} onDragEnd={handleDragEnd}
                        style={{
                          background: '#fff', borderRadius: 8, border: '1px solid var(--line)', borderLeft: `3px solid ${color.border}`,
                          padding: 10, cursor: isDrag ? 'grabbing' : 'grab',
                          opacity: isDrag ? 0.4 : 1, transform: isDrag ? 'rotate(1.5deg) scale(1.02)' : 'none',
                          transition: 'all .15s', userSelect: 'none',
                        }} onClick={() => !isDrag && openEdit(c)}>
                        <div className="flex between">
                          <b style={{ fontSize: 12.5 }}>{c.name}</b>
                          <span className="muted" style={{ cursor: isDrag ? 'grabbing' : 'grab', fontSize: 12 }}>⠿</span>
                        </div>
                        <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>
                          {c.job?.title && <div>📋 {c.job.title}</div>}
                          {c.email && <div>✉ {c.email}</div>}
                          {c.experience_years && <div>⏱ {c.experience_years}yrs exp</div>}
                          {c.current_company && <div>🏢 {c.current_company}</div>}
                        </div>
                        {c.resume_link && <a href={c.resume_link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--blue)', marginTop: 6, display: 'inline-block' }} onClick={e => e.stopPropagation()}>📄 Resume</a>}
                      </div>
                    );
                  })}
                  {stageCandidates.length === 0 && (
                    <div className="muted text-c" style={{ fontSize: 11, padding: '20px 8px', border: '1px dashed var(--line)', borderRadius: 6 }}>
                      {isOver ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Department</th><th>Location</th><th>Vacancies</th><th>Salary</th><th>Closing</th><th>Status</th></tr></thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="muted text-c" style={{ padding: 32 }}>No jobs posted</td></tr>
              ) : jobs.map(j => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{j.title}</td>
                  <td>{j.department?.name || '-'}</td>
                  <td>{j.location || '-'}</td>
                  <td>{j.vacancies}</td>
                  <td>{j.salary_range || '-'}</td>
                  <td className="muted" style={{ fontSize: 11.5 }}>{j.closing_date ? new Date(j.closing_date).toLocaleDateString() : '-'}</td>
                  <td><span className={`tag ${j.status === 'active' ? 'green' : j.status === 'closed' ? 'red' : 'amber'}`}>{j.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="card" style={{ maxWidth: 520, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>{editCandidate ? 'Edit Candidate' : 'Add Candidate'}</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowModal(false)}>✕</span></div>
          <form onSubmit={handleSave}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name *</label><input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone</label><input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Job</label><select value={form.job_id} onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}><option value="">Select...</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Stage</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Experience (yrs)</label><input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Current Company</label><input type="text" value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Resume Link</label><input type="url" value={form.resume_link} onChange={e => setForm(f => ({ ...f, resume_link: e.target.value }))} placeholder="https://" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : editCandidate ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      </div>}

      {showJobModal && <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
        <div className="card" style={{ maxWidth: 540, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Post New Job</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowJobModal(false)}>✕</span></div>
          <form onSubmit={handleJobSave}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label><input type="text" required value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Location</label><input type="text" value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Vacancies</label><input type="number" value={jobForm.vacancies} onChange={e => setJobForm(f => ({ ...f, vacancies: +e.target.value }))} min={1} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Salary Range</label><input type="text" value={jobForm.salary_range} onChange={e => setJobForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="$50k-$70k" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Closing Date</label><input type="date" value={jobForm.closing_date} onChange={e => setJobForm(f => ({ ...f, closing_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label><select value={jobForm.status} onChange={e => setJobForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}><option value="active">Active</option><option value="closed">Closed</option><option value="draft">Draft</option></select></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label><textarea value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical' }} /></div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowJobModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Post Job'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
