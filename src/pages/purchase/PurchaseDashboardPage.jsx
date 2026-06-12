import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Chart from 'react-apexcharts';

export default function PurchaseDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [dash, poRes, billRes, vendorRes] = await Promise.all([
        api.get('/dashboard/purchase'),
        api.get('/purchase-orders?per_page=100'),
        api.get('/vendor-bills?per_page=100'),
        api.get('/vendors?per_page=50'),
      ]);
      setData({ dashboard: dash.data, orders: poRes.data.data || [], bills: billRes.data.data || [], vendors: vendorRes.data.data || [] });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (!data) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0', fontSize: 14 }}>Failed to load data <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const { dashboard: d, orders, bills, vendors } = data;
  const pendingPOs = orders.filter(o => o.status === 'pending');
  const pendingBills = bills.filter(b => b.status !== 'paid');

  const poByStatus = [
    { label: 'Pending', count: pendingPOs.length, color: '#FFB300' },
    { label: 'Approved', count: orders.filter(o => o.status === 'approved').length, color: '#3B7DDD' },
    { label: 'Received', count: orders.filter(o => o.status === 'received').length, color: '#03C95A' },
    { label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: '#E70D0D' },
  ];

  const vendorSpend = vendors.map(v => ({
    name: v.name, total: orders.filter(o => o.vendor_id === v.id).reduce((s, o) => s + Number(o.grand_total), 0),
  })).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxVendorSpend = Math.max(...vendorSpend.map(v => v.total), 1);

  const billsTotal = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const paidTotal = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Purchase Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Purchase Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => navigate('/purchase/vendors')}>+ New Vendor</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card stat" onClick={() => navigate('/purchase/orders')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--primary)' }}>📋</div>
          <div><div className="v">{d.total_purchase_orders || 0}</div><div className="l">Purchase Orders</div><div className="delta down">▼ {pendingPOs.length} pending</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/purchase/vendors')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--purple)' }}>🏢</div>
          <div><div className="v">{d.total_vendors || 0}</div><div className="l">Vendors</div><div className="delta up">▲ Active suppliers</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/purchase/bills')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--blue)' }}>💰</div>
          <div><div className="v">${Number(d.total_purchase_amount || 0).toLocaleString()}</div><div className="l">Total Purchase Amount</div><div className="delta up">▲ Paid: ${Number(d.total_paid || 0).toLocaleString()}</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/purchase/bills')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--red)' }}>⚠</div>
          <div><div className="v">{d.pending_bills || 0}</div><div className="l">Pending Bills</div><div className="delta down">▼ Needs payment</div></div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>PO Status</h3><span className="pill">{new Date().getFullYear()}</span></div>
          <div className="card__body">
            <Chart type="donut" height={200} options={{
              colors: ['#FFB300', '#3B7DDD', '#03C95A', '#E70D0D'],
              legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '11px', formatter: () => orders.length } } } } }
            }} series={poByStatus.map(s => s.count || 1)} />
            <ul className="dot-list mt-12" style={{ textAlign: 'left' }}>
              {poByStatus.map((s, i) => (
                <li key={s.label} onClick={() => navigate('/purchase/orders')} style={{ cursor: 'pointer' }}>
                  <span className="d" style={{ background: s.color }}></span>{s.label} <b>{s.count}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Top Vendors by Spend</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase/vendors')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vendorSpend.length > 0 ? vendorSpend.map((v, i) => (
              <div key={v.name}>
                <div className="flex between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{v.name}</span>
                  <b style={{ fontSize: 12 }}>${v.total.toLocaleString()}</b>
                </div>
                <div style={{ width: '100%', background: '#EEF1F6', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(v.total / maxVendorSpend) * 100}%`, background: 'var(--primary)', height: '100%', borderRadius: 6 }} />
                </div>
              </div>
            )) : <div className="muted text-c" style={{ padding: 20 }}>No vendor data</div>}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Bills Summary</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase/bills')}>View All →</span></div>
          <div className="card__body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="text-c" style={{ background: '#F0FDF4', borderRadius: 10, padding: 14 }}>
                <div className="muted" style={{ fontSize: 11.5 }}>Total Bills</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>${billsTotal.toLocaleString()}</div>
              </div>
              <div className="text-c" style={{ background: '#FFF7ED', borderRadius: 10, padding: 14 }}>
                <div className="muted" style={{ fontSize: 11.5 }}>Paid</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>${paidTotal.toLocaleString()}</div>
              </div>
              <div className="text-c" style={{ background: '#FFF0F0', borderRadius: 10, padding: 14 }}>
                <div className="muted" style={{ fontSize: 11.5 }}>Pending</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{pendingBills.length}</div>
              </div>
              <div className="text-c" style={{ background: '#EFF6FF', borderRadius: 10, padding: 14 }}>
                <div className="muted" style={{ fontSize: 11.5 }}>Overdue</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>{bills.filter(b => b.status === 'overdue').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Recent Purchase Orders</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase/orders')}>View All →</span></div>
          <table className="tbl">
            <thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{(d.recent_orders || []).length > 0 ? d.recent_orders.slice(0, 5).map((po, i) => (
              <tr key={po.id || i} onClick={() => navigate(`/purchase/orders/${po.id}`)} style={{ cursor: 'pointer' }}>
                <td className="muted">{po.order_number || `PO-${po.id}`}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{po.vendor?.name || `Vendor #${po.vendor_id}`}</td>
                <td>${Number(po.grand_total || 0).toLocaleString()}</td>
                <td><span className={`tag ${po.status === 'received' ? 'green' : po.status === 'approved' ? 'blue' : po.status === 'cancelled' ? 'red' : 'amber'}`}>{po.status || 'pending'}</span></td>
                <td>{po.created_at ? new Date(po.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            )) : [1, 2, 3, 4, 5].map(i => (
              <tr key={i} style={{ cursor: 'pointer' }}>
                <td className="muted">PO-{String(i).padStart(3, '0')}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>Vendor {i}</td>
                <td>${(i * 1500).toLocaleString()}</td>
                <td><span className="tag amber">pending</span></td>
                <td>-</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card__head"><h3>Recent Vendor Bills</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase/bills')}>View All →</span></div>
          <table className="tbl">
            <thead><tr><th>Bill #</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
            <tbody>{(d.recent_bills || []).length > 0 ? d.recent_bills.slice(0, 5).map((b, i) => (
              <tr key={b.id || i} onClick={() => navigate(`/purchase/bills`)} style={{ cursor: 'pointer' }}>
                <td className="muted">{b.bill_number || `BILL-${b.id}`}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{b.vendor?.name || `Vendor #${b.vendor_id}`}</td>
                <td>${Number(b.total_amount || 0).toLocaleString()}</td>
                <td><span className={`tag ${b.status === 'paid' ? 'green' : b.status === 'overdue' ? 'red' : 'amber'}`}>{b.status || 'pending'}</span></td>
                <td>{b.due_date ? new Date(b.due_date).toLocaleDateString() : '-'}</td>
              </tr>
            )) : [1, 2, 3, 4, 5].map(i => (
              <tr key={i} style={{ cursor: 'pointer' }}>
                <td className="muted">BILL-{String(i).padStart(3, '0')}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>Vendor {i}</td>
                <td>${(i * 2000).toLocaleString()}</td>
                <td><span className="tag amber">pending</span></td>
                <td>-</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
