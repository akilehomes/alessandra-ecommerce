import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { COMPANY } from '../config/company';
import { LEGAL_DOCS } from '../config/legalDocs';

const LABELS = {
  legalName: 'razão social', taxId: 'CNPJ/NIF', address: 'endereço da sede', email: 'e-mail de contato', phone: 'telefone',
};

// Troca {{campo}} pelo dado da empresa; se estiver vazio, mostra um aviso amarelo para nao publicar em branco
function renderText(text) {
  return text.split(/(\{\{\w+\}\})/g).map((part, i) => {
    const m = part.match(/^\{\{(\w+)\}\}$/);
    if (!m) return part;
    const value = COMPANY[m[1]];
    if (value) return <span key={i}>{value}</span>;
    return <mark key={i} style={{ background: '#fde68a', padding: '0 4px' }}>[preencher: {LABELS[m[1]] || m[1]}]</mark>;
  });
}

export default function Legal() {
  const { slug } = useParams();
  const doc = LEGAL_DOCS[slug];

  if (!doc) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '160px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif' }}>Página não encontrada</h1>
        <p><Link to="/">Voltar para a loja</Link></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '140px 24px 80px', fontFamily: 'Crimson Text, serif', lineHeight: 1.65, fontSize: 17 }}>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{doc.title}</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>Atualizado em {doc.updated}</p>
      <nav style={{ margin: '16px 0 32px', fontFamily: 'Outfit, sans-serif', fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(LEGAL_DOCS).map(([key, d]) => (
          <Link key={key} to={`/legal/${key}`} style={{ fontWeight: key === slug ? 700 : 400, textDecoration: key === slug ? 'underline' : 'none', color: '#111' }}>{d.title}</Link>
        ))}
      </nav>
      {doc.sections.map((s) => (
        <section key={s.h} style={{ marginBottom: 26 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, marginBottom: 8 }}>{s.h}</h2>
          {s.p.map((para, i) => <p key={i} style={{ margin: '0 0 10px' }}>{renderText(para.replace(/\{\{tradeName\}\}/g, COMPANY.tradeName).replace(/\{\{siteUrl\}\}/g, COMPANY.siteUrl))}</p>)}
        </section>
      ))}
    </div>
  );
}
