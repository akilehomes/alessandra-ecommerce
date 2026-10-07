import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { COMPANY } from '../config/company';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';


// shipping_address pode vir como objeto (JSON) ou texto
const formatAddress = (addr) => {
  if (!addr) return '';
  const a = typeof addr === 'string' ? (() => { try { return JSON.parse(addr); } catch (e) { return null; } })() : addr;
  if (!a || typeof a !== 'object') return String(addr);
  const isBR = !a.country || a.country === 'BR';
  const postal = a.postal_code || a.cep;
  const line1 = [a.street, a.number].filter(Boolean).join(', ') + (a.complement ? ` - ${a.complement}` : '');
  const line2 = [a.city, a.state].filter(Boolean).join(isBR ? ' - ' : ', ') + (postal ? ` · ${isBR ? 'CEP ' : ''}${postal}` : '');
  const country = !isBR ? (a.country === 'PT' ? 'Portugal' : a.country) : '';
  return [a.recipient_name, line1, a.district, line2, country].filter(Boolean).join('\n');
};

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, money: formatMoney } = useI18n();
  const [order, setOrder] = useState(null);
  // A moeda do pedido vem na coluna region (BRL/EUR)
  const money = (value) => formatMoney(value, order && order.region === 'EUR' ? 'EUR' : 'BRL');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setShowForm(true);
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        setLoading(false);
      } else {
        setShowForm(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setShowForm(true);
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim() || !orderNumber.trim()) return;

    try {
      const response = await fetch(`${API_URL}/orders/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      if (response.ok) {
        const { id } = await response.json();
        navigate(`/track/${id}`);
      } else if (response.status === 429) {
        alert(t('track.tooMany'));
      } else {
        alert(t('track.notFound'));
      }
    } catch (error) {
      console.error('Error searching order:', error);
      alert(t('track.error'));
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: t('track.status.pending'), color: '#f59e0b', icon: '⏳' },
      paid: { label: t('track.status.paid'), color: '#10b981', icon: '✓' },
      shipped: { label: t('track.status.shipped'), color: '#3b82f6', icon: '📦' },
      delivered: { label: t('track.status.delivered'), color: '#10b981', icon: '✓' },
      cancelled: { label: t('track.status.cancelled'), color: '#ef4444', icon: '✗' },
      refunded: { label: t('track.status.refunded'), color: '#6b7280', icon: '↩' },
    };
    return statuses[status] || { label: status, color: '#6b7280', icon: '?' };
  };

  const statusSteps = ['paid', 'shipped', 'delivered'];
  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600">{t('track.loading')}</p>
        </div>
      </div>
    );
  }

  if (showForm && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tighter mb-4 uppercase">{t('track.title')}</h1>
            <p className="text-gray-600 text-sm">{t('track.sub')}</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">
                {t('track.number')}
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-1234567890"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">
                {t('track.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('track.emailPh')}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors"
            >
              {t('track.search')}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-none border border-gray-200 text-center text-xs text-gray-600">
            <p>{t('track.hint')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pedido não encontrado</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-bold uppercase tracking-wider text-black hover:underline"
          >
            {t('track.searchOther')}
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black mb-8"
          >
            {t('track.back')}
          </button>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">{t('track.heading')}</h1>
          <p className="text-gray-600 text-sm">{t('track.orderNo', { n: order.order_number || order.id })}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Status Card */}
        <div className="mb-12 p-8 bg-gray-50 border border-gray-200 rounded-none">
          <div className="flex items-center gap-4 mb-6">
            <div
              style={{ color: statusInfo.color }}
              className="text-4xl"
            >
              {statusInfo.icon}
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">{t('track.current')}</p>
              <p className="text-2xl font-bold uppercase tracking-tight" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-8">{t('track.history')}</h2>
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const stepInfo = getStatusInfo(step);

              return (
                <div key={step} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        borderColor: isActive ? stepInfo.color : '#d1d5db',
                        backgroundColor: isActive ? stepInfo.color : 'white',
                      }}
                    ></div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className="w-0.5 h-12 mt-2"
                        style={{
                          backgroundColor: index < currentStepIndex ? stepInfo.color : '#d1d5db',
                        }}
                      ></div>
                    )}
                  </div>

                  {/* Timeline content */}
                  <div className="pb-6">
                    <p
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: isActive ? stepInfo.color : '#9ca3af' }}
                    >
                      {stepInfo.label}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {isCurrent ? t('track.stepNow') : isActive ? t('track.stepDone') : t('track.stepPending')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-8">
          {/* Items */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">{t('track.items')}</h3>
            <div className="space-y-3">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name || item.product_name}</p>
                    <p className="text-xs text-gray-600">{t('track.quantity', { n: item.quantity })}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{money(Number(item.price) * Number(item.quantity))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">{t('track.summary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('track.subtotal')}</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('track.shipping')}</span>
                <span>{money(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('track.taxes')}</span>
                <span>{money(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                <span>{t('track.total')}</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Carrier tracking */}
          {order.shipping && order.shipping.tracking_number && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">{t('track.carrierTitle')}</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-sm text-gray-700">
                {order.shipping.carrier && <p className="mb-1">{t('track.carrier')} <strong>{order.shipping.carrier}</strong></p>}
                <p>{t('track.code')} <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{order.shipping.tracking_number}</span></p>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">{t('track.address')}</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-sm text-gray-700 whitespace-pre-wrap">
                {formatAddress(order.shipping_address)}
              </div>
            </div>
          )}

          {/* Envio contratado (dados reais do pedido) */}
          {order.shipping_carrier && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-none text-sm text-blue-900">
              <p className="font-bold mb-1">📦 {t('track.delivery')}</p>
              <p>
                {[order.shipping_carrier, order.shipping_service].filter(Boolean).filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i).join(' ')}
                {order.shipping_days ? ` · ${t('track.deliveryDays', { n: order.shipping_days })}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Contato: so aparece se houver e-mail/WhatsApp configurado em config/company.js */}
        {(COMPANY.email || COMPANY.phone) && (
          <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-none text-center">
            <p className="text-xs text-gray-600 mb-3">{t('track.help')}</p>
            <a
              href={COMPANY.email ? `mailto:${COMPANY.email}` : `https://wa.me/${String(COMPANY.phone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-bold uppercase tracking-wider text-black hover:underline"
            >
              {t('track.contact')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
