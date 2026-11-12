import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, 
    { duration: '20s', target: 30 }, 
    { duration: '10s', target: 0 }, 
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<500'], 
  },
};

export default function () {
  // Ahora usamos la nueva ruta que no necesita llave
  const url = 'http://localhost:4100/api/test-load'; 
  
  const res = http.get(url);
  
  check(res, {
    'status es 200': (r) => r.status === 200,
    'trajo datos': (r) => r.json().length > 0,
  });
  
  sleep(1);
}
