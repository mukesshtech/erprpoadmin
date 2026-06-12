import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Chart from 'react-apexcharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invModal, setInvModal] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [salesRes, hrRes, crmRes, purchRes, empRes, leadsRes, dealsRes] = await Promise.all([
        api.get(`/dashboard/sales?month=${month}&year=${year}`),
        api.get('/dashboard/hr'),
        api.get('/dashboard/crm'),
        api.get('/dashboard/purchase'),
        api.get('/employees?per_page=100'),
        api.get('/leads?per_page=10'),
        api.get('/deals?per_page=10'),
      ]);
      setData({
        sales: salesRes.data, hr: hrRes.data, crm: crmRes.data,
        purchase: purchRes.data, employees: empRes.data.data || [],
        recentLeads: leadsRes.data.data || [], recentDeals: dealsRes.data.data || [],
      });
    } catch (e) { setError('Failed to load dashboard data'); console.error(e); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Metric', 'Value']];
    const s = data.sales;
    rows.push(['Total Invoices', s.total_invoices], ['Total Orders', s.total_orders], ['Total Customers', s.total_customers], ['Total Revenue', s.total_revenue], ['Total Collected', s.total_collected], ['Pending Amount', s.pending_amount]);
    rows.push(['Total Employees', data.hr.total_employees], ['Present Today', data.hr.present_today], ['Pending Leaves', data.hr.pending_leaves]);
    rows.push(['Total Leads', data.crm.total_leads], ['Total Customers (CRM)', data.crm.total_customers]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-${year}-${month}.csv`;
    a.click();
    showMsg('Exported successfully', 'success');
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (error) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0', fontSize: 14 }}>{error} <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const s = data.sales;
  const hr = data.hr;
  const crm = data.crm;
  const purch = data.purchase;
  const employees = data.employees;

  const deptData = {};
  employees.forEach(emp => {
    const d = emp.department?.name || 'Unassigned';
    deptData[d] = (deptData[d] || 0) + 1;
  });
  const deptNames = Object.keys(deptData);
  const deptCounts = Object.values(deptData);
  const fulltime = employees.filter(e => e.employment_type === 'full_time' || !e.employment_type).length;
  const contract = employees.filter(e => e.employment_type === 'contract').length;
  const probation = employees.filter(e => e.employment_type === 'probation').length;
  const wfh = employees.filter(e => e.employment_type === 'remote' || e.employment_type === 'wfh').length;
  const totalEmp = employees.length || 1;
  const presentToday = hr.present_today || 0;
  const onLeaveToday = hr.on_leave_today || 0;
  const absentToday = totalEmp - presentToday - onLeaveToday;

  const topPerformer = employees.find(e => e.performance_score && e.performance_score > 90) || employees[0];

  const monthlyIncome = [30, 45, 38, 55, 40, 60, 50, 65, 48, 58, 35, 52];
  const monthlyExpenses = [20, 30, 25, 35, 28, 40, 32, 42, 30, 38, 24, 34];
  monthlyIncome[month - 1] = Math.min(100, Math.round(Number(s.monthly_revenue) / 1000) || 55);

  const recentInvoices = (s.recent_invoices || []).slice(0, 5);
  const recentOrders = (s.recent_orders || []).slice(0, 5);

  return (
    <>
      {msg.text && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg.type === 'success' ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}

      <div className="page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Admin Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={exportCSV}>⤓ Export</button>
          <select className="btn btn-sm" value={year} onChange={e => setYear(+e.target.value)} style={{ cursor: 'pointer' }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
        </div>
      </div>

      <div className="card welcome-banner">
        <div className="card__body" style={{ flexWrap: 'wrap' }}>
          <img src={`https://i.pravatar.cc/80?img=${user?.id || 68}`} style={{ width: 46, height: 46, borderRadius: '50%' }} alt="" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Welcome Back, {user?.name || 'Admin'} ✎</div>
            <div style={{ opacity: .65, fontSize: 12.5 }}>You have <b style={{ color: 'var(--primary)' }}>{hr.pending_leaves || 0}</b> Pending Approvals &amp; <b style={{ color: 'var(--primary)' }}>{hr.on_leave_today || 0}</b> On Leave Today</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="btn btn-sm" style={{ background: '#2A3447', borderColor: '#3a4658', color: '#fff' }} onClick={() => navigate('/hrms/attendance')}>+ Mark Attendance</button>
            <button className="btn-primary btn btn-sm" onClick={() => navigate('/hrms/leaves')}>+ View Leaves</button>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card stat" onClick={() => navigate('/hrms/attendance')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--primary)' }}>📋</div>
          <div><div className="v">{presentToday}/{totalEmp}</div><div className="l">Present / Total Employees</div><span className="delta up" style={{ color: 'var(--primary)', fontSize: 11.5 }}>View Attendance →</span></div>
        </div>
        <div className="card stat" onClick={() => navigate('/hrms/employees')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--pink)' }}>📁</div>
          <div><div className="v">{totalEmp}<span className="tag green">+{employees.filter(e => e.status === 'active').length}</span></div><div className="l">Total Employees</div><span className="muted" style={{ fontSize: 11.5 }}>View All →</span></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/customers')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--blue)' }}>👥</div>
          <div><div className="v">{crm.total_customers || 86}</div><div className="l">Total Customers</div><span className="muted" style={{ fontSize: 11.5 }}>View All →</span></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--ink)' }}>✓</div>
          <div><div className="v">{crm.total_leads || 28}<span className="tag green">+{crm.recent_leads?.length || 0}</span></div><div className="l">Total Leads</div><span className="muted" style={{ fontSize: 11.5 }}>View All →</span></div>
        </div>
        <div className="card stat" onClick={() => navigate('/sales/invoices')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--purple)' }}>💰</div>
          <div><div className="v">${Number(s.total_revenue || 0).toLocaleString()}</div><div className="l">Total Revenue</div><span className="muted" style={{ fontSize: 11.5 }}>View Transactions →</span></div>
        </div>
        <div className="card stat" onClick={() => navigate('/sales/orders')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--red)' }}>📈</div>
          <div><div className="v">${Number(s.total_collected || 0).toLocaleString()}</div><div className="l">Total Collected</div><span className="muted" style={{ fontSize: 11.5 }}>View Orders →</span></div>
        </div>
        <div className="card stat">
          <div className="ic" style={{ background: 'var(--green)' }}>🧑‍💼</div>
          <div><div className="v">{crm.total_customers || 0}</div><div className="l">Job Applicants</div><span className="muted" style={{ fontSize: 11.5 }}>View All</span></div>
        </div>
        <div className="card stat">
          <div className="ic" style={{ background: '#2A3447' }}>🆕</div>
          <div><div className="v">{employees.filter(e => e.status === 'active').length}/{totalEmp}</div><div className="l">Active Employees</div><span className="muted" style={{ fontSize: 11.5 }}>Active Ratio</span></div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Employees By Department</h3><span className="pill">This Month</span></div>
          <div className="card__body">
            <Chart type="bar" height={210} options={{
              chart: { toolbar: { show: false }, events: { click: () => navigate('/hrms/employees') } },
              colors: ['#F26522'],
              plotOptions: { bar: { horizontal: true, barHeight: '45%', borderRadius: 4 } },
              dataLabels: { enabled: false },
              xaxis: { categories: deptNames.length ? deptNames : ['UI/UX', 'Development', 'Management', 'HR', 'Testing', 'Marketing'], axisBorder: { show: false }, axisTicks: { show: false } },
              grid: { borderColor: '#EEF1F6', strokeDashArray: 4 },
            }} series={[{ data: deptCounts.length ? deptCounts : [110, 80, 70, 40, 55, 60] }]} />
            <div className="muted text-c" style={{ fontSize: 11.5 }}>● Click chart to view all employees</div>
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Employee Status</h3><span className="pill">This Month</span></div>
          <div className="card__body">
            <div className="muted" style={{ fontSize: 12 }}>Total Employee <b style={{ float: 'right', color: 'var(--ink)', fontSize: 15 }}>{totalEmp}</b></div>
            <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', margin: '12px 0', gap: 2 }}>
              <span style={{ flex: fulltime, background: 'var(--amber)' }} title={`Fulltime ${fulltime}`}></span>
              <span style={{ flex: contract, background: 'var(--ink)' }} title={`Contract ${contract}`}></span>
              <span style={{ flex: probation, background: 'var(--green)' }} title={`Probation ${probation}`}></span>
              <span style={{ flex: wfh, background: 'var(--pink)' }} title={`WFH ${wfh}`}></span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div onClick={() => navigate('/hrms/employees')} style={{ cursor: 'pointer' }}><span className="muted" style={{ fontSize: 12 }}>● Fulltime ({Math.round(fulltime / totalEmp * 100)}%)</span><div style={{ fontSize: 20, fontWeight: 700 }}>{fulltime}</div></div>
              <div onClick={() => navigate('/hrms/employees')} style={{ cursor: 'pointer' }}><span className="muted" style={{ fontSize: 12 }}>● Contract ({Math.round(contract / totalEmp * 100)}%)</span><div style={{ fontSize: 20, fontWeight: 700 }}>{contract}</div></div>
              <div onClick={() => navigate('/hrms/employees')} style={{ cursor: 'pointer' }}><span className="muted" style={{ fontSize: 12 }}>● Probation</span><div style={{ fontSize: 20, fontWeight: 700 }}>{probation}</div></div>
              <div onClick={() => navigate('/hrms/employees')} style={{ cursor: 'pointer' }}><span className="muted" style={{ fontSize: 12 }}>● WFH</span><div style={{ fontSize: 20, fontWeight: 700 }}>{wfh}</div></div>
            </div>
            {topPerformer && <div style={{ background: 'var(--primary-soft)', borderRadius: 9, padding: 11, marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/hrms/employees/${topPerformer.id}`)}>
              <img src={`https://i.pravatar.cc/40?img=${topPerformer.id || 20}`} style={{ width: 34, height: 34, borderRadius: '50%' }} alt="" />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{topPerformer.first_name} {topPerformer.last_name}</div><div className="muted" style={{ fontSize: 11.5 }}>{topPerformer.designation?.name || 'Employee'}</div></div>
              <span className="tag" style={{ marginLeft: 'auto', background: '#fff', color: 'var(--primary)' }}>{topPerformer.performance_score ? `Score ${topPerformer.performance_score}%` : 'Active'}</span>
            </div>}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Attendance Overview</h3><span className="pill">Today</span></div>
          <div className="card__body text-c">
            <Chart type="donut" height={180} options={{
              colors: ['#03C95A', '#FFB300', '#3B7DDD', '#E70D0D'],
              legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Today', fontSize: '11px', formatter: () => presentToday } } } } }
            }} series={[presentToday || 59, onLeaveToday || 5, 0, absentToday || 15]} />
            <ul className="dot-list mt-12" style={{ textAlign: 'left' }}>
              <li onClick={() => navigate('/hrms/attendance')} style={{ cursor: 'pointer' }}><span className="d" style={{ background: 'var(--green)' }}></span>Present <b>{presentToday}</b></li>
              <li onClick={() => navigate('/hrms/leaves')} style={{ cursor: 'pointer' }}><span className="d" style={{ background: 'var(--amber)' }}></span>On Leave <b>{onLeaveToday}</b></li>
              <li><span className="d" style={{ background: 'var(--blue)' }}></span>Late</li>
              <li onClick={() => navigate('/hrms/attendance')} style={{ cursor: 'pointer' }}><span className="d" style={{ background: 'var(--red)' }}></span>Absent <b>{absentToday}</b></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Sales Overview</h3>
            <select className="pill" value={month} onChange={e => setMonth(+e.target.value)} style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i+1}>{m} {year}</option>)}
            </select>
          </div>
          <div className="card__body">
            <div className="flex gap-16" style={{ fontSize: 12.5, marginBottom: 8 }}><span style={{ color: 'var(--primary)' }}>● Income</span><span className="muted">● Expenses</span></div>
            <Chart type="bar" height={260} options={{
              chart: { toolbar: { show: false } },
              colors: ['#F26522', '#FFD9C7'],
              plotOptions: { bar: { columnWidth: '55%', borderRadius: 3 } },
              dataLabels: { enabled: false },
              xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisBorder: { show: false }, axisTicks: { show: false } },
              grid: { borderColor: '#EEF1F6', strokeDashArray: 4 }, legend: { show: false }
            }} series={[
              { name: 'Income', data: monthlyIncome },
              { name: 'Expenses', data: monthlyExpenses }
            ]} />
            <div className="muted text-c" style={{ fontSize: 11.5 }}>Monthly Revenue: <b style={{ color: 'var(--ink)' }}>${Number(s.monthly_revenue || 0).toLocaleString()}</b> | Pending: <b style={{ color: 'var(--red)' }}>${Number(s.pending_amount || 0).toLocaleString()}</b></div>
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Invoices</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales/invoices')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {recentInvoices.length === 0 && (s.recent_invoices || []).slice(0, 5).map((inv, i) => (
              <div key={inv.id || i} className="flex items-center gap-12" onClick={() => setInvModal(inv)} style={{ cursor: 'pointer' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🧾</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{inv.invoice_number || `#INV-${inv.id}`}</div><div className="muted" style={{ fontSize: 11.5 }}>{inv.customer?.name || `Customer #${inv.customer_id}`}</div></div>
                <div className="text-c"><div className="muted" style={{ fontSize: 11 }}>Amount</div><b>${Number(inv.grand_total || 0).toLocaleString()}</b></div>
                <span className={`tag ${inv.status === 'paid' ? 'green' : 'red'}`}>{inv.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
              </div>
            ))}
            {recentInvoices.length === 0 && (s.recent_invoices || []).length === 0 && [
              ['Redesign Website', '#INV-001', '$3,560', 'Unpaid', 'red'],
              ['Module Completion', '#INV-002', '$4,175', 'Unpaid', 'red'],
              ['Change on Emp Module', '#INV-003', '$6,985', 'Unpaid', 'red'],
              ['Changes on the Board', '#INV-004', '$1,457', 'Unpaid', 'red'],
              ['Hospital Management', '#INV-005', '$6,458', 'Paid', 'green'],
            ].map(([t, s, a, st, c], i) => (
              <div key={i} className="flex items-center gap-12" style={{ cursor: 'pointer' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🧾</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div><div className="muted" style={{ fontSize: 11.5 }}>{s}</div></div>
                <div className="text-c"><div className="muted" style={{ fontSize: 11 }}>Payment</div><b>{a}</b></div>
                <span className={`tag ${c}`}>{st}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Recent Orders</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales/orders')}>View All →</span></div>
          <table className="tbl">
            <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{(recentOrders.length ? recentOrders : [
              { order_number: 'SO-001', customer: { name: 'ABC Corp' }, grand_total: 5000, status: 'delivered', created_at: '2024-09-12' },
              { order_number: 'SO-002', customer: { name: 'XYZ Ltd' }, grand_total: 12000, status: 'pending', created_at: '2024-09-15' },
              { order_number: 'SO-003', customer: { name: 'Tech Solutions' }, grand_total: 8500, status: 'shipped', created_at: '2024-09-18' },
              { order_number: 'SO-004', customer: { name: 'Global Inc' }, grand_total: 3200, status: 'approved', created_at: '2024-09-20' },
              { order_number: 'SO-005', customer: { name: 'Digital Systems' }, grand_total: 15000, status: 'pending', created_at: '2024-09-22' },
            ]).map((o, i) => (
              <tr key={o.id || i} onClick={() => navigate(`/sales/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
                <td className="muted">{o.order_number || `SO-${String(i + 1).padStart(3, '0')}`}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{o.customer?.name || `Customer #${o.customer_id}`}</td>
                <td>${Number(o.grand_total || 0).toLocaleString()}</td>
                <td><span className={`tag ${o.status === 'delivered' || o.status === 'approved' ? 'green' : o.status === 'shipped' ? 'blue' : 'red'}`}>{o.status || 'pending'}</span></td>
                <td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card__head"><h3>Tasks Statistics</h3><span className="pill">This Week</span></div>
          <div className="card__body text-c">
            <Chart type="radialBar" height={230} options={{
              colors: ['#3B7DDD'],
              plotOptions: { radialBar: { hollow: { size: '62%' }, dataLabels: { name: { show: true, offsetY: 18, fontSize: '11px', color: '#67748E', formatter: () => 'Progress' }, value: { fontSize: '22px', fontWeight: 700, offsetY: -12, formatter: () => `${totalEmp}/${s.total_customers || 100}` } } } }
            }} series={[totalEmp > 0 ? Math.round(presentToday / totalEmp * 100) : 75]} />
            <div className="flex gap-12 mt-12" style={{ justifyContent: 'center', flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: 'var(--blue)' }}>● Active {Math.round(fulltime / totalEmp * 100)}%</span>
              <span style={{ color: 'var(--amber)' }}>● Contract {Math.round(contract / totalEmp * 100)}%</span>
              <span style={{ color: 'var(--red)' }}>● Absent {Math.round(absentToday / totalEmp * 100)}%</span>
              <span style={{ color: 'var(--green)' }}>● Present {Math.round(presentToday / totalEmp * 100)}%</span>
            </div>
            <div style={{ background: 'var(--primary-soft)', borderRadius: 9, padding: 11, marginTop: 14, display: 'flex', alignItems: 'center' }}>
              <b style={{ color: 'var(--green)' }}>${Number(s.total_collected || 0).toLocaleString()}</b>
              <span className="muted" style={{ fontSize: 11.5, marginLeft: 8 }}>Total Collected Revenue</span>
              <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/sales/invoices')}>View All</button>
            </div>
          </div>
        </div>
      </div>

      {invModal && <div className="modal-overlay" onClick={() => setInvModal(null)}>
        <div className="card" style={{ maxWidth: 500, margin: '10vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Invoice Details</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setInvModal(null)}>✕</span></div>
          <div className="mt-16" style={{ fontSize: 13 }}>
            <div className="flex between mt-8"><span className="muted">Invoice #</span><b>{invModal.invoice_number || `INV-${invModal.id}`}</b></div>
            <div className="flex between mt-8"><span className="muted">Customer</span><b>{invModal.customer?.name || `ID: ${invModal.customer_id}`}</b></div>
            <div className="flex between mt-8"><span className="muted">Amount</span><b>${Number(invModal.grand_total || 0).toLocaleString()}</b></div>
            <div className="flex between mt-8"><span className="muted">Status</span><span className={`tag ${invModal.status === 'paid' ? 'green' : 'red'}`}>{invModal.status || 'unpaid'}</span></div>
            <div className="flex between mt-8"><span className="muted">Date</span><b>{invModal.created_at ? new Date(invModal.created_at).toLocaleDateString() : '-'}</b></div>
          </div>
          <div className="flex gap-8" style={{ marginTop: 20 }}>
            <button className="btn btn-sm" onClick={() => setInvModal(null)}>Close</button>
            <button className="btn-primary btn btn-sm" onClick={() => { setInvModal(null); navigate('/sales/invoices'); }}>Manage Invoice</button>
          </div>
        </div>
      </div>}
    </>
  );
}
