import { useState } from 'react';
import { lookupParts } from '../data/parts-catalog.js';

export default function PartsLookup({ initialParts = [] }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cart, setCart] = useState([]);

  const search = async () => {
    if (initialParts.length === 0) return;
    setLoading(true);
    const found = await lookupParts(initialParts);
    setResults(found);
    setSearched(true);
    setLoading(false);
  };

  const toggleCart = (sku) => {
    setCart(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
  };

  const cartItems = results.filter(r => cart.includes(r.sku));
  const cartTotal = cartItems.reduce((sum, r) => sum + (r.price || 0), 0);

  const provider = import.meta.env.VITE_PARTS_PROVIDER || 'demo';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
            Parts identified: <strong style={{ color: '#fafafa' }}>{initialParts.join(', ')}</strong>
          </p>
          {provider === 'demo' && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#f59e0b' }}>
              Demo mode - set VITE_PARTS_PROVIDER=grainger for live pricing
            </p>
          )}
        </div>
        <button onClick={search} disabled={loading || initialParts.length === 0} style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
          boxShadow: '0 2px 10px rgba(249,115,22,0.25)',
        }}>
          {loading ? 'Searching…' : searched ? 'Refresh Prices' : 'Look Up Parts & Pricing'}
        </button>
      </div>

      {searched && results.length === 0 && (
        <p style={{ fontSize: 13, color: '#666', textAlign: 'center', padding: '16px 0' }}>No parts found for these keywords.</p>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(part => (
              <div key={part.sku} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', border: '1.5px solid',
                borderColor: cart.includes(part.sku) ? '#f97316' : '#333',
                borderRadius: 10, background: cart.includes(part.sku) ? 'rgba(249,115,22,0.08)' : '#1e1e1e',
              }}>
                <input
                  type="checkbox"
                  checked={cart.includes(part.sku)}
                  onChange={() => toggleCart(part.sku)}
                  style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0, accentColor: '#f97316' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fafafa' }}>{part.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>
                    {part.brand} · SKU: {part.sku} · {part.category}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#f97316' }}>
                    {part.price ? `$${part.price.toFixed(2)}` : 'Call'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: part.inStock ? '#4ade80' : '#facc15' }}>
                    {part.leadTime}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {cartItems.length > 0 && (
            <div style={{
              marginTop: 12, padding: '12px 14px',
              background: '#0a0a0a', border: '1px solid #333', borderRadius: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: '#888' }}>
                {cartItems.length} item{cartItems.length > 1 ? 's' : ''} selected
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, color: '#888' }}>Parts subtotal: </span>
                <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#f97316' }}>
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
