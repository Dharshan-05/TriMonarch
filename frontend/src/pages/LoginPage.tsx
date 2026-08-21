import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { ApiError } from '@/lib/api/errors';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { env } from '@/app/config/env.config';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (ApiError.isApiError(err)) {
        if (err.category === 'UNAUTHENTICATED' || err.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Invalid email address or password.');
        } else if (err.category === 'VALIDATION_ERROR') {
          setErrorMessage('Please check your input values and try again.');
        } else if (err.category === 'NETWORK_ERROR') {
          setErrorMessage('Network connection error. Server is unreachable.');
        } else {
          setErrorMessage(err.message || 'An error occurred during login.');
        }
      } else {
        setErrorMessage('An unexpected authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Container className="w-full max-w-md space-y-8">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-elevation">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {env.VITE_APP_TITLE} System
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your enterprise credentials to access the portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevation">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Secure single-sign-on access boundary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-semibold">Authentication Error</AlertTitle>
                  <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                </Alert>
              )}

              <FormField
                label="Work Email Address"
                required
                htmlFor="email"
                error={fieldErrors.email}
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@trimonarch.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={Boolean(fieldErrors.email)}
                    disabled={loading}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </FormField>

              <FormField
                label="Password"
                required
                htmlFor="password"
                error={fieldErrors.password}
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={Boolean(fieldErrors.password)}
                    disabled={loading}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};
