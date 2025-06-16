
'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/custom/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-2 px-4 selection:bg-primary/20 selection:text-primary">
      <AppHeader />
      <main className="container mx-auto max-w-3xl w-full flex flex-col items-center space-y-8 pb-12 text-center">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-4xl text-primary">
              Welcome to TimeWeaver!
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Organize your life, master your commitments, and make space for what truly matters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground leading-relaxed">
              TimeWeaver is your personal AI scheduling assistant. This welcome page is your starting point.
              It helps you visualize your week by intelligently placing your fixed commitments 
              and suggesting optimal times for your desired activities. Whether you're looking to boost 
              productivity, find more time for hobbies, or simply get a clearer picture of your schedule, 
              TimeWeaver is here to assist.
            </p>
            <p className="text-foreground leading-relaxed">
              Get started by telling us a bit about your lifestyle, defining your non-negotiable commitments, 
              and listing the activities you want to incorporate into your week.
            </p>
            <div className="pt-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/scheduler">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
         <div className="mt-10 p-6 bg-muted/50 rounded-lg w-full">
            <h3 className="font-headline text-2xl text-primary mb-3">How It Works:</h3>
            <ol className="list-decimal list-inside text-left space-y-2 text-foreground">
                <li><strong>Lifestyle Assessment:</strong> Share your general daily routines and preferences.</li>
                <li><strong>Commitment Definition:</strong> Input your fixed appointments like work or school.</li>
                <li><strong>Desired Activities:</strong> List activities you want to make time for, like hobbies or exercise.</li>
                <li><strong>Schedule Generation:</strong> View a personalized timetable and suggestions.</li>
                <li><strong>Refine & Regenerate:</strong> Adjust and get new schedule variations as needed.</li>
            </ol>
        </div>
      </main>
    </div>
  );
}
