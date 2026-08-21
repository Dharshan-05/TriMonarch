import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center py-12">
      <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
        <FileQuestion className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">404 — Page Not Found</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        The requested page or resource could not be found. Please check the URL or return to the main dashboard.
      </p>
      <div className="mt-6">
        <Button asChild variant="default" className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Application Entry
          </Link>
        </Button>
      </div>
    </Container>
  );
};
