import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiStatus } from '@/hooks/use-api-status';
import { CheckCircle2, AlertCircle, Layers, Server, Shield, Cpu } from 'lucide-react';
import { env } from '@/app/config/env.config';

export const HomePage: React.FC = () => {
  const { data: health, isLoading, isError } = useApiStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Frontend Foundation Architecture
        </h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Mini ERP Phase 080 — Production-grade frontend architecture, environment setup,
          shared infrastructure, typed API client, React Router boundary, and provider tree.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Phase 080 Active
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="h-3.5 w-3.5" /> Scalable Directory Layout
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Shield className="h-3.5 w-3.5" /> Strict TypeScript & ESLint
          </span>
        </div>
      </div>

      {/* Grid of Diagnostic & Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Backend API Connection Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Backend Integration</CardTitle>
            <Server className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">API Base URL</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 truncate">
                  {env.VITE_API_BASE_URL}
                </code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Backend Health Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {isLoading && (
                    <span className="text-xs text-muted-foreground">Checking backend connectivity...</span>
                  )}
                  {!isLoading && !isError && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Connected ({health?.status || 'OK'})
                    </span>
                  )}
                  {isError && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" /> Backend Offline (Local fallback active)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Configuration Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Environment Config</CardTitle>
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <dt className="text-muted-foreground">VITE_APP_ENV</dt>
                <dd className="font-mono font-semibold">{env.VITE_APP_ENV}</dd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <dt className="text-muted-foreground">VITE_API_TIMEOUT</dt>
                <dd className="font-mono font-semibold">{env.VITE_API_TIMEOUT} ms</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Strict Zod Validation</dt>
                <dd className="font-semibold text-emerald-600">Passed</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Foundation Modules Standard Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Prepared Feature Boundaries</CardTitle>
            <CardDescription className="text-xs">
              Ready for Phases 081–100 without restructuring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Auth & RBAC Interceptors (Phase 083)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Navigation & Shell Routing (Phase 084)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Design System Tokens (Phase 081)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Business Modules (Phases 085–099)
              </li>
            </ul>
            <div className="mt-4">
              <Button size="sm" variant="outline" className="w-full">
                Architecture Spec Ready
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
