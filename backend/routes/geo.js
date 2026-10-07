const express = require('express');
const router = express.Router();
const { COUNTRIES } = require('../services/countries');
const { documentRules } = require('../services/documents');

// GET /api/geo/countries - paises atendidos, com regras de endereco e documento (o site monta os formularios a partir disto)
router.get('/countries', (req, res) => {
  const list = Object.values(COUNTRIES).map((c) => ({
    code: c.code,
    name: c.name,
    region: c.region,
    currency: c.currency,
    postalLabel: c.postalLabel,
    postalPattern: c.postalPattern,
    postalExample: c.postalExample,
    stateLabel: c.stateLabel,
    states: c.states,
    requiresDistrict: !!c.requiresDistrict,
    documents: {
      individual: documentRules(c.code, 'individual'),
      company: documentRules(c.code, 'company'),
    },
  }));
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(list);
});

module.exports = router;
