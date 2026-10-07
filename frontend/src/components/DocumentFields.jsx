import React from 'react';
import { useCountries, maskCpf, maskCnpj } from '../utils/geo';
import './Forms.css';

// Dados fiscais do cliente: pessoa fisica ou juridica + documento conforme o pais do faturamento
// (CPF/CNPJ no Brasil; NIF opcional em Portugal; numero de contribuinte/IVA na Europa).
// value: { person_type, company_name, document_number }
export default function DocumentFields({ country, value, onChange, idPrefix = 'doc' }) {
  const countries = useCountries();
  const info = countries.find((c) => c.code === country);
  const person = value.person_type === 'company' ? 'company' : 'individual';
  const rules = info ? info.documents[person] : null;
  const docType = rules ? rules.types[0] : null;

  const set = (patch) => onChange({ ...value, ...patch });
  const maskDoc = (v) => (docType === 'cpf' ? maskCpf(v) : docType === 'cnpj' ? maskCnpj(v) : v.toUpperCase());

  return (
    <div className="fx-grid">
      <div className="fx-field full">
        <label>Comprar como</label>
        <div className="fx-seg" role="group" aria-label="Tipo de cliente">
          <button type="button" className={person === 'individual' ? 'on' : ''} onClick={() => set({ person_type: 'individual', company_name: '', document_number: '' })}>Pessoa física</button>
          <button type="button" className={person === 'company' ? 'on' : ''} onClick={() => set({ person_type: 'company', document_number: '' })}>Empresa</button>
        </div>
      </div>

      {person === 'company' && (
        <div className="fx-field full">
          <label htmlFor={`${idPrefix}-company`}>Razão social / Nome da empresa</label>
          <input id={`${idPrefix}-company`} value={value.company_name || ''} onChange={(e) => set({ company_name: e.target.value })} autoComplete="organization" />
        </div>
      )}

      {rules && (
        <div className="fx-field full">
          <label htmlFor={`${idPrefix}-number`}>{rules.label}</label>
          <input
            id={`${idPrefix}-number`}
            value={maskDoc(value.document_number || '')}
            onChange={(e) => set({ document_number: maskDoc(e.target.value) })}
            inputMode={docType === 'cpf' || docType === 'cnpj' || docType === 'nif' ? 'numeric' : 'text'}
            placeholder={docType === 'cpf' ? '000.000.000-00' : docType === 'cnpj' ? '00.000.000/0000-00' : docType === 'vat' ? 'Ex.: PT123456789' : ''}
          />
          <span className="fx-hint">
            {country === 'BR'
              ? 'Necessário para a nota fiscal e o envio.'
              : person === 'company'
                ? 'Usado para emitir a fatura com IVA/VAT da empresa.'
                : 'Preencha apenas se quiser a fatura com o seu número de contribuinte.'}
          </span>
        </div>
      )}
    </div>
  );
}
