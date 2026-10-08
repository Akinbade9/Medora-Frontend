export const substitutionLabels = {
  GENERIC_ALLOWED: 'Generic alternatives allowed',
  BRAND_SPECIFIC: 'Specific brand required',
  DO_NOT_SUBSTITUTE: 'Do not substitute',
};
const statuses = ['ISSUED', 'VIEWED', 'CANCELLED', 'EXPIRED'];
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const date = (value) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
export function validatePrescription(value) {
  if (
    !value ||
    !isText(value._id) ||
    !/^[a-f0-9]{24}$/i.test(value._id) ||
    !isText(value.publicCode) ||
    !statuses.includes(value.status) ||
    typeof value.isActive !== 'boolean' ||
    !date(value.issuedAt) ||
    (value.expiresAt != null && !date(value.expiresAt)) ||
    !Array.isArray(value.medications) ||
    !value.medications.length ||
    value.medications.length > 50
  )
    throw new Error('Unexpected prescription response');
  // Fail closed on internally inconsistent responses; do not infer eligibility.
  if (value.isActive && ['CANCELLED', 'EXPIRED'].includes(value.status))
    throw new Error('Unexpected eligibility');
  for (const item of value.medications) {
    if (
      !item ||
      !isText(item.genericName) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      !isText(item.dosageInstructions) ||
      !isText(item.frequency) ||
      !isText(item.duration) ||
      !Object.hasOwn(substitutionLabels, item.substitutionRule)
    )
      throw new Error('Unexpected medication response');
    for (const field of ['brandName', 'strengthUnit', 'dosageForm'])
      if (item[field] != null && typeof item[field] !== 'string')
        throw new Error('Unexpected medication response');
    if (
      item.strength != null &&
      (typeof item.strength !== 'number' || !Number.isFinite(item.strength))
    )
      throw new Error('Unexpected strength');
  }
  if (value.doctor != null && !isText(value.doctor.displayName))
    throw new Error('Unexpected doctor');
  if (value.hospital != null && !isText(value.hospital.name))
    throw new Error('Unexpected hospital');
  if (
    value.cancellationReason != null &&
    typeof value.cancellationReason !== 'string'
  )
    throw new Error('Unexpected cancellation');
  return value;
}
export function validatePage(value) {
  if (
    !value ||
    !Array.isArray(value.items) ||
    !Number.isInteger(value.total) ||
    value.total < 0 ||
    !Number.isInteger(value.page) ||
    value.page < 1 ||
    !Number.isInteger(value.limit) ||
    value.limit < 1 ||
    value.limit > 100 ||
    value.items.length > value.limit
  )
    throw new Error('Unexpected prescription list');
  value.items.forEach(validatePrescription);
  return value;
}
export function friendlyError(error) {
  if (error?.status === 401)
    return 'Your session has ended. Please sign in again.';
  if (error?.status === 403)
    return 'Your account cannot access these prescriptions. Please contact your care provider if your patient profile needs to be set up.';
  if (error?.status === 404)
    return 'This prescription is not available for your account. Return to your prescriptions and try again.';
  if (error?.status === 0)
    return 'Cannot reach Medora. Check your connection and try again.';
  return 'We could not load your prescriptions. Please try again.';
}
export function displayDate(value) {
  return date(value)
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not provided';
}
