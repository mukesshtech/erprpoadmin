import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/employees/${id}`),
      api.get(`/attendance?employee_id=${id}&per_page=10`),
      api.get(`/leaves?employee_id=${id}&per_page=10`),
      api.get(`/payrolls?employee_id=${id}&per_page=12`),
    ]).then(([emp, att, lv, pr]) => {
      setEmployee(emp.data);
      setAttendance(att.data.data || []);
      setLeaves(lv.data.data || []);
      setPayrolls(pr.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" /></div></div>;
  if (!employee) return <div className="page"><div className="muted text-c" style={{ padding: '60px 0' }}>Employee not found</div></div>;

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Leaves' },
    { key: 'payroll', label: 'Payroll' },
  ];

  return (
    <div className="page">
      <Link to="/hrms/employees" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12, textDecoration: 'none' }}>← Back to Employees</Link>

      <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: '#fff', border: 0, padding: 24 }}>
        <div className="flex items-center gap-16">
          <div style={{ width: 72, height: 72, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700 }}>
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{employee.first_name} {employee.last_name}</h1>
            <p style={{ opacity: .7, fontSize: 13, marginTop: 2 }}>{employee.designation?.name || 'N/A'} • {employee.department?.name || 'N/A'}</p>
            <div className="flex gap-16" style={{ fontSize: 12.5, opacity: .8, marginTop: 8 }}>
              <span>✉ {employee.email}</span>
              <span>📞 {employee.phone || 'N/A'}</span>
              {employee.city && <span>📍 {employee.city}, {employee.state}</span>}
            </div>
          </div>
          <div className="text-c">
            <div style={{ fontSize: 28, fontWeight: 700 }}>{employee.employee_code}</div>
            <div style={{ fontSize: 11, opacity: .7 }}>Employee Code</div>
            <div className="mt-8"><span className={`tag ${employee.status === 'active' ? 'green' : 'red'}`}>{employee.status}</span></div>
          </div>
        </div>
      </div>

      <div className="flex" style={{ gap: 4, marginTop: 16, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'var(--primary)' : '#F4F6FA',
              color: activeTab === t.key ? '#fff' : 'var(--ink)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card mt-16" style={{ padding: 20 }}>
        {activeTab === 'profile' && <ProfileTab employee={employee} />}
        {activeTab === 'attendance' && <AttendanceTab data={attendance} />}
        {activeTab === 'leaves' && <LeavesTab data={leaves} />}
        {activeTab === 'payroll' && <PayrollTab data={payrolls} />}
      </div>
    </div>
  );
}

function ProfileTab({ employee }) {
  const fields = [
    { label: 'First Name', value: employee.first_name },
    { label: 'Last Name', value: employee.last_name },
    { label: 'Email', value: employee.email },
    { label: 'Phone', value: employee.phone || '-' },
    { label: 'Department', value: employee.department?.name || '-' },
    { label: 'Designation', value: employee.designation?.name || '-' },
    { label: 'Employment Type', value: employee.employment_type || '-' },
    { label: 'Date of Birth', value: employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('en-IN') : '-' },
    { label: 'Joining Date', value: employee.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-IN') : '-' },
    { label: 'Gender', value: employee.gender || '-' },
    { label: 'City', value: employee.city || '-' },
    { label: 'State', value: employee.state || '-' },
    { label: 'Status', value: <span className={`tag ${employee.status === 'active' ? 'green' : 'red'}`}>{employee.status}</span> },
  ];

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
      {fields.map((f) => (
        <div key={f.label} style={{ background: '#F4F6FA', borderRadius: 10, padding: '11px 14px' }}>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{f.label}</div>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ data }) {
  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Recent Attendance</h3>
      {data.length === 0 ? <p className="muted">No attendance records</p> : (
        <table className="tbl">
          <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                <td>{a.check_in || '-'}</td>
                <td>{a.check_out || '-'}</td>
                <td><span className={`tag ${a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'amber'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LeavesTab({ data }) {
  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Leave History</h3>
      {data.length === 0 ? <p className="muted">No leave records</p> : (
        <table className="tbl">
          <thead><tr><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {data.map((l) => (
              <tr key={l.id}>
                <td>{l.leave_type?.name || '-'}</td>
                <td>{new Date(l.start_date).toLocaleDateString('en-IN')}</td>
                <td>{new Date(l.end_date).toLocaleDateString('en-IN')}</td>
                <td className="muted">{l.reason || '-'}</td>
                <td><span className={`tag ${l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'amber'}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PayrollTab({ data }) {
  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Payroll History</h3>
      {data.length === 0 ? <p className="muted">No payroll records</p> : (
        <table className="tbl">
          <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Paid On</th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{monthNames[p.month - 1]} {p.year}</td>
                <td>₹{Number(p.gross_pay).toLocaleString('en-IN')}</td>
                <td>₹{Number(p.deductions).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: 'var(--ink)' }}>₹{Number(p.net_pay).toLocaleString('en-IN')}</td>
                <td><span className={`tag ${p.status === 'paid' ? 'green' : 'amber'}`}>{p.status}</span></td>
                <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
