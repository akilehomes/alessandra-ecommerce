import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const money = (value) => `R$ ${(Number(value) || 0).toFixed(2)}`;

// shipping_address pode vir como objeto (JSON) ou texto
const formatAddress = (addr) => {
  if (!addr) return '';
  const a = typeof addr === 'string' ? (() => { try { return JSON.parse(addr); } catch (e) { return null; } })() : addr;
  if (!a || typeof a !== 'object') return String(addr);
  const line1 = [a.street, a.number].filter(Boolean).join(', ') + (a.complement ? ` - ${a.complement}` : '');
  const line2 = [a.city, a.state].filter(Boolean).join(' - ') + (a.cep ? ` · CEP ${a.cep}` : '');
  return [line1, line2].filter(Boolean).join('\n');
};

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setShowForm(true);
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
        alert('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
      } else {
        alert('Pedido não encontrado. Confira o número do pedido e o e-mail usado na compra.');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      alert('Erro ao buscar pedido');
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'Pendente', color: '#f59e0b', icon: '⏳' },
      paid: { label: 'Pagamento Confirmado', color: '#10b981', icon: '✓' },
      shipped: { label: 'Despachado', color: '#3b82f6', icon: '📦' },
      delivered: { label: 'Entregue', color: '#10b981', icon: '✓' },
      cancelled: { label: 'Cancelado', color: '#ef4444', icon: '✗' },
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
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (showForm && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tighter mb-4 uppercase">Rastrear</h1>
            <p className="text-gray-600 text-sm">Acompanhe seu pedido em tempo real</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">
                Número do Pedido
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
                Seu Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors"
            >
              Buscar Pedido
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-none border border-gray-200 text-center text-xs text-gray-600">
            <p>Você recebeu um email de confirmação com um link para rastrear seu pedido.</p>
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
            Buscar outro pedido
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
            ← Voltar
          </button>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">Rastreamento</h1>
          <p className="text-gray-600 text-sm">Pedido #{order.id}</p>
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
              <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Status Atual</p>
              <p className="text-2xl font-bold uppercase tracking-tight" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-8">Histórico do Pedido</h2>
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
                      {isCurrent ? 'Seu pedido está nesta etapa' : isActive ? 'Concluído' : 'Pendente'}
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name || item.product_name}</p>
                    <p className="text-xs text-gray-600">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{money(Number(item.price) * Number(item.quantity))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span>{money(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Impostos</span>
                <span>{money(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Endereço de Entrega</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-sm text-gray-700 whitespace-pre-wrap">
                {formatAddress(order.shipping_address)}
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-none text-sm text-blue-900">
            <p className="font-bold mb-1">📦 Entrega Prevista</p>
            <p>5-7 dias úteis a partir do despacho</p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-none text-center">
          <p className="text-xs text-gray-600 mb-3">Dúvidas sobre seu pedido?</p>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold uppercase tracking-wider text-black hover:underline"
          >
            Contacte-nos via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
