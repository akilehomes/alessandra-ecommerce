import React from 'react';
import { useCountries, maskCpf, maskCnpj } from '../utils/geo';
import { useI18n } from '../i18n';
import './Forms.css';

// Dados fiscais do cliente: pessoa fisica ou juridica + documento conforme o pais do faturamento
// (CPF/CNPJ no Brasil; NIF opcional em Portugal; numero de contribuinte/IVA na Europa).
// value: { person_type, company_name, document_number }
export default function DocumentFields({ country, value, onChange, idPrefix = 'doc' }) {
  const countries = useCountries();
  const { t } = useI18n();
  const info = countries.find((c) => c.code === country);
  const person = value.person_type === 'company' ? 'company' : 'individual';
  const rules = info ? info.documents[person] : null;
  const docType = rules ? rules.types[0] : null;

  const set = (patch) => onChange({ ...value, ...patch });
  const maskDoc = (v) => (docType === 'cpf' ? maskCpf(v) : docType === 'cnpj' ? maskCnpj(v) : v.toUpperCase());

  return (
    <div className="fx-grid">
      <div className="fx-field full">
        <label>{t('doc.buyAs')}</label>
        <div className="fx-seg" role="group" aria-label={t('doc.buyAs')}>
          <button type="button" className={person === 'individual' ? 'on' : ''} onClick={() => set({ person_type: 'individual', company_name: '', document_number: '' })}>{t('doc.individual')}</button>
          <button type="button" className={person === 'company' ? 'on' : ''} onClick={() => set({ person_type: 'company', document_number: '' })}>{t('doc.company')}</button>
        </div>
      </div>

      {person === 'company' && (
        <div className="fx-field full">
          <label htmlFor={`${idPrefix}-company`}>{t('doc.companyName')}</label>
          <input id={`${idPrefix}-company`} value={value.company_name || ''} onChange={(e) => set({ company_name: e.target.value })} autoComplete="organization" />
        </div>
      )}

      {rules && (
        <div className="fx-field full">
          <label htmlFor={`${idPrefix}-number`}>{t(`doc.${docType}`)}{rules.required ? '' : t('doc.optionalSuffix')}</label>
          <input
            id={`${idPrefix}-number`}
            value={maskDoc(value.document_number || '')}
            onChange={(e) => set({ document_number: maskDoc(e.target.value) })}
            inputMode={docType === 'cpf' || docType === 'cnpj' || docType === 'nif' ? 'numeric' : 'text'}
            placeholder={docType === 'cpf' ? '000.000.000-00' : docType === 'cnpj' ? '00.000.000/0000-00' : docType === 'vat' ? t('doc.phVat') : ''}
          />
          <span className="fx-hint">
            {country === 'BR'
              ? t('doc.hintBR')
              : person === 'company'
                ? t('doc.hintCompany')
                : t('doc.hintIndividual')}
          </span>
        </div>
      )}
    </div>
  );
}
