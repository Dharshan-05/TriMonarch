import { Router, Request, Response } from 'express';

const router = Router();

let totalRequests = 0;
let totalErrors = 0;
let totalDurationMs = 0;

export const recordHttpMetric = (_method: string, statusCode: number, durationMs: number): void => {
  totalRequests += 1;
  totalDurationMs += durationMs;
  if (statusCode >= 400) {
    totalErrors += 1;
  }
};

router.get('/metrics', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const avgDurationMs = totalRequests > 0 ? (totalDurationMs / totalRequests).toFixed(2) : '0';

  const metricsOutput = [
    '# HELP trimonarch_http_requests_total Total HTTP requests processed.',
    '# TYPE trimonarch_http_requests_total counter',
    `trimonarch_http_requests_total ${totalRequests}`,
    '',
    '# HELP trimonarch_http_errors_total Total HTTP error responses (4xx and 5xx).',
    '# TYPE trimonarch_http_errors_total counter',
    `trimonarch_http_errors_total ${totalErrors}`,
    '',
    '# HELP trimonarch_http_request_duration_ms Total cumulative HTTP request duration in milliseconds.',
    '# TYPE trimonarch_http_request_duration_ms counter',
    `trimonarch_http_request_duration_ms ${totalDurationMs}`,
    `trimonarch_http_request_duration_avg_ms ${avgDurationMs}`,
    '',
    '# HELP trimonarch_process_uptime_seconds Process uptime in seconds.',
    '# TYPE trimonarch_process_uptime_seconds gauge',
    `trimonarch_process_uptime_seconds ${uptimeSeconds}`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metricsOutput);
});

export default router;
