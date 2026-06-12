export default function Modal({ isOpen, onClose, title, children, size = 'lg' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: size === '2xl' ? 720 : size === 'xl' ? 600 : 500, width: '90%', margin: '6vh auto', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <span className="muted" style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1 }} onClick={onClose}>✕</span>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
