import React, { useState } from 'react';
import { useI18n } from '../i18n';

// Campo de senha com botao Mostrar/Ocultar
export default function PasswordInput({ id, name, value, onChange, autoComplete, minLength, required = true }) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
        aria-pressed={visible}
      >
        {visible ? t('common.hide') : t('common.show')}
      </button>
    </div>
  );
}
