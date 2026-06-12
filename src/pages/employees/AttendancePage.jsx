import { useState, useEffect } from 'react';
import api from '../../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ employee_id: '', status: 'present', date: new Date().toISOString().split('T')[0], check_in: '09:00', check_out: '18:00' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const loadData = () => {
    Promise.all([
      api.get(`/attendance?per_page=100`),
      api.get('/employees?per_page=100'),
    ]).then(([att, emp]) => {
      setRecords(att.data.data || []);
      setEmployees(emp.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getAttendanceForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.filter(r => r.date && r.date.startsWith(dateStr));
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/mark', formData);
      setShowModal(false);
      showMsg('Attendance marked successfully');
      loadData();
    } catch (err) { showMsg(err.response?.data?.message || 'Error marking attendance'); }
    setSaving(false);
  };

  const statusCounts = (day) => {
    const dayRecords = getAttendanceForDay(day);
    return {
      present: dayRecords.filter(r => r.status === 'present').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      late: dayRecords.filter(r => r.status === 'late').length,
      halfDay: dayRecords.filter(r => r.status === 'half_day').length,
    };
  };

  const today = records.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const todayStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg.includes('Error') ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <h1>Attendance</h1>
          <div className="breadcrumb"><span>HRMS</span><span>/</span><span className="c">Attendance</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={loadData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => setShowModal(true)}>+ Mark Attendance</button>
        </div>
      </div>

      <div className="flex between" style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--line)', padding: '12px 16px', marginBottom: 16 }}>
        <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }}>← {MONTHS[month === 0 ? 11 : month - 1]}</button>
        <h2 style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS[month]} {year}</h2>
        <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }}>{MONTHS[month === 11 ? 0 : month + 1]} →</button>
      </div>

      <div className="flex items-center gap-16" style={{ fontSize: 11.5, marginBottom: 14 }}>
        <span className="flex items-center gap-6"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#D1FAE5', border: '1px solid #6EE7B7' }} /> Present</span>
        <span className="flex items-center gap-6"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#FEE2E2', border: '1px solid #FCA5A5' }} /> Absent</span>
        <span className="flex items-center gap-6"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#FEF3C7', border: '1px solid #FCD34D' }} /> Late</span>
        <span className="flex items-center gap-6"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#FFEDD5', border: '1px solid #FDBA74' }} /> Half Day</span>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="muted text-c" style={{ fontSize: 11, fontWeight: 600, padding: '6px 0' }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const counts = statusCounts(day);
            const total = counts.present + counts.absent + counts.late + counts.halfDay;
            return (
              <div key={day} style={{ minHeight: 72, padding: 6, borderRadius: 8, border: '1px solid var(--line)', fontSize: 11 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{day}</div>
                {total > 0 ? (
                  <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                    {counts.present > 0 && <span style={{ color: 'var(--green)' }}>▲ {counts.present}</span>}
                    {counts.absent > 0 && <span style={{ color: 'var(--red)', marginLeft: 4 }}>✕ {counts.absent}</span>}
                    {counts.late > 0 && <span style={{ color: '#D97706', marginLeft: 4 }}>◷ {counts.late}</span>}
                  </div>
                ) : <span className="muted" style={{ fontSize: 10 }}>-</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-16">
        <div className="card__head"><h3>Today's Attendance ({todayStr})</h3><span className="pill">{today.length} records</span></div>
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
          <tbody>
            {today.length > 0 ? today.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.employee?.first_name} {r.employee?.last_name}</td>
                <td>{r.check_in || '-'}</td>
                <td>{r.check_out || '-'}</td>
                <td><span className={`tag ${r.status === 'present' ? 'green' : r.status === 'late' ? 'amber' : 'red'}`}>{r.status}</span></td>
              </tr>
            )) : <tr><td colSpan={4}><div className="muted text-c" style={{ padding: 24 }}>No attendance marked for today</div></td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="card" style={{ maxWidth: 480, margin: '10vh auto', padding: 0 }} onClick={e => e.stopPropagation()}>
          <div className="flex between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mark Attendance</h3>
            <span className="muted" style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1 }} onClick={() => setShowModal(false)}>✕</span>
          </div>
          <form onSubmit={handleMarkAttendance} style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Employee *</label>
              <select required value={formData.employee_id} onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                <option value="">Select employee...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Date *</label>
              <input type="date" required value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Status</label>
              <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            {formData.status !== 'absent' && (
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Check In</label><input type="time" value={formData.check_in} onChange={e => setFormData(f => ({ ...f, check_in: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Check Out</label><input type="time" value={formData.check_out} onChange={e => setFormData(f => ({ ...f, check_out: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              </div>
            )}
            <div className="flex gap-8 mt-16" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Mark Attendance'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
