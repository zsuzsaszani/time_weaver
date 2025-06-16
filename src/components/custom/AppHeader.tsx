import { Zap } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 mb-8">
      <div className="container mx-auto flex items-center justify-center">
        <Zap className="h-10 w-10 text-primary mr-3" />
        <h1 className="text-4xl font-headline font-bold text-primary">
          TimeWeaver
        </h1>
      </div>
    </header>
  );
}
