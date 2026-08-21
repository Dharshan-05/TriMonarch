import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { Badge } from '@/components/ui/badge';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { roles } = useAuthorization();
  const primaryRole = roles[0] || 'ADMIN';

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg shadow-elevation border-destructive/20">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              403 — Access Denied
            </CardTitle>
            <CardDescription className="text-sm">
              Insufficient role permissions to access this area
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-xs text-muted-foreground">
            Your current account role does not hold the required privileges to view or perform operations on this route.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs font-medium text-muted-foreground">Assigned Role:</span>
            <Badge variant="outline" className="font-mono text-xs uppercase px-2 py-0.5">
              {primaryRole}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2 font-semibold"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
};
