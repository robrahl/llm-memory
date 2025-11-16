// Node-based health check to avoid curl dependency
import http from 'http';

const req = http.get('http://localhost:3000/health', (res) => {
  if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 5000);
