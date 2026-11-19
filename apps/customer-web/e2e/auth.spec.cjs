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
