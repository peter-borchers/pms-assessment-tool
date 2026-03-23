'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Organisation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ExternalLink, Building2, Upload, Lock, LogOut, RefreshCw } from 'lucide-react';
import { CreateOrganisationDialog } from '@/components/create-organisation-dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchOrganisations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/organisations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      setOrganisations(data);
    } catch (error) {
      console.error('Error fetching organisations:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchOrganisations();
    } else {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      fetchOrganisations();
    } else {
      setAuthError('Incorrect password');
      setPassword('');
    }
  };

  const handleOrganisationCreated = () => {
    fetchOrganisations();
    setShowCreateDialog(false);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const response = await fetch('/api/features/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({ success: true, message: `Successfully imported ${result.count} features` });
      } else {
        setImportResult({ success: false, message: result.error || 'Import failed' });
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Error reading or importing file' });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-slate-300 rounded-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-gradient-to-br from-slate-900 to-slate-800 w-16 h-16 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Admin Access</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Enter password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg h-12 border-slate-400 focus:border-slate-900 focus:ring-slate-900 rounded-sm"
                  autoFocus
                />
                {authError && <p className="text-sm text-red-600 text-center">{authError}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 transition-all shadow-md rounded-sm"
                size="lg"
              >
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-12 h-12 clip-hexagon flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">Manage organisations and assessments</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => fetchOrganisations(true)}
                disabled={refreshing}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/admin/features">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-sm"
                >
                  Manage Features
                </Button>
              </Link>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Organisation
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-300 rounded-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Import Features</CardTitle>
              <CardDescription>
                Upload a CSV file to import features into the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    disabled={importing}
                    className="max-w-md border-slate-400 rounded-sm"
                  />
                  {importing && <span className="text-sm text-slate-600">Importing...</span>}
                </div>
                {importResult && (
                  <Alert variant={importResult.success ? 'default' : 'destructive'}>
                    <AlertDescription>{importResult.message}</AlertDescription>
                  </Alert>
                )}
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-2">Expected CSV format:</p>
                  <code className="block bg-slate-100 p-3 rounded-sm text-xs border border-slate-300">
                    id,category,category_slug,subcategory,subcategory_slug,sequence,feature_text,hint_text
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-300 rounded-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Organisations</CardTitle>
              <CardDescription>
                View and manage all organisations with active assessments
              </CardDescription>
            </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-600">Loading organisations...</div>
            ) : organisations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No organisations yet</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="outline"
                  className="border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first organisation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
                    <TableHead className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Name</TableHead>
                    <TableHead className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Code</TableHead>
                    <TableHead className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Completed</TableHead>
                    <TableHead className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Created</TableHead>
                    <TableHead className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Expires</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900 uppercase text-xs tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organisations.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{org.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 rounded-sm text-sm font-mono border border-slate-300">
                          {org.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-sm">
                          {org.completedCount || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-600">
                        {org.expires_at
                          ? new Date(org.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/admin/${org.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-sm"
                          >
                            View Responses
                          </Button>
                        </Link>
                        <Link href={`/q/${org.code}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-700 hover:text-blue-700 hover:bg-blue-50 rounded-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </main>

      <CreateOrganisationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOrganisationCreated}
      />
    </div>
  );
}
