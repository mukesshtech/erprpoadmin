import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Chart from 'react-apexcharts';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [punching, setPunching] = useState(false);

  const showMsg = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes, ltRes, taskRes] = await Promise.all([
        api.get('/employees?per_page=100'),
        api.get('/attendance/today'),
        api.get('/leaves?per_page=50'),
        api.get('/leave-types'),
        api.get('/tasks?per_page=10'),
      ]);
      setData({
        employees: empRes.data.data || [],
        todayAttendance: attRes.data || [],
        leaves: leaveRes.data.data || [],
        leaveTypes: ltRes.data.data || [],
        tasks: taskRes.data.data || [],
      });
      setLeaveTypes(ltRes.data.data || []);
    } catch (e) {
      setError('Failed to load data');
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePunch = async () => {
    setPunching(true);
    try {
      const now = new Date();
      const isPunchIn = !data?.todayAttendance?.length;
      const checkIn = now.toTimeString().slice(0, 5);
      await api.post('/attendance/mark', {
        date: now.toISOString().split('T')[0],
        status: 'present',
        check_in: checkIn,
        check_out: isPunchIn ? null : checkIn,
      });
      showMsg(isPunchIn ? 'Punched In successfully' : 'Punched Out successfully', 'success');
      fetchData();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Error marking attendance', 'error');
    }
    setPunching(false);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/leaves', leaveForm);
      setLeaveModal(false);
      setLeaveForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      showMsg('Leave applied successfully', 'success');
      fetchData();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Error applying leave', 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (error) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0' }}>{error} <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const { employees, todayAttendance, leaves, tasks } = data;
  const currentEmp = employees.find(e => e.email === user?.email) || employees[0] || {};
  const profileEmp = currentEmp;

  const today = todayAttendance;
  const todayRecord = Array.isArray(today) ? today[0] : today;
  const isPunchedIn = todayRecord?.check_in && !todayRecord?.check_out;
  const punchedInTime = todayRecord?.check_in || '--:--';
  const totalHours = todayRecord?.total_hours || '0:00';

  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const totalLeaves = leaves.length;
  const takenLeaves = approvedLeaves.length;
  const absentCount = leaves.filter(l => l.status === 'approved' && l.leaveType?.name?.toLowerCase().includes('absent')).length;

  const onTime = approvedLeaves.filter(l => !l.is_late).length || 1254;
  const lateCount = 32;
  const wfhCount = approvedLeaves.filter(l => l.leaveType?.name === 'WFH' || l.leaveType?.name === 'Work From Home').length || 658;
  const sickCount = approvedLeaves.filter(l => l.leaveType?.name === 'Sick' || l.leaveType?.name === 'Sick Leave').length || 68;

  const perfScore = currentEmp?.performance_score || 98;
  const perfTrend = currentEmp?.performance_trend || 12;

  const employeeTasks = tasks.filter(t => t.assigned_to === currentEmp?.id).slice(0, 5);

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {msg.text && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg.type === 'success' ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}

      <div className="page-head">
        <div>
          <h1>Employee Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Employee Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => { const c = document.createElement('textarea'); c.value = JSON.stringify(data, null, 2); document.body.appendChild(c); c.select(); document.execCommand('copy'); document.body.removeChild(c); showMsg('Data copied', 'success'); }}>📋 Copy Data</button>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
        </div>
      </div>

      {notice && <div style={{ background: '#EAF1FB', border: '1px solid #d6e4f7', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: '#34507a', display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        {approvedLeaves.length > 0 ? `Your leave request on "${new Date(approvedLeaves[0]?.start_date).toLocaleDateString()}" has been approved!` : 'Welcome back! Check your attendance and leave status below.'}
        <span style={{ marginLeft: 'auto', cursor: 'pointer', color: '#8aa' }} onClick={() => setNotice(false)}>✕</span>
      </div>}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div style={{ background: 'var(--ink)', borderRadius: '12px 12px 0 0', padding: 18, display: 'flex', gap: 13, alignItems: 'center', color: '#fff' }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {(profileEmp.first_name?.[0] || 'S')}{(profileEmp.last_name?.[0] || 'P')}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{profileEmp.first_name || 'Stephan'} {profileEmp.last_name || 'Peralt'}</div>
              <div style={{ fontSize: 12, opacity: .7 }}>{profileEmp.designation?.name || 'Senior Product Designer'} • {profileEmp.department?.name || 'UI/UX Design'}</div>
            </div>
            <span style={{ marginLeft: 'auto', opacity: .7, cursor: 'pointer' }} onClick={() => navigate(`/hrms/employees/${profileEmp.id}`)}>✎</span>
          </div>
          <div className="card__body" style={{ fontSize: 12.5 }}>
            <div className="flex between mt-8"><span className="muted">Phone Number</span><b>{profileEmp.phone || '+1 324 3453 545'}</b></div>
            <div className="flex between mt-12"><span className="muted">Email Address</span><b>{profileEmp.email || 'employee@example.com'}</b></div>
            <div className="flex between mt-12"><span className="muted">Report Office</span><b>{profileEmp.branch?.name || 'Main Office'}</b></div>
            <div className="flex between mt-12"><span className="muted">Joined on</span><b>{profileEmp.hire_date ? new Date(profileEmp.hire_date).toLocaleDateString() : '15 Jan 2024'}</b></div>
          </div>
        </div>

        <div className="card">
          <div className="card__head"><h3>Leave Details</h3><span className="pill">🗓 {new Date().getFullYear()}</span></div>
          <div className="card__body flex items-center gap-16">
            <ul className="dot-list" style={{ flex: 1 }}>
              <li><span className="d" style={{ background: 'var(--green)' }}></span>{onTime} <span className="muted">on time</span></li>
              <li><span className="d" style={{ background: 'var(--amber)' }}></span>{lateCount} <span className="muted">Late Attendance</span></li>
              <li><span className="d" style={{ background: 'var(--blue)' }}></span>{wfhCount} <span className="muted">Work From Home</span></li>
              <li><span className="d" style={{ background: 'var(--red)' }}></span>{absentCount || 14} <span className="muted">Absent</span></li>
              <li><span className="d" style={{ background: 'var(--purple)' }}></span>{sickCount} <span className="muted">Sick Leave</span></li>
            </ul>
            <Chart type="donut" height={160} width={160} options={{
              colors: ['#03C95A', '#3B7DDD', '#6F42C1', '#FFB300', '#E70D0D'],
              legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '70%' } } }
            }} series={[onTime, wfhCount, sickCount, lateCount, absentCount || 14]} />
          </div>
          <div style={{ padding: '0 18px 16px', fontSize: 12, color: 'var(--green)' }}>● Better than {perfScore}% of Employees</div>
        </div>

        <div className="card">
          <div className="card__head"><h3>Leave Summary</h3><span className="pill">{new Date().getFullYear()}</span></div>
          <div className="card__body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div><div className="muted" style={{ fontSize: 12 }}>Total Leaves</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totalLeaves || 16}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Taken</div><div style={{ fontSize: 22, fontWeight: 700 }}>{takenLeaves || 10}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Absent</div><div style={{ fontSize: 22, fontWeight: 700 }}>{absentCount || 2}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Pending</div><div style={{ fontSize: 22, fontWeight: 700 }}>{pendingLeaves.length || 0}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Worked Days</div><div style={{ fontSize: 22, fontWeight: 700 }}>{onTime || 240}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Loss of Pay</div><div style={{ fontSize: 22, fontWeight: 700 }}>{absentCount > 3 ? absentCount - 3 : 0}</div></div>
            </div>
            <button className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => setLeaveModal(true)}>Apply New Leave</button>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card" style={{ border: isPunchedIn ? '1.5px solid var(--green)' : '1.5px solid #FFD9C7' }}>
          <div className="card__body text-c">
            <div className="muted" style={{ fontSize: 13 }}>Attendance</div>
            <div style={{ fontWeight: 700, fontSize: 16, margin: '2px 0 12px' }}>{punchedInTime}, {todayStr}</div>
            <Chart type="radialBar" height={200} width={200} options={{
              colors: [isPunchedIn ? '#03C95A' : '#FFB300'],
              plotOptions: { radialBar: { hollow: { size: '62%' }, track: { background: '#EEF1F6' }, dataLabels: { name: { show: false }, value: { fontSize: '18px', fontWeight: 700, offsetY: 6, formatter: () => totalHours } } } }
            }} series={[isPunchedIn ? 64 : 0]} />
            <div style={{ marginTop: -30, fontSize: 12 }} className="muted">Total Hours</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{totalHours}</div>
            <div style={{ background: '#F4F6FA', borderRadius: 7, padding: '5px 12px', fontSize: 12, margin: '12px 0', display: 'inline-block' }}>
              {isPunchedIn ? `Production : ${totalHours}` : 'Not punched in yet'}
            </div>
            <div style={{ fontSize: 12 }} className="muted">⏱ {isPunchedIn ? `Punched In at ${punchedInTime}` : 'Not punched in'}</div>
            <button
              className={isPunchedIn ? 'btn btn-sm' : 'btn-primary btn'}
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={handlePunch}
              disabled={punching}
            >
              {punching ? <span className="spinner" /> : isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          </div>
        </div>

        <div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div className="card stat">
              <div className="ic" style={{ background: 'var(--green)' }}>⏱</div>
              <div><div className="v">{totalHours.includes(':') ? totalHours : '8.36'} <span className="muted" style={{ fontSize: 13 }}>/ 9</span></div><div className="l">Total Hours Today</div><div className="delta up">▲ {perfTrend}% Performance</div></div>
            </div>
            <div className="card stat">
              <div className="ic" style={{ background: 'var(--ink)' }}>⏰</div>
              <div><div className="v">{Number(totalHours.split(':')[0] || 0) * 5 || 24.4}<span className="muted" style={{ fontSize: 13 }}>/ 40</span></div><div className="l">Total Hours Week</div><div className="delta up">▲ 7% Last Week</div></div>
            </div>
            <div className="card stat">
              <div className="ic" style={{ background: 'var(--blue)' }}>📅</div>
              <div><div className="v">{Number(totalHours.split(':')[0] || 0) * 22 || 126}<span className="muted" style={{ fontSize: 13 }}>/ 160</span></div><div className="l">Total Hours Month</div><div className="delta down">▼ 8% Last Month</div></div>
            </div>
            <div className="card stat">
              <div className="ic" style={{ background: 'var(--pink)' }}>⏳</div>
              <div><div className="v">{Math.max(0, Number(totalHours.split(':')[0] || 0) - 8) || 16}<span className="muted" style={{ fontSize: 13 }}>/ 28</span></div><div className="l">Overtime this Month</div><div className="delta up">▲ 6% Last Month</div></div>
            </div>
          </div>
          <div className="card mt-16">
            <div className="card__body">
              <div className="flex gap-16" style={{ flexWrap: 'wrap', fontSize: 12.5 }}>
                <span>● <b>Total Working hours</b> {totalHours}</span>
                <span style={{ color: 'var(--green)' }}>● Productive 08h 36m</span>
                <span style={{ color: 'var(--amber)' }}>● Break 22m 15s</span>
                <span style={{ color: 'var(--blue)' }}>● Overtime 02h 15m</span>
              </div>
              <div className="mt-12">
                <Chart type="rangeBar" height={60} options={{
                  chart: { sparkline: { enabled: true } },
                  plotOptions: { bar: { horizontal: true, barHeight: '45%', rangeBarGroupRows: true } },
                  legend: { show: false }, tooltip: { enabled: false }, grid: { show: false },
                  xaxis: { max: 12, labels: { show: false } }
                }} series={[{ data: [
                  { x: 'h', y: [0, 3], fillColor: '#03C95A' }, { x: 'h', y: [3, 4], fillColor: '#FFB300' },
                  { x: 'h', y: [4, 7], fillColor: '#03C95A' }, { x: 'h', y: [7, 8], fillColor: '#FFB300' },
                  { x: 'h', y: [8, 11], fillColor: '#03C95A' }, { x: 'h', y: [11, 12], fillColor: '#3B7DDD' }
                ]}]} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Projects</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/leads')}>View Projects →</span></div>
          <div className="card__body grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[33, 51].map((img, i) => (
              <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div className="flex between"><b>Project {i + 1}</b><span className="muted">⋮</span></div>
                <div className="row-user mt-12"><img src={`https://i.pravatar.cc/40?img=${img}`} alt="" /><div><div className="n">{i === 0 ? 'Anthony Lewis' : 'Sarah Connor'}</div><div className="r">Project Leader</div></div></div>
                <div className="muted mt-12" style={{ fontSize: 12 }}>🗓 14/01/2024 Deadline</div>
                <div style={{ background: '#F4F6FA', borderRadius: 7, padding: '6px 10px', marginTop: 10, fontSize: 12 }}>Tasks: 8/10</div>
                <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 7, padding: '6px 10px', marginTop: 8, fontSize: 12, fontWeight: 600 }}>Time Spent 65/120 Hrs</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head"><h3>Tasks</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/leads')}>All Tasks →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employeeTasks.length === 0 && [
              { title: 'Patient appointment booking', status: 'on_hold', priority: 'high', completed: false },
              { title: 'Appointment booking with payment gateway', status: 'in_progress', priority: 'medium', completed: false },
              { title: 'Patient and Doctor video conferencing', status: 'completed', priority: 'low', completed: true },
              { title: 'Private chat module', status: 'in_progress', priority: 'medium', completed: false },
              { title: 'Go-Live and Post-Implementation support', status: 'in_progress', priority: 'high', completed: false },
            ].map((t, i) => {
              const tagColor = t.status === 'completed' ? 'green' : t.status === 'in_progress' ? 'blue' : 'red';
              const tagLabel = t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'On Hold';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--line)', borderRadius: 9, padding: '11px 13px' }}>
                  <span className="muted">⠿</span>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.completed ? 'var(--primary)' : '#cbd5e1'}`, background: t.completed ? 'var(--primary)' : '#fff', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, cursor: 'pointer' }}>{t.completed ? '✓' : ''}</span>
                  <span style={t.completed ? { textDecoration: 'line-through', color: '#9aa4b8' } : {}}>{t.title}</span>
                  <span className={`tag ${tagColor}`} style={{ marginLeft: 'auto' }}>{tagLabel}</span>
                </div>
              );
            })}
            {employeeTasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--line)', borderRadius: 9, padding: '11px 13px' }}>
                <span className="muted">⠿</span>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.status === 'completed' ? 'var(--primary)' : '#cbd5e1'}`, background: t.status === 'completed' ? 'var(--primary)' : '#fff', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11 }}>{t.status === 'completed' ? '✓' : ''}</span>
                <span style={t.status === 'completed' ? { textDecoration: 'line-through', color: '#9aa4b8' } : {}}>{t.title}</span>
                <span className={`tag ${t.status === 'completed' ? 'green' : t.status === 'in_progress' ? 'blue' : 'red'}`} style={{ marginLeft: 'auto' }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.2fr 1fr 0.9fr' }}>
        <div className="card">
          <div className="card__head"><h3>Performance</h3><span className="pill">🗓 {new Date().getFullYear()}</span></div>
          <div className="card__body">
            <div className="flex items-center gap-8"><span style={{ fontSize: 24, fontWeight: 700 }}>{perfScore}%</span><span className="tag green">▲ {perfTrend}% vs last year</span></div>
            <Chart type="area" height={160} options={{
              chart: { toolbar: { show: false } },
              colors: ['#03C95A'], stroke: { curve: 'smooth', width: 3 },
              fill: { type: 'gradient', gradient: { opacityFrom: .4, opacityTo: 0 } },
              dataLabels: { enabled: false }, grid: { borderColor: '#EEF1F6', strokeDashArray: 4 },
              xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], axisBorder: { show: false }, axisTicks: { show: false } },
              yaxis: { show: false }
            }} series={[{ name: 'Performance', data: [60, 55, 70, 65, 80, 75, perfScore] }]} />
            <div className="muted text-c" style={{ fontSize: 11.5 }}>Ratings are as per the feedback from the higher authorities</div>
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>My Skills</h3><span className="pill">🗓 {new Date().getFullYear()}</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Figma', '15 May 2025', 96], ['HTML', '12 May 2025', 85], ['CSS', '12 May 2025', 70], ['Wordpress', '15 Jan 2025', 61], ['Javascript', '12 May 2025', 58]].map(([n, d, p]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{n}</div><div className="muted" style={{ fontSize: 11.5 }}>Updated : {d}</div></div>
                <div style={{ position: 'relative', width: 42, height: 42 }}>
                  <svg width="42" height="42">
                    <circle cx="21" cy="21" r="17" fill="none" stroke="#EEF1F6" strokeWidth="4" />
                    <circle cx="21" cy="21" r="17" fill="none" stroke="var(--green)" strokeWidth="4" strokeDasharray={2 * Math.PI * 17} strokeDashoffset={2 * Math.PI * 17 * (1 - p / 100)} strokeLinecap="round" transform="rotate(-90 21 21)" />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>{p}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ background: 'var(--ink)', color: '#fff', border: 0 }}>
          <div className="card__body text-c">
            <div style={{ fontWeight: 600 }}>Team Birthday</div>
            <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '12px auto', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700 }}>AJ</div>
            <div style={{ fontWeight: 700 }}>Andrew Jermia</div>
            <div style={{ opacity: .6, fontSize: 12 }}>iOS Developer</div>
            <button className="btn-primary btn" style={{ marginTop: 14 }} onClick={() => { const a = document.createElement('a'); a.href = 'mailto:?subject=Happy Birthday&body=Happy Birthday Andrew!'; a.click(); showMsg('Birthday wishes sent', 'success'); }}>Send Wishes 🎂</button>
          </div>
        </div>
      </div>

      {leaveModal && <div className="modal-overlay" onClick={() => setLeaveModal(false)}>
        <div className="card" style={{ maxWidth: 480, margin: '10vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Apply New Leave</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setLeaveModal(false)}>✕</span></div>
          <form onSubmit={handleLeaveSubmit}>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Leave Type</label>
              <select required value={leaveForm.leave_type_id} onChange={e => setLeaveForm(f => ({ ...f, leave_type_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                <option value="">Select leave type</option>
                {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div className="grid mt-12" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Start Date</label>
                <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>End Date</label>
                <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
            </div>
            <div className="mt-12">
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Reason</label>
              <textarea required value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} rows={3} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical' }} />
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setLeaveModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Submit Leave'}</button>
            </div>
          </form>
        </div>
      </div>}
    </>
  );
}
