import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Chart from 'react-apexcharts';

export default function DealsDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [dealModal, setDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({ title: '', company: '', deal_value: '', stage_id: '', customer_id: '', closing_date: '' });
  const [stages, setStages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, crmRes, custRes, stagesRes] = await Promise.all([
        api.get('/deals?per_page=100'),
        api.get('/dashboard/crm'),
        api.get('/customers?per_page=100'),
        api.get('/deal-stages'),
      ]);
      setData({ deals: dealsRes.data.data || [], crm: crmRes.data, customers: custRes.data.data || [] });
      setStages(stagesRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (e) { setError('Failed to load deals data'); console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddDeal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/deals', dealForm);
      setDealModal(false);
      setDealForm({ title: '', company: '', deal_value: '', stage_id: '', customer_id: '', closing_date: '' });
      showMsg('Deal added successfully', 'success');
      fetchData();
    } catch (e) { showMsg(e.response?.data?.message || 'Error adding deal', 'error'); }
    setSaving(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (error) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0' }}>{error} <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const deals = data.deals;
  const crm = data.crm;

  const totalDealValue = deals.reduce((s, d) => s + Number(d.deal_value || 0), 0);
  const totalDeals = deals.length || 45221;
  const totalCustomers = crm.total_customers || 9895;
  const conversionRate = totalDeals > 0 ? Math.round(crm.total_leads / totalDeals) : 51.96;
  const revenueThisMonth = deals.filter(d => {
    const dt = d.closing_date || d.created_at;
    if (!dt) return false;
    const dMonth = new Date(dt).getMonth();
    return dMonth === new Date().getMonth();
  }).reduce((s, d) => s + Number(d.deal_value || 0), 0);

  const stageNames = stages.length ? stages.map(s => s.name) : ['Marketing', 'Sales', 'Email', 'Chat', 'Operational', 'Calls'];
  const stageDealCounts = stageNames.map(sn => deals.filter(d => d.stage?.name === sn || d.deal_stage?.name === sn).length);
  const stageValues = stageNames.map(sn => deals.filter(d => d.stage?.name === sn || d.deal_stage?.name === sn).reduce((s, d) => s + Number(d.deal_value || 0), 0));
  const maxStageDeals = Math.max(...stageDealCounts, 1);
  const stageColors = ['#F26522', '#F47B45', '#F7956B', '#F9AD8C', '#FBC4AC', '#FCD7C7'];

  const compDeals = {};
  deals.forEach(d => {
    const company = d.company || d.customer?.name || 'Unknown';
    if (!compDeals[company]) compDeals[company] = { deals: 0, value: 0, lastDate: '' };
    compDeals[company].deals++;
    compDeals[company].value += Number(d.deal_value || 0);
    compDeals[company].lastDate = d.closing_date || d.closing_date || '';
  });
  const topDealCompanies = Object.entries(compDeals).sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const stageDealValues = ['Inpipeline', 'Follow Up', 'Schedule', 'Conversion'].map(sn =>
    deals.filter(d => (d.stage?.name || '').toLowerCase().includes(sn.toLowerCase())).reduce((s, d) => s + Number(d.deal_value || 0), 0)
  );

  const recentDeals = deals.slice(0, 5);
  const recentActivities = deals.slice(0, 4);

  return (
    <>
      {msg.text && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg.type === 'success' ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}

      <div className="page-head">
        <div>
          <h1>Deals Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Deals Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => navigate('/crm/deals')}>View All Deals →</button>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => setDealModal(true)}>+ Add Deal</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1.4fr' }}>
        <div className="card stat" onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Total Deals</div><div className="v">${(totalDealValue || 4522145).toLocaleString()}</div><div className="delta up">↗ +{totalDeals} deals this month</div></div>
          <div className="ic" style={{ background: 'var(--primary)', marginLeft: 'auto' }}>▲</div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/customers')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Total Customers</div><div className="v">{totalCustomers}</div><div className="delta up">↗ +55% from last week</div></div>
          <div className="ic" style={{ background: 'var(--purple)', marginLeft: 'auto' }}>👥</div>
        </div>
        <div className="card" style={{ gridRow: 'span 3' }}>
          <div className="card__head"><h3>Pipeline Stages</h3><span className="pill">This Month</span></div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {stageNames.map((name, i) => (
                <div key={name} style={{
                  width: `${Math.max(26, (stageDealCounts[i] / maxStageDeals) * 100)}%`,
                  background: stageColors[i],
                  color: i > 3 ? '#7a4a30' : '#fff',
                  borderRadius: 8, padding: 10, textAlign: 'center',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }} onClick={() => navigate('/crm/deals')}>
                  {name} : {stageDealCounts[i] || 100}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, marginTop: 16 }}><b>Deal Values By Stages</b></div>
            <div className="grid mt-12" style={{ gridTemplateColumns: `repeat(${Math.min(stageNames.length, 5)},1fr)`, gap: 8, fontSize: 11 }}>
              {stageNames.slice(0, 5).map((name, i) => (
                <div key={name} onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
                  <span className="muted">● {name}</span>
                  <div style={{ fontWeight: 700 }}>${stageValues[i]?.toLocaleString() || '5,221'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Deal Value (Avg)</div><div className="v">${totalDeals > 0 ? Math.round(totalDealValue / totalDeals).toLocaleString() : '12,545'}</div><div className="delta up">↗ +20.01% from last week</div></div>
          <div className="ic" style={{ background: 'var(--ink)', marginLeft: 'auto' }}>◈</div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Conversion Rate</div><div className="v">{conversionRate}%</div><div className="delta down">↘ -6.01% from last week</div></div>
          <div className="ic" style={{ background: 'var(--blue)', marginLeft: 'auto' }}>⟳</div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Revenue this month</div><div className="v">${(revenueThisMonth || 4654848).toLocaleString()}</div><div className="delta up">↗ +55% from last week</div></div>
          <div className="ic" style={{ background: 'var(--pink)', marginLeft: 'auto' }}>⚡</div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/customers')} style={{ cursor: 'pointer' }}>
          <div><div className="l">Active Customers</div><div className="v">{Math.round(totalCustomers * 0.9)}</div><div className="delta down">↘ -3.22% from last week</div></div>
          <div className="ic" style={{ background: 'var(--amber)', marginLeft: 'auto' }}>★</div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Deals by Stage</h3><span className="pill">📅 This Month</span></div>
          <div className="card__body">
            <div className="flex items-center gap-8">
              <span style={{ fontSize: 20, fontWeight: 700 }}>${totalDealValue.toLocaleString()}</span>
              <span className="tag green">▲ {totalDeals > 0 ? 'Active' : '12%'} vs last year</span>
            </div>
            <Chart type="bar" height={230} options={{
              chart: { toolbar: { show: false }, events: { click: () => navigate('/crm/deals') } },
              colors: ['#F26522'],
              plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
              dataLabels: { enabled: false },
              xaxis: { categories: ['Inpipeline', 'Follow Up', 'Schedule', 'Conversion'], axisBorder: { show: false }, axisTicks: { show: false } },
              grid: { borderColor: '#EEF1F6', strokeDashArray: 4 }, legend: { show: false }
            }} series={[{ data: stageDealValues.length ? stageDealValues : [70, 40, 95, 30] }]} />
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Top Deals By Companies</h3><span className="pill">📅 This Month</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {topDealCompanies.length === 0 && [
              ['Pitch', '05 April, 2025', '$3,655'],
              ['Initech', '05 May, 2025', '$2,185'],
              ['Umbrella Corp', '29 April, 2025', '$1,583'],
              ['Capital Partners', '23 Mar, 2025', '$6,584'],
              ['Massive Dynamic', '23 Feb, 2025', '$2,153'],
            ].map(([n, d, v]) => (
              <div key={n} className="flex items-center gap-12">
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🏢</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{n}</div><div className="muted" style={{ fontSize: 11 }}>Closing Deal date {d}</div></div>
                <b>{v}</b>
              </div>
            ))}
            {topDealCompanies.map(([company, info]) => (
              <div key={company} className="flex items-center gap-12" onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🏢</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{company}</div><div className="muted" style={{ fontSize: 11 }}>{info.deals} deals</div></div>
                <b>${info.value.toLocaleString()}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Top Deals</h3><span className="pill">📅 This Month</span></div>
          <div className="card__body text-c">
            <Chart type="polarArea" height={200} options={{
              colors: ['#F26522', '#6F42C1', '#03C95A'],
              legend: { show: false }, stroke: { width: 1 }, fill: { opacity: .85 }, yaxis: { show: false },
              plotOptions: { polarArea: { rings: { strokeColor: '#EEF1F6' } } }
            }} series={[44, 33, 23]} />
            <ul className="dot-list mt-12" style={{ textAlign: 'left' }}>
              <li><span className="d" style={{ background: 'var(--primary)' }}></span>Marketing <b>${(totalDealValue * 0.44).toLocaleString()}</b></li>
              <li><span className="d" style={{ background: 'var(--purple)' }}></span>Chat <b>${(totalDealValue * 0.33).toLocaleString()}</b></li>
              <li><span className="d" style={{ background: 'var(--green)' }}></span>Email <b>${(totalDealValue * 0.23).toLocaleString()}</b></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Deals By Country</h3></div>
          <table className="tbl"><tbody>
            {[['USA', '350', '$1,085'], ['UAE', '221', '$966'], ['Singapore', '236', '$959'], ['France', '589', '$879'], ['Norway', '221', '$632']].map(([c, d, v]) => (
              <tr key={c} onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
                <td><b>{c}</b><div className="muted" style={{ fontSize: 11 }}>Deals : {d}</div></td>
                <td className="text-c muted">~~~</td>
                <td style={{ textAlign: 'right' }}><div className="muted" style={{ fontSize: 11 }}>Total Value</div><b>{v}</b></td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div className="card">
          <div className="card__head"><h3>Won Deals Stage</h3><span className="pill">Sales Pipeline ▾</span></div>
          <div className="card__body text-c">
            <div className="muted" style={{ fontSize: 12 }}>Stages Won This Year</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>${(totalDealValue * 0.35).toLocaleString()} <span className="tag red">▼ 12%</span></div>
            <Chart type="donut" height={200} options={{
              colors: ['#E70D0D', '#FFB300', '#0B6E6E', '#03C95A'],
              legend: { show: false }, dataLabels: { enabled: true, formatter: (v) => Math.round(v) + '%' }, stroke: { width: 2 }
            }} series={[24, 39, 48, 20]} />
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Recent Follow Up</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/deals')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Brian Villalobos', 'Send email in 2 days', 61],
              ['Stephan Peralt', 'Call in 5 days', 13],
              ['Elliot Murray', 'Send email in 4 days', 23],
              ['Connie Waters', 'Chat In 2 days', 17],
              ['Lori Broaddus', 'When would be good for demo?', 5],
            ].map(([n, s, img]) => (
              <div key={n} className="row-user" style={{ cursor: 'pointer' }}>
                <img src={`https://i.pravatar.cc/40?img=${img}`} alt="" />
                <div style={{ flex: 1 }}><div className="n">{n}</div><div className="r">Next Step : {s}</div></div>
                <span className="muted" style={{ cursor: 'pointer' }}>✉</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Recent Deals</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/deals')}>View All →</span></div>
          <table className="tbl">
            <thead><tr><th>Deal Name</th><th>Stage</th><th>Deal Value</th><th>Owner</th><th>Closing Date</th></tr></thead>
            <tbody>{(recentDeals.length ? recentDeals : [
              { title: 'Collins', stage: { name: 'Quality To Buy' }, deal_value: 450000, owner: { name: 'Anthony Lewis' }, closing_date: '2024-01-14' },
              { title: 'Konopelski', stage: { name: 'Proposal Made' }, deal_value: 315000, owner: { name: 'Brian Villalobos' }, closing_date: '2024-01-21' },
              { title: 'Adams', stage: { name: 'Contact Made' }, deal_value: 840000, owner: { name: 'Harvey Smith' }, closing_date: '2024-02-20' },
              { title: 'Schumm', stage: { name: 'Quality To Buy' }, deal_value: 610000, owner: { name: 'Stephan Peralt' }, closing_date: '2024-03-15' },
              { title: 'Wisozk', stage: { name: 'Presentation' }, deal_value: 470000, owner: { name: 'Doglas Martini' }, closing_date: '2024-04-12' },
            ]).map((d, i) => (
              <tr key={d.id || i} onClick={() => navigate('/crm/deals')} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.title || d.name}</td>
                <td>{d.stage?.name || d.deal_stage?.name || '-'}</td>
                <td>${Number(d.deal_value || 0).toLocaleString()}</td>
                <td><div className="row-user">
                  <img src={`https://i.pravatar.cc/40?img=${d.owner?.id || d.id || i + 10}`} alt="" />
                  <span className="n">{d.owner?.name || d.assigned_to?.name || '-'}</span>
                </div></td>
                <td>{d.closing_date ? new Date(d.closing_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card__head"><h3>Recent Activities</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/deals')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recentActivities.length ? recentActivities.map((d, i) => (
              <div key={d.id || i} className="flex gap-12">
                <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-soft)', display: 'grid', placeItems: 'center' }}>💬</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>Deal "{d.title}" updated to {d.stage?.name || 'new stage'}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{d.closing_date ? new Date(d.closing_date).toLocaleDateString() : 'Recently'}</div>
                </div>
              </div>
            )) : [
              ['Drain responded to your appointment schedule question.', '09:25 PM', '📞'],
              ['You sent 1 Message to the James.', '10:25 PM', '💬'],
              ['Denwar responded to your appointment on 25 Jan 2025, 08:15 PM', '09:25 PM', '📞'],
              ['Meeting With Abraham', '05:00 PM', '🗓'],
            ].map(([t, tm, ic], i) => (
              <div key={i} className="flex gap-12">
                <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-soft)', display: 'grid', placeItems: 'center' }}>{ic}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{t}</div><div className="muted" style={{ fontSize: 11 }}>{tm}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {dealModal && <div className="modal-overlay" onClick={() => setDealModal(false)}>
        <div className="card" style={{ maxWidth: 520, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Add New Deal</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setDealModal(false)}>✕</span></div>
          <form onSubmit={handleAddDeal}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Deal Title *</label>
                <input type="text" required value={dealForm.title} onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))} placeholder="Deal name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Company</label>
                <input type="text" value={dealForm.company} onChange={e => setDealForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Deal Value *</label>
                <input type="number" required value={dealForm.deal_value} onChange={e => setDealForm(f => ({ ...f, deal_value: e.target.value }))} placeholder="50000" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Closing Date</label>
                <input type="date" value={dealForm.closing_date} onChange={e => setDealForm(f => ({ ...f, closing_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Stage</label>
                <select value={dealForm.stage_id} onChange={e => setDealForm(f => ({ ...f, stage_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="">Select stage</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Customer</label>
                <select value={dealForm.customer_id} onChange={e => setDealForm(f => ({ ...f, customer_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setDealModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Add Deal'}</button>
            </div>
          </form>
        </div>
      </div>}
    </>
  );
}
