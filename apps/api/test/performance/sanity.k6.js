import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://localhost:4000';
const vus = Number(__ENV.PERF_VUS || 50);
const duration = __ENV.PERF_DURATION || '30s';

const authFailures = new Counter('auth_failures');
const endpointFailures = new Counter('endpoint_failures');
const successRate = new Rate('success_rate');
const e2eFlowDuration = new Trend('flow_duration_ms');

export const options = {
  vus,
  duration,
  discardResponseBodies: false,
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    success_rate: ['rate>0.98'],
    flow_duration_ms: ['p(95)<2500'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

function uniqueEmail() {
  return `perf-vu${__VU}-iter${__ITER}-${Date.now()}@test.com`;
}

function safeJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export default function () {
  const startedAt = Date.now();
  const email = uniqueEmail();
  const password = 'password123';

  const registerRes = http.post(
    `${baseUrl}/auth/register`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_register' } },
  );

  const registerOk = check(registerRes, {
    'register status is 201': (r) => r.status === 201,
  });

  if (!registerOk) {
    authFailures.add(1);
    successRate.add(false);
    sleep(0.5);
    return;
  }

  const registerBody = safeJson(registerRes);
  const accessToken = registerBody?.accessToken;
  if (!accessToken) {
    authFailures.add(1);
    successRate.add(false);
    sleep(0.5);
    return;
  }
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const createRes = http.post(
    `${baseUrl}/blocks`,
    JSON.stringify({ title: `Perf block ${__VU}-${__ITER}`, content: 'k6 sanity content' }),
    { headers: authHeaders, tags: { name: 'blocks_create' } },
  );

  const createOk = check(createRes, {
    'create status is 201': (r) => r.status === 201,
  });

  if (!createOk) {
    endpointFailures.add(1);
    successRate.add(false);
    sleep(0.5);
    return;
  }

  const createBody = safeJson(createRes);
  const blockId = createBody?.id;
  if (!blockId) {
    endpointFailures.add(1);
    successRate.add(false);
    sleep(0.5);
    return;
  }

  const getRes = http.get(`${baseUrl}/blocks/${blockId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    tags: { name: 'blocks_get' },
  });

  const getOk = check(getRes, {
    'get block status is 200': (r) => r.status === 200,
  });

  const listRes = http.get(`${baseUrl}/blocks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    tags: { name: 'blocks_list' },
  });

  const listOk = check(listRes, {
    'list blocks status is 200': (r) => r.status === 200,
  });

  const flowOk = getOk && listOk;
  if (!flowOk) {
    endpointFailures.add(1);
  }

  successRate.add(flowOk);
  e2eFlowDuration.add(Date.now() - startedAt);

  sleep(1);
}
