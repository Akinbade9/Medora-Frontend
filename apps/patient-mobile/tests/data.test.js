import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePrescription,
  validatePage,
  substitutionLabels,
  friendlyError,
} from '../src/prescriptions/data.js';
const prescription = {
  _id: '000000000000000000000010',
  publicCode: 'RX-26-TEST2345',
  status: 'ISSUED',
  isActive: true,
  issuedAt: '2026-01-01T00:00:00Z',
  medications: [
    {
      genericName: 'Example medicine',
      quantity: 1,
      dosageInstructions: 'Example only',
      frequency: 'Example',
      duration: 'Example',
      substitutionRule: 'GENERIC_ALLOWED',
    },
  ],
};
test('validates API payloads without inventing optional data', () => {
  assert.equal(validatePrescription(prescription), prescription);
  assert.equal(
    validatePage({ items: [prescription], total: 1, page: 1, limit: 10 }).total,
    1,
  );
  for (const invalid of [
    null,
    {},
    { ...prescription, medications: [null] },
    { ...prescription, isActive: undefined },
    { ...prescription, status: 'CANCELLED' },
    { ...prescription, doctor: { displayName: {} } },
    {
      ...prescription,
      medications: [{ ...prescription.medications[0], dosageInstructions: {} }],
    },
  ])
    assert.throws(() => validatePrescription(invalid));
  assert.throws(() =>
    validatePage({ items: [], total: '1', page: 1, limit: 10 }),
  );
});
test('patient-friendly substitution labels preserve backend keys', () => {
  assert.deepEqual(substitutionLabels, {
    GENERIC_ALLOWED: 'Generic alternatives allowed',
    BRAND_SPECIFIC: 'Specific brand required',
    DO_NOT_SUBSTITUTE: 'Do not substitute',
  });
});
test('friendly errors never expose backend messages', () => {
  for (const status of [0, 401, 403, 404, 500])
    assert.ok(
      !friendlyError({ status, message: 'SECRET STACK' }).includes('SECRET'),
    );
  assert.match(friendlyError({ status: 404 }), /not available/);
});
