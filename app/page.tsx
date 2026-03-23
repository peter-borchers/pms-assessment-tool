'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const [orgCode, setOrgCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!orgCode.trim()) {
      setError('Please enter your organisation code');
      setLoading(false);
      return;
    }

    try {
      console.log('Validating code:', orgCode.trim());
      const response = await fetch(`/api/organisations/validate?code=${encodeURIComponent(orgCode.trim())}`);
      const data = await response.json();
      console.log('Validation response:', data);

      if (data.valid) {
        console.log('Valid code, redirecting...');
        router.push(`/q/${orgCode.trim()}`);
      } else {
        setError(data.error || 'Invalid organisation code. Please check and try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-300 rounded-sm">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto">
            <img
              src="/PMB_Services_logo_(2).png"
              alt="PMB Services"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">PMS Requirements Assessment</CardTitle>
          <CardDescription className="text-base text-slate-600 px-4">
            Enter your organisation code to begin or resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter Code"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono h-12 border-slate-400 focus:border-slate-900 focus:ring-slate-900 rounded-sm placeholder:italic"
                disabled={loading}
              />
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 transition-all shadow-md rounded-sm"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Validating...' : 'Continue to Assessment'}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Administrator?{' '}
              <a href="/admin" className="text-blue-700 hover:underline font-semibold">
                Access dashboard
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
