import { test, expect } from '@playwright/test';
const id = '000000000000000000000010';
const item = {
  _id: id,
  publicCode: 'RX-26-TEST2345',
  status: 'ISSUED',
  isActive: true,
  issuedAt: '2026-01-01T00:00:00Z',
  expiresAt: null,
  doctor: { displayName: 'Dr Example' },
  hospital: { name: 'Example Hospital' },
  medications: [
    {
      genericName: 'Example medicine',
      brandName: 'Example Brand',
      strength: 500,
      strengthUnit: 'mg',
      dosageForm: 'tablet',
      quantity: 2,
      dosageInstructions: 'Fictional test instructions',
      frequency: 'Test frequency',
      duration: 'Test duration',
      substitutionRule: 'GENERIC_ALLOWED',
    },
  ],
};
const result = (items, page = 1, total = items.length) => ({
  items,
  page,
  total,
  limit: 10,
});
async function setup(page, handler) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': 'http://127.0.0.1:8083',
          'access-control-allow-credentials': 'true',
          'access-control-allow-headers':
            'authorization,content-type,x-medora-client',
        },
      });
    if (path.startsWith('/api/auth/'))
      return route.fulfill({
        json: {
          user: {
            id: 'patient-user',
            role: 'PATIENT',
            displayName: 'Example Patient',
          },
          accessToken: 'test-only-access-token',
        },
      });
    return handler(route, new URL(route.request().url()));
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Prescriptions', exact: true }).click();
}
test('list to details, all substitution labels and matching placeholder return navigation', async ({
  page,
}) => {
  const p = {
    ...item,
    medications: Object.keys({
      GENERIC_ALLOWED: 1,
      BRAND_SPECIFIC: 1,
      DO_NOT_SUBSTITUTE: 1,
    }).map((rule) => ({ ...item.medications[0], substitutionRule: rule })),
  };
  await setup(page, (route, url) =>
    route.fulfill({
      json: url.pathname.endsWith(id)
        ? { ...p, status: 'VIEWED' }
        : result([p]),
    }),
  );
  await expect(
    page.getByRole('button', { name: 'Open prescription ' + item.publicCode }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Open prescription ' + item.publicCode })
    .click();
  await expect(page.getByText('Dr Example', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Example Hospital', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Quantity: 2').first()).toBeVisible();
  for (const label of [
    'Generic alternatives allowed',
    'Specific brand required',
    'Do not substitute',
  ])
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Find My Medication', exact: true })
    .click();
  await expect(page.getByText(/Pharmacy matching is coming/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Back to prescription', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Back to prescriptions', exact: true })
    .click();
  await expect(
    page.getByRole('tab', { name: 'Active', exact: true }),
  ).toBeVisible();
});
test('empty active and history states', async ({ page }) => {
  await setup(page, (route) => route.fulfill({ json: result([]) }));
  await expect(
    page.getByText('No active prescriptions', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'History', exact: true }).click();
  await expect(page.getByText('No prescription history yet')).toBeVisible();
});
test('active/history distinction, pagination, and cancelled action suppression', async ({
  page,
}) => {
  await setup(page, (route, url) => {
    if (url.pathname.endsWith(id))
      return route.fulfill({
        json: {
          ...item,
          status: 'CANCELLED',
          isActive: false,
          cancellationReason: 'Fictional cancellation',
        },
      });
    const history = url.searchParams.get('view') === 'history';
    return route.fulfill({
      json: result(
        [
          {
            ...item,
            status: history ? 'CANCELLED' : 'ISSUED',
            isActive: !history,
          },
        ],
        Number(url.searchParams.get('page') ?? 1),
        11,
      ),
    });
  });
  await expect(page.getByText('ISSUED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'History', exact: true }).click();
  await expect(page.getByText('CANCELLED', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Open prescription ' + item.publicCode })
    .click();
  await expect(
    page.getByText('Cancellation reason: Fictional cancellation'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Find My Medication', exact: true }),
  ).toHaveCount(0);
});
for (const status of [0, 403, 404, 500])
  test('safe prescription error ' + status, async ({ page }) => {
    await setup(page, (route) =>
      status === 0
        ? route.abort()
        : route.fulfill({
            status,
            json: { error: { message: 'SECRET STACK TRACE' } },
          }),
    );
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('SECRET STACK TRACE')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Try again', exact: true }),
    ).toBeVisible();
  });
test('malformed response is recoverable', async ({ page }) => {
  await setup(page, (route) =>
    route.fulfill({ json: { items: [null], page: 1, limit: 10, total: 1 } }),
  );
  await expect(page.getByRole('alert')).toContainText('could not load');
});
test('expired prescription is not eligible even after a stale active list', async ({
  page,
}) => {
  let reads = 0;
  await setup(page, (route, url) =>
    route.fulfill({
      json: url.pathname.endsWith(id)
        ? ++reads === 1
          ? item
          : { ...item, status: 'EXPIRED', isActive: false }
        : result([item]),
    }),
  );
  await page
    .getByRole('button', { name: 'Open prescription ' + item.publicCode })
    .click();
  await page
    .getByRole('button', { name: 'Find My Medication', exact: true })
    .click();
  await expect(page.getByText(/is expired and cannot/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Find My Medication', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Pharmacy matching is coming/)).toHaveCount(0);
});
test('invalid refresh returns patient to sign in', async ({ page }) => {
  await setup(page, (route) => route.fulfill({ json: result([item]) }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      json: { error: { message: 'Invalid session' } },
    }),
  );
  await page.route('**/api/patient/prescriptions**', (route) =>
    route.fulfill({ status: 401, json: { error: { message: 'Expired' } } }),
  );
  await page
    .getByRole('button', { name: 'Refresh prescriptions', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(item.publicCode, { exact: true })).toHaveCount(0);
});
test('real standalone API: patient login, details, matching placeholder, cancellation and history', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('patient@medora.example.test');
  await page
    .getByLabel('Password', { exact: true })
    .fill('browser test password only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('tab', { name: 'Prescriptions', exact: true }).click();
  await page
    .getByRole('button', { name: /Open prescription RX-/ })
    .first()
    .click();
  await expect(
    page.getByText('Fictional Doctor', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Fictional Example Hospital', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Fictional browser fixture/)).toBeVisible();
  await expect(page.getByText('VIEWED', { exact: true })).toBeVisible();
  await page.screenshot({
    path: '../../.tmp/patient-details.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Find My Medication', exact: true })
    .click();
  await expect(page.getByText(/Pharmacy matching is coming/)).toBeVisible();
  await page.screenshot({
    path: '../../.tmp/patient-matching-placeholder.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Back to prescription', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Back to prescriptions', exact: true })
    .click();
  await page.getByRole('tab', { name: 'History', exact: true }).click();
  await expect(
    page.getByText('CANCELLED', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('EXPIRED', { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Open prescription RX-/ })
    .filter({ hasText: 'CANCELLED' })
    .first()
    .click();
  await expect(page.getByText(/Cancellation reason:/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Find My Medication', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Back to prescriptions', exact: true })
    .click();
  await expect(
    page.getByText('CANCELLED', { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: '../../.tmp/patient-history.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('loading state resolves and successful token refresh keeps the patient signed in', async ({
  page,
}) => {
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  await setup(page, async (route) => {
    await ready;
    await route.fulfill({ json: result([item]) });
  });
  await expect(
    page.getByRole('progressbar', { name: 'Loading prescriptions' }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole('button', { name: 'Refresh prescriptions', exact: true }),
  ).toBeVisible();
  await page.route(
    '**/api/patient/prescriptions**',
    (route) =>
      route.fulfill({ status: 401, json: { error: { message: 'Expired' } } }),
    { times: 1 },
  );
  const refresh = page.waitForResponse(
    (r) =>
      r.url().includes('/api/auth/refresh') && r.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'Refresh prescriptions', exact: true })
    .click();
  expect((await refresh).status()).toBe(200);
  await expect(
    page.getByRole('button', { name: 'Open prescription ' + item.publicCode }),
  ).toBeVisible();
});
