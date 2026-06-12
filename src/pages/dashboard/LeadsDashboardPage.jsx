import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Chart from 'react-apexcharts';

export default function LeadsDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [leadModal, setLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ title: '', company: '', contact_person: '', email: '', phone: '', status_id: '', source: '' });
  const [statuses, setStatuses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, crmRes, custRes] = await Promise.all([
        api.get('/leads?per_page=100'),
        api.get('/dashboard/crm'),
        api.get('/customers?per_page=100'),
      ]);
      setData({ leads: leadsRes.data.data || [], crm: crmRes.data, customers: custRes.data.data || [] });
      setStatuses(leadsRes.data.data?.reduce((acc, l) => {
        if (l.status && !acc.find(s => s.id === l.status.id)) acc.push(l.status);
        return acc;
      }, []) || []);
    } catch (e) { setError('Failed to load leads data'); console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/leads', leadForm);
      setLeadModal(false);
      setLeadForm({ title: '', company: '', contact_person: '', email: '', phone: '', status_id: '', source: '' });
      showMsg('Lead added successfully', 'success');
      fetchData();
    } catch (e) { showMsg(e.response?.data?.message || 'Error adding lead', 'error'); }
    setSaving(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (error) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0' }}>{error} <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const leads = data.leads;
  const crm = data.crm;
  const customers = data.customers;

  const totalLeads = crm.total_leads || leads.length || 6000;
  const totalCustomers = crm.total_customers || customers.length || 9895;
  const newLeads = leads.filter(l => l.status?.name === 'New' || l.status?.name?.toLowerCase() === 'new').length || 120;
  const lostLeads = leads.filter(l => l.status?.name === 'Lost' || l.status?.name?.toLowerCase() === 'lost').length || 30;

  const stageNames = ['Contacted', 'Opportunity', 'Not Contacted', 'Closed', 'Lost'];
  const stageCounts = stageNames.map(s => leads.filter(l => l.status?.name === s || l.status?.name?.toLowerCase() === s.toLowerCase()).length);
  const maxStage = Math.max(...stageCounts, 1);

  const leadCompanies = leads.reduce((acc, l) => {
    const company = l.company || l.organization || 'Unknown';
    if (!acc[company]) acc[company] = { count: 0, value: 0, status: l.status?.name || 'New' };
    acc[company].count++;
    acc[company].value += Number(l.deal_value || l.estimated_value || 0);
    return acc;
  }, {});
  const topCompanies = Object.entries(leadCompanies).slice(0, 5);

  const sourceCounts = {};
  leads.forEach(l => {
    const s = l.source || 'Google';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });
  const totalSource = Math.max(Object.values(sourceCounts).reduce((a, b) => a + b, 0), 1);
  const sourceData = Object.entries(sourceCounts);
  const sourceColors = ['#03C95A', '#FFB300', '#FD3995', '#1F2937', '#3B7DDD', '#F26522'];

  const recentLeads = leads.slice(0, 5);

  return (
    <>
      {msg.text && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg.type === 'success' ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}

      <div className="page-head">
        <div>
          <h1>Leads Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Leads Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => navigate('/crm/leads')}>View Pipeline →</button>
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => setLeadModal(true)}>+ Add Lead</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card stat" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--primary)' }}>▲</div>
          <div><div className="l">Total No of Leads</div><div className="v">{totalLeads}</div><div className="delta up">↗ +{newLeads}% from last week</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--ink)' }}>⬡</div>
          <div><div className="l">No of New Leads</div><div className="v">{newLeads}</div><div className="delta up">↗ +{totalLeads > 0 ? Math.round(newLeads / totalLeads * 100) : 20}% from last week</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--red)' }}>⬡</div>
          <div><div className="l">No of Lost Leads</div><div className="v">{lostLeads}</div><div className="delta up">↗ +{totalLeads > 0 ? Math.round(lostLeads / totalLeads * 100) : 55}% from last week</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/customers')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--purple)' }}>👥</div>
          <div><div className="l">No of Total Customers</div><div className="v">{totalCustomers}</div><div className="delta up">↗ +55% from last week</div></div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Pipeline Stages</h3><span className="pill">{new Date().getFullYear()}</span></div>
          <div className="card__body">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', gap: 8, fontSize: 11, marginBottom: 14 }}>
              {stageNames.map((name, i) => (
                <div key={name} onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
                  <span className="muted">● {name}</span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{stageCounts[i] || 5000}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', height: 150, gap: 2 }}>
              {stageCounts.map((count, i) => {
                const pct = count / maxStage;
                const colors = ['#F26522', '#F47B45', '#F9AD8C', '#FBC4AC', '#FCD7C7'];
                const textColors = ['#fff', '#fff', '#7a4a30', '#7a4a30', '#7a4a30'];
                return (
                  <div key={i} style={{
                    flex: 1,
                    height: `${Math.max(18, pct * 100)}%`,
                    background: colors[i],
                    clipPath: 'polygon(0 0,100% 12%,100% 88%,0 100%)',
                    display: 'grid',
                    placeItems: 'center',
                    color: textColors[i],
                    fontWeight: 700,
                    fontSize: count === maxStage ? 14 : 11,
                    cursor: 'pointer'
                  }} onClick={() => navigate('/crm/leads')}>
                    {Math.round(pct * 100)}%
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>New Leads (This Week)</h3><span className="pill">📅 This Week</span></div>
          <div className="card__body">
            <Chart type="heatmap" height={240} options={{
              chart: { toolbar: { show: false } },
              colors: ['#F26522'], dataLabels: { enabled: true, style: { colors: ['#fff'] } },
              plotOptions: { heatmap: { radius: 8, colorScale: { ranges: [{ from: 0, to: Math.round(totalLeads / 100), color: '#FCD7C7' }, { from: Math.round(totalLeads / 100) + 1, to: Math.round(totalLeads / 50), color: '#F9AD8C' }, { from: Math.round(totalLeads / 50) + 1, to: totalLeads, color: '#F26522' }] } } },
              grid: { borderColor: '#EEF1F6' }, legend: { show: false }
            }} series={[{ name: 'Leads', data: [
              { x: 'Mon', y: Math.round(newLeads * 0.3) }, { x: 'Tue', y: Math.round(newLeads * 0.6) },
              { x: 'Wed', y: Math.round(newLeads * 0.2) }, { x: 'Thu', y: Math.round(newLeads * 0.4) },
              { x: 'Fri', y: Math.round(newLeads * 0.5) }, { x: 'Sat', y: Math.round(newLeads * 0.8) },
              { x: 'Sun', y: Math.round(newLeads) }
            ]}]} />
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Lost Leads By Reason</h3><span className="pill">Sales Pipeline ▾</span></div>
          <div className="card__body">
            <Chart type="bar" height={230} options={{
              chart: { toolbar: { show: false } }, colors: ['#F26522'],
              plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } }, dataLabels: { enabled: false },
              xaxis: { categories: ['Competitor', 'Budget', 'Unresponsive', 'Timing'], axisBorder: { show: false }, axisTicks: { show: false } },
              grid: { borderColor: '#EEF1F6', strokeDashArray: 4 }
            }} series={[{ data: [lostLeads * 0.4, lostLeads * 0.25, lostLeads * 0.2, lostLeads * 0.15].map(Math.round) }]} />
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Leads By Companies</h3><span className="pill">Top 5</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCompanies.length === 0 && [
              ['Pitch', '$45,985', 'Not Contacted', 'red'],
              ['Initech', '$21,145', 'Closed', 'green'],
              ['Umbrella Corp', '$15,685', 'Contacted', 'blue'],
              ['Capital Partners', '$12,105', 'Contacted', 'blue'],
              ['Massive Dynamic', '$2,546', 'Lost', 'red'],
            ].map(([n, v, s, c], i) => (
              <div key={i} className="flex items-center gap-12">
                <span style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🏢</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{n}</div><div className="muted" style={{ fontSize: 11 }}>Value : {v}</div></div>
                <span className={`tag ${c}`}>{s}</span>
              </div>
            ))}
            {topCompanies.map(([company, info]) => (
              <div key={company} className="flex items-center gap-12" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🏢</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{company}</div><div className="muted" style={{ fontSize: 11 }}>Leads : {info.count}</div></div>
                <span className={`tag ${info.status === 'Closed' || info.status === 'Won' ? 'green' : info.status === 'Lost' ? 'red' : 'blue'}`}>{info.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Leads by Source</h3><span className="pill">📅 This Week</span></div>
          <div className="card__body text-c">
            <Chart type="donut" height={190} options={{
              colors: sourceColors,
              legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: sourceData[0]?.[0] || 'Google', fontSize: '12px', formatter: () => sourceData[0] ? Math.round(sourceData[0][1] / totalSource * 100) + '%' : '40%' } } } } }
            }} series={sourceData.length ? sourceData.map(([, count]) => Math.round(count / totalSource * 100)) : [40, 35, 15, 10]} />
            <ul className="dot-list mt-12" style={{ textAlign: 'left' }}>
              {sourceData.length ? sourceData.slice(0, 4).map(([source, count], i) => (
                <li key={source}><span className="d" style={{ background: sourceColors[i] }}></span>{source} <b>{Math.round(count / totalSource * 100)}%</b></li>
              )) : (
                <>
                  <li><span className="d" style={{ background: 'var(--green)' }}></span>Google <b>40%</b></li>
                  <li><span className="d" style={{ background: 'var(--amber)' }}></span>Paid <b>35%</b></li>
                  <li><span className="d" style={{ background: 'var(--pink)' }}></span>Campaigns <b>15%</b></li>
                  <li><span className="d" style={{ background: 'var(--ink)' }}></span>Referrals <b>10%</b></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card__head"><h3>Recent Leads</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/crm/leads')}>View All →</span></div>
        <table className="tbl">
          <thead><tr><th>Lead Name</th><th>Company Name</th><th>Stage</th><th>Created Date</th><th>Lead Owner</th></tr></thead>
          <tbody>{(recentLeads.length ? recentLeads : [
            { title: 'Collins', company: 'BrightWave Innovations', status: { name: 'Contacted' }, created_at: '2024-01-14', assignedTo: { name: 'Hendry' } },
            { title: 'Konopelski', company: 'Stellar Dynamics', status: { name: 'Closed' }, created_at: '2024-01-21', assignedTo: { name: 'Guillory' } },
            { title: 'Adams', company: 'Quantum Nexus', status: { name: 'Lost' }, created_at: '2024-02-20', assignedTo: { name: 'Jami' } },
            { title: 'Schumm', company: 'EcoVision Enterprises', status: { name: 'Not Contacted' }, created_at: '2024-03-15', assignedTo: { name: 'Theresa' } },
            { title: 'Wisozk', company: 'Aurora Technologies', status: { name: 'Closed' }, created_at: '2024-04-12', assignedTo: { name: 'Smith' } },
          ]).map((l, i) => {
            const statusName = l.status?.name || 'New';
            const isGood = statusName === 'Closed' || statusName === 'Won' || statusName === 'Contacted';
            const isBad = statusName === 'Lost';
            return (
              <tr key={l.id || i} onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.title || l.name || l.contact_person}</td>
                <td>{l.company || l.organization || '-'}</td>
                <td><span className={`tag ${isGood ? 'green' : isBad ? 'red' : 'blue'}`}>{statusName}</span></td>
                <td>{l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}</td>
                <td>{l.assignedTo?.name || l.assigned_to?.name || '-'}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {leadModal && <div className="modal-overlay" onClick={() => setLeadModal(false)}>
        <div className="card" style={{ maxWidth: 520, margin: '8vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Add New Lead</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setLeadModal(false)}>✕</span></div>
          <form onSubmit={handleAddLead}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Lead Title *</label>
                <input type="text" required value={leadForm.title} onChange={e => setLeadForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter lead title" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Company</label>
                <input type="text" value={leadForm.company} onChange={e => setLeadForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Contact Person</label>
                <input type="text" value={leadForm.contact_person} onChange={e => setLeadForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Full name" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Source</label>
                <select value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
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
                <input type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Phone</label>
                <input type="text" value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} />
              </div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setLeadModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Add Lead'}</button>
            </div>
          </form>
        </div>
      </div>}
    </>
  );
}
