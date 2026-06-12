import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', category_id: '', unit_price: '', cost_price: '', tax_rate: '0', unit: 'pc', stock_quantity: '0', min_stock_level: '5', description: '', is_active: true });

  useEffect(() => { fetchProducts(); fetchCategories(); }, [page, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { per_page: 20, page };
      if (categoryFilter) params.filters = JSON.stringify({ category_id: categoryFilter });
      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try { const res = await api.get('/product-categories'); setCategories(res.data.data || []); } catch (e) {}
  };

  const handleSearch = () => {
    if (!search.trim()) { fetchProducts(); return; }
    setLoading(true);
    api.get('/products', { params: { per_page: 20, search } }).then(res => {
      setProducts(res.data.data || []); setLastPage(res.data.last_page || 1); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', sku: '', category_id: '', unit_price: '', cost_price: '', tax_rate: '0', unit: 'pc', stock_quantity: '0', min_stock_level: '5', description: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setFormData({ name: product.name, sku: product.sku, category_id: product.category_id || '', unit_price: product.unit_price, cost_price: product.cost_price, tax_rate: product.tax_rate || '0', unit: product.unit || 'pc', stock_quantity: product.stock_quantity, min_stock_level: product.min_stock_level, description: product.description || '', is_active: product.is_active });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/products/${editing.id}`, formData); }
      else { await api.post('/products', formData); }
      setShowForm(false);
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); } catch (e) { console.error(e); }
  };

  const lowStock = products.filter(p => Number(p.stock_quantity) <= Number(p.min_stock_level));
  const outOfStock = products.filter(p => Number(p.stock_quantity) === 0);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Products</h1><div className="breadcrumb"><span>Sales</span><span>/</span><span className="c">Products</span></div></div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => fetchProducts()}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={openCreate}>+ Add Product</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>All Products</span><b style={{ fontSize: 22 }}>{products.length}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Low Stock</span><b style={{ fontSize: 22 }}>{lowStock.length}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Out of Stock</span><b style={{ fontSize: 22 }}>{outOfStock.length}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Categories</span><b style={{ fontSize: 22 }}>{categories.length}</b></div>
      </div>

      {lowStock.length > 0 && <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '11px 16px', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#D97706' }}>⚠</span>
        <div><b>{lowStock.length}</b> products need restocking — <b>{outOfStock.length}</b> are out of stock</div>
      </div>}

      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="search" style={{ width: 200 }}>
            <input type="text" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5, background: '#F5F6FA' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <table className="tbl">
          <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Cost</th><th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Min</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j} className="muted text-c" style={{ padding: 12 }}>...</td>)}</tr>
            )) : products.length === 0 ? (
              <tr><td colSpan="9" className="muted text-c" style={{ padding: 32 }}>No products found</td></tr>
            ) : products.map(product => {
              const isLow = Number(product.stock_quantity) <= Number(product.min_stock_level);
              return (
                <tr key={product.id}>
                  <td><b>{product.name}</b><span className="muted block" style={{ fontSize: 11 }}>{(product.description || '').slice(0, 50) || 'No description'}</span></td>
                  <td className="muted" style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{product.sku}</td>
                  <td><span className="muted" style={{ background: '#F4F6FA', padding: '2px 8px', borderRadius: 4, fontSize: 11.5 }}>{product.category?.name || 'N/A'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(product.unit_price).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }} className="muted">₹{Number(product.cost_price).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: isLow && Number(product.stock_quantity) === 0 ? 'var(--red)' : isLow ? '#D97706' : 'var(--green)' }}>{product.stock_quantity}</td>
                  <td style={{ textAlign: 'right' }} className="muted">{product.min_stock_level}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isLow ? <span className="tag red">⚠ Low</span> : <span className="tag green">In Stock</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex" style={{ gap: 4, justifyContent: 'center' }}>
                      <span className="muted" style={{ cursor: 'pointer' }} onClick={() => openEdit(product)}>✏</span>
                      <span className="muted" style={{ cursor: 'pointer', color: 'var(--red)' }} onClick={() => handleDelete(product.id)}>🗑</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Page {page} of {lastPage}</span>
          <div className="flex gap-8">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>

      {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}>
        <div className="card" style={{ maxWidth: 560, margin: '5vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>{editing ? 'Edit Product' : 'Add Product'}</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowForm(false)}>✕</span></div>
          <form onSubmit={handleSubmit}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name *</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>SKU *</label><input required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label><select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Unit Price *</label><input type="number" required value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} min="0" step="0.01" /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Cost Price</label><input type="number" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} min="0" step="0.01" /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tax Rate (%)</label><input type="number" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} min="0" step="0.01" /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Unit</label><select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}><option value="pc">Piece</option><option value="kg">Kg</option><option value="g">Gram</option><option value="l">Liter</option><option value="m">Meter</option><option value="box">Box</option><option value="pack">Pack</option></select></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Stock Qty</label><input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} min="0" /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Min Stock</label><input type="number" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} min="0" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical' }} /></div>
            </div>
            <div className="flex items-center gap-8 mt-12">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ accentColor: 'var(--primary)' }} />
              <label htmlFor="is_active" style={{ fontSize: 13 }}>Active</label>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm">{editing ? 'Update' : 'Create'} Product</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
