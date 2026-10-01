import React, { useState, useEffect } from 'react';

export default function FinancialDashboard({ orders }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalTax: 0,
    totalShipping: 0,
    netRevenue: 0,
    brazilRevenue: 0,
    euRevenue: 0,
    monthlyData: [],
  });

  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    calculateStats();
  }, [orders, timeRange]);

  const calculateStats = () => {
    if (!orders || orders.length === 0) {
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalTax: 0,
        totalShipping: 0,
        netRevenue: 0,
        brazilRevenue: 0,
        euRevenue: 0,
        monthlyData: [],
      });
      return;
    }

    let filteredOrders = orders;
    const now = new Date();

    if (timeRange === 'month') {
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      });
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalTax = filteredOrders.reduce((sum, order) => sum + (order.tax_amount || 0), 0);
    const totalShipping = filteredOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const stripeFee = totalRevenue * 0.029 + (filteredOrders.length * 0.30); // Stripe: 2.9% + $0.30

    const brazilOrders = filteredOrders.filter(o => {
      try {
        const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
        return addr?.country?.toLowerCase() === 'brasil' || addr?.state;
      } catch {
        return false;
      }
    });
    const brazilRevenue = brazilOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const euRevenue = totalRevenue - brazilRevenue;

    // Monthly breakdown
    const monthlyMap = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = 0;
      monthlyMap[monthKey] += order.total || 0;
    });

    const monthlyData = Object.entries(monthlyMap)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([month, amount]) => ({ month, amount }));

    setStats({
      totalRevenue,
      totalOrders: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
      totalTax,
      totalShipping,
      netRevenue: totalRevenue - stripeFee,
      brazilRevenue,
      euRevenue,
      monthlyData,
      stripeFee,
    });
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  const getMaxRevenue = () => {
    if (stats.monthlyData.length === 0) return 1;
    return Math.max(...stats.monthlyData.map(d => d.amount));
  };

  const maxRevenue = getMaxRevenue();

  return (
    <div className="space-y-8">
      {/* Time Range Filter */}
      <div className="flex gap-3">
        {['all', 'month', 'week'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '12px',
              fontWeight: timeRange === range ? '700' : '400',
              letterSpacing: '1px',
              padding: '8px 16px',
              border: timeRange === range ? '2px solid #000' : '1px solid #d1d5db',
              background: timeRange === range ? '#000' : '#fff',
              color: timeRange === range ? '#fff' : '#000',
              cursor: 'pointer',
              textTransform: 'uppercase',
              borderRadius: '4px',
            }}
          >
            {range === 'all' && 'Tudo'}
            {range === 'month' && 'Este Mês'}
            {range === 'week' && 'Esta Semana'}
          </button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase' }}>Faturamento</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{formatCurrency(stats.totalRevenue)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666' }}>{stats.totalOrders} pedidos</p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase' }}>Lucro Líquido</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>{formatCurrency(stats.netRevenue)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666' }}>Após taxas Stripe</p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase' }}>Ticket Médio</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{formatCurrency(stats.averageOrderValue)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666' }}>por pedido</p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase' }}>Margem</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            {stats.totalRevenue > 0 ? ((stats.netRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
          </p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666' }}>lucro/faturamento</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>Impostos</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>{formatCurrency(stats.totalTax)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {stats.totalRevenue > 0 ? ((stats.totalTax / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita
          </p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>Frete</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(stats.totalShipping)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {stats.totalRevenue > 0 ? ((stats.totalShipping / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita
          </p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>Taxas Stripe</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(stats.stripeFee)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {stats.totalRevenue > 0 ? ((stats.stripeFee / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita
          </p>
        </div>
      </div>

      {/* Regional Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>Brasil 🇧🇷</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(stats.brazilRevenue)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {stats.totalRevenue > 0 ? ((stats.brazilRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}% do total
          </p>
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>Europa 🇪🇺</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(stats.euRevenue)}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {stats.totalRevenue > 0 ? ((stats.euRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}% do total
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      {stats.monthlyData.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '4px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase' }}>Faturamento Mensal</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
            {stats.monthlyData.map((data) => (
              <div key={data.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(data.amount / maxRevenue) * 160}px`,
                    backgroundColor: '#000',
                    borderRadius: '4px 4px 0 0',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000')}
                  title={`${data.month}: ${formatCurrency(data.amount)}`}
                />
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#666', textAlign: 'center' }}>
                  {data.month.split('-')[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
