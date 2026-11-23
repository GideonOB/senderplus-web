const { test, expect } = require('@playwright/test');

// Exercise the real browser SDK and React routes without contacting live Auth/API.
async function mockServices(context) {
  const user = {
    id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated',
    email: 'ama@example.com', email_confirmed_at: '2026-11-19T12:00:00Z',
    is_anonymous: false, user_metadata: {},
  };
  const profile = {
    first_name: 'Ama', last_name: 'Boateng', email: user.email, gender: 'female',
    phone_number: '0241234567', street: '1 Main Street', city: 'Accra', region: 'Greater Accra',
    ghana_post_gps: '', roles: ['customer'], profile_picture: null, email_verified: true,
  };
  const observed = { bootstrapCount: 0, refreshCount: 0 };
  const token = () => [
    Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'test' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000), role: 'authenticated', aud: 'authenticated', is_anonymous: false })).toString('base64url'),
    'mock-signature',
  ].join('.');
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  await context.route('https://senderplus-test.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 200, headers });
    let body = {};
    if (url.pathname.endsWith('/signup')) {
      observed.signup = request.postDataJSON(); body = { user };
    } else if (url.pathname.endsWith('/token')) {
      if (url.searchParams.get('grant_type') === 'refresh_token') observed.refreshCount++;
      body = { access_token: token(), refresh_token: 'fake-refresh-token', expires_in: 3600, token_type: 'bearer', user };
    } else if (url.pathname.endsWith('/user')) {
      if (request.method() === 'PUT') observed.password = request.postDataJSON();
      body = user;
    } else if (url.pathname.endsWith('/logout')) {
      return route.fulfill({ status: 204, headers });
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
  });
  await context.route('http://127.0.0.1:8000/**', async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers });
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    const isBootstrap = route.request().url().endsWith('/auth/session');
    if (isBootstrap) observed.bootstrapCount++;
    await route.fulfill({ status: 200, contentType: 'application/json', headers,
      body: JSON.stringify(isBootstrap ? { profile } : profile) });
  });
  return observed;
}

test('signup uses email confirmation and does not copy passwords into metadata', async ({ page, context }) => {
  const observed = await mockServices(context);
  await page.goto('/signup?next=%2Fprofile');
  await page.locator('#first_name').fill('Ama');
  await page.locator('#last_name').fill('Boateng');
  await expect(page.locator('#username')).toHaveCount(0);
  await page.locator('#phone_number').fill('0241234567');
  await page.locator('#street').fill('1 Main Street');
  await page.locator('#city').fill('Accra');
  await page.locator('#email').fill('ama@example.com');
  await page.locator('#password').fill('TestPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/confirm$/);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  expect(observed.signup.data.first_name).toBe('Ama');
  expect(observed.signup.data).not.toHaveProperty('password');
});

test('login, reload, password update, token refresh and logout protect customer pages', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const observed = await mockServices(context);
  await page.goto('/login?next=%2Fprofile');
  await page.locator('#identifier').fill('ama@example.com');
  await page.locator('#password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText('Ama Boateng', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Change password', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send verification code', exact: true }).click();
  await page.locator('#current_password').fill('TestPassword123!');
  await page.locator('#new_password').fill('UpdatedPassword123!');
  await page.locator('#password_code').fill('123456');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expect(page.getByText('Password changed successfully.', { exact: true })).toBeVisible();
  expect(observed.password.current_password).toBe('TestPassword123!');
  expect(observed.password.nonce).toBe('123456');
  await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.endsWith('-auth-token')) {
        const value = JSON.parse(localStorage.getItem(key)); value.expires_at = 1;
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Change password', exact: true })).toBeVisible();
  expect(observed.refreshCount).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(errors).toEqual([]);
  // A profile effect accidentally depending on its own response causes a fetch loop.
  expect(observed.bootstrapCount).toBeLessThan(20);
});

const apiOrigin = 'http://127.0.0.1:8000';
const publicTracking = {
  tracking_id: 'own12345',
  status: 'en_route_campus',
  status_display: 'Package in our van en route to campus',
  created_at: '2026-11-19T12:00:00Z',
  updated_at: '2026-11-20T12:00:00Z',
};

async function completeSignIn(page, next) {
  await page.locator('#identifier').fill('ama@example.com');
  await page.locator('#password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(next);
}

async function signIn(page) {
  await page.goto('/login');
  await completeSignIn(page, '/home');
}

async function mockTracking(context, body = publicTracking) {
  await context.route(`${apiOrigin}/track/${publicTracking.tracking_id}`, async route => {
    expect(route.request().headers()).not.toHaveProperty('authorization');
    await route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } });
  });
}

async function trackFromForm(page) {
  await page.getByRole('button', { name: 'Track Package', exact: true }).click();
  const result = page.getByRole('region', { name: 'Tracking result' });
  await expect(result.getByText(publicTracking.tracking_id, { exact: true })).toBeVisible();
  await expect(result.locator('[aria-current=step]')).toContainText(publicTracking.status_display);
  await expect(result.locator('time')).toHaveAttribute('datetime', publicTracking.updated_at);
  await expect(result.getByText(/sender|recipient name|package photo|estimate/i)).toHaveCount(0);
  return result;
}

test('guests can track a package and private delivery pages require sign-in', async ({ page, context }) => {
  await mockServices(context);
  await mockTracking(context);
  await context.route(`${apiOrigin}/deliveries/own12345`, async route => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers });
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await route.fulfill({
      json: { ...publicTracking, package_name: 'Booked parcel', weight: '2.00' },
      headers,
    });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Track a package' }).click();
  await page.getByLabel('Tracking ID').fill(publicTracking.tracking_id);
  const result = await trackFromForm(page);
  await expect(result.getByRole('button', { name: 'Advance Status' })).toHaveCount(0);

  await page.goto('/deliveries');
  await expect(page).toHaveURL(/\/login\?next=%2Fdeliveries$/);
  await page.goto('/deliveries/own12345?page=2');
  await expect(page).toHaveURL(/\/login\?next=%2Fdeliveries%2Fown12345%3Fpage%3D2$/);
  await completeSignIn(page, '/deliveries/own12345?page=2');
  await expect(page.getByRole('heading', { name: 'Booked parcel' })).toBeVisible();
});

test('booking sends the session and the success screen opens limited tracking', async ({ page, context }) => {
  await mockServices(context);
  // A staged frontend rollout may briefly encounter the earlier tracking payload.
  const privateSender = 'Private sender';
  await mockTracking(context, { ...publicTracking, sender_name: privateSender, photo_url: '/private.jpg' });
  let bookingData;
  await context.route(`${apiOrigin}/submit-package`, async route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers });
      return;
    }
    expect(request.method()).toBe('POST');
    expect(request.headers().authorization).toMatch(/^Bearer /);
    expect(request.headers()['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    bookingData = request.postData();
    await route.fulfill({ json: { tracking_id: publicTracking.tracking_id }, headers });
  });

  await signIn(page);
  await page.getByRole('button', { name: 'Send a Package' }).click();
  const form = {
    senderName: 'Ama Boateng',
    senderPhone: '0241234567',
    senderEmail: 'ama@example.com',
    senderAddress: '1 Main Street',
    recipientName: 'Kojo',
    recipientPhone: '0555555555',
    recipientAddress: 'Campus Hall',
    packageName: 'Books',
    type: 'Box',
    weight: '2',
  };
  for (const [name, value] of Object.entries(form)) {
    await page.locator(`[name="${name}"]`).fill(value);
  }
  await page.getByRole('button', { name: 'Submit Package' }).click();
  await expect(page).toHaveURL(/\/submit-success$/);
  await expect(page.getByText(publicTracking.tracking_id, { exact: true })).toBeVisible();
  expect(bookingData).toContain('name="sender_name"');
  expect(bookingData).not.toContain('booked_by');

  await page.getByRole('button', { name: 'Track this package' }).click();
  await expect(page.getByLabel('Tracking ID')).toHaveValue(publicTracking.tracking_id);
  const result = await trackFromForm(page);
  await expect(result.getByText(privateSender)).toHaveCount(0);
  await expect(result.getByRole('img')).toHaveCount(0);
});

test('My deliveries shows owned pages and details with loading, retry, empty and unavailable states', async ({ page, context }) => {
  await mockServices(context);
  const newest = { ...publicTracking, package_name: 'Newest package' };
  const older = { ...publicTracking, tracking_id: 'own67890', package_name: 'Older package' };
  const olderDetail = {
    ...older,
    sender_name: 'Ama Boateng',
    recipient_name: 'Kojo',
    recipient_address: 'Private campus address',
    package_type: 'Box',
    weight: '2.00',
  };
  const firstResponse = Promise.withResolvers();
  let failList = true;
  let failDetail = true;
  let empty = false;

  await context.route(`${apiOrigin}/deliveries**`, async route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers });
      return;
    }
    expect(request.headers().authorization).toMatch(/^Bearer /);
    const url = new URL(request.url());
    if (url.pathname === '/deliveries') {
      const secondPage = url.searchParams.get('page') === '2';
      if (failList) {
        await firstResponse.promise;
        await route.fulfill({ status: 503, headers });
        return;
      }
      const results = secondPage ? [older] : [
        newest,
        ...Array.from({ length: 19 }, (_, index) => ({
          ...newest, tracking_id: `other${index}`, package_name: `Package ${index + 2}`,
        })),
      ];
      await route.fulfill({
        headers,
        json: {
          count: empty ? 0 : 21,
          next: !empty && !secondPage ? `${apiOrigin}/deliveries?page=2` : null,
          previous: !empty && secondPage ? `${apiOrigin}/deliveries` : null,
          results: empty ? [] : results,
        },
      });
    } else if (url.pathname === '/deliveries/own67890') {
      if (failDetail) {
        await route.fulfill({ status: 503, headers });
        return;
      }
      await route.fulfill({ json: olderDetail, headers });
    } else {
      await route.fulfill({ status: 404, headers });
    }
  });

  await signIn(page);
  await page.getByRole('link', { name: 'My deliveries', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Loading deliveries…');
  firstResponse.resolve();
  await expect(page.getByRole('alert')).toContainText('Could not load your deliveries');
  failList = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'Newest package' })).toBeVisible();
  await expect(page.getByText(/older or guest bookings/i)).toBeVisible();

  const pagination = page.getByRole('navigation', { name: 'Delivery pages' });
  await pagination.getByRole('link', { name: 'Next' }).click();
  await expect(page).toHaveURL(/\/deliveries\?page=2$/);
  await expect(pagination).toContainText('Page 2');
  await expect(page.getByRole('heading', { name: 'Newest package' })).toHaveCount(0);

  await page.getByRole('link', { name: /Older package/ }).click();
  await expect(page.getByRole('alert')).toContainText('Could not load the delivery details');
  failDetail = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'Older package' })).toBeVisible();
  await expect(page.getByText(olderDetail.recipient_address)).toBeVisible();
  await page.getByRole('link', { name: 'Back to My deliveries' }).click();
  await expect(pagination).toContainText('Page 2');

  empty = true;
  await pagination.getByRole('link', { name: 'Previous' }).click();
  await expect(page.getByText('You don’t have any deliveries yet.')).toBeVisible();
  await page.goto('/deliveries/another-code');
  await expect(page.getByRole('alert')).toHaveText('Delivery not found.');
  await expect(page.getByText(olderDetail.recipient_address)).toHaveCount(0);
});
