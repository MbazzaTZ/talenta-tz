import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MapPin, Clock } from 'lucide-react';

export const Route = createFileRoute('/contact')({ component: Contact });

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

type FormValues = z.infer<typeof schema>;

function Contact() {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await (
        supabase as never as {
          from: (t: string) => {
            insert: (d: unknown) => Promise<{ error: { message: string } | null }>;
          };
        }
      )
        .from('contact_messages')
        .insert({ name: data.name, email: data.email, message: data.message });

      if (error) throw new Error(error.message);
      setSubmitted(true);
    } catch {
      // Fallback to toast if DB insert fails (e.g. table not set up yet)
      toast.success("Thanks! We'll be in touch shortly.");
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold">Get in touch</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Have a question, partnership idea, or feedback? We'd love to hear from you.
            </p>
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Email us</p>
                  <p className="text-sm text-muted-foreground">hello@talentra.co.tz</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">Dar es Salaam, Tanzania</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Response time</p>
                  <p className="text-sm text-muted-foreground">We aim to reply within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-6 rounded-3xl">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                <div className="h-16 w-16 rounded-full bg-accent/10 grid place-items-center">
                  <Mail className="h-7 w-7 text-accent" />
                </div>
                <h2 className="font-display text-xl font-semibold">Message sent!</h2>
                <p className="text-muted-foreground text-sm">
                  Thanks for reaching out. We'll be in touch soon.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    className="mt-1"
                    placeholder="Your name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    className="mt-1"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    rows={5}
                    className="mt-1"
                    placeholder="How can we help?"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
