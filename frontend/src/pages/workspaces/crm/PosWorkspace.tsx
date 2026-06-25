import React, { useState } from 'react';
import { CreditCard, ShoppingCart, Search, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

export default function PosWorkspace() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([
    { id: '1', name: 'Premium Steel SKU-1002', qty: 2, price: 45.00 },
    { id: '2', name: 'Copper Wire SKU-2041', qty: 5, price: 12.50 },
  ]);

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = cartTotal * 0.08; // 8% sales tax
  const grandTotal = cartTotal + tax;

  const handleCheckout = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setCart([]);
    }, 2000);
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Header Block */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(20, 30, 50, 0.4) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div 
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CreditCard size={28} color="#00f2fe" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Point of Sale Terminal
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Run quick counter checkouts, scan items, and post payments to the ledger.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/workspace')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to Hub
          </button>
        </div>

        {/* POS Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Main Area: Catalog Scan */}
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Scan SKU barcode or search product catalog..." 
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
              <ShoppingCart size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Item Scanner Active. Ready for SKU scan triggers.</p>
            </div>
          </div>

          {/* Sidebar Area: Checkout Cart */}
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Active Order Cart</h3>
            
            {cart.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Cart is empty. Scan products to proceed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {cart.map((item, index) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.qty} x ${item.price.toFixed(2)}</div>
                      </div>
                      <button 
                        onClick={() => setCart(cart.filter((_, idx) => idx !== index))}
                        style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Sales Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    <span>Grand Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {paymentSuccess ? (
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 700 }}>
                    Payment Processed Successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #00f2fe, #00d2ec)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '0.5rem'
                    }}
                  >
                    <CreditCard size={15} /> Collect Payment
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
    </WorkspaceLayout>
  );
}
