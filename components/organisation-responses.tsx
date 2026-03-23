'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Organisation, FeatureWithResponse, CategoryProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrganisationResponsesProps {
  organisation: Organisation;
  features: FeatureWithResponse[];
  categories: string[];
  progress: CategoryProgress[];
}

export function OrganisationResponses({
  organisation,
  features,
  categories,
  progress,
}: OrganisationResponsesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '');

  const progressMap = new Map(progress.map((p) => [p.category, p]));
  const totalFeatures = features.filter((f) => !f.is_subgroup).length;
  const totalCompleted = features.filter(
    (f) => !f.is_subgroup && (f.responses || []).some((response) => response.priority)
  ).length;
  const overallPercentage = totalFeatures > 0 ? Math.round((totalCompleted / totalFeatures) * 100) : 0;

  const getPriorityBadgeVariant = (priority?: string | null) => {
    switch (priority) {
      case 'Must Have':
        return 'destructive';
      case 'Should Have':
        return 'default';
      case 'Nice to Have':
        return 'secondary';
      case 'Not Required':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredFeatures = selectedCategory
    ? features.filter((f) => f.category === selectedCategory && !f.is_subgroup)
    : features.filter((f) => !f.is_subgroup);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{organisation.name}</h1>
                <p className="text-sm text-slate-600 font-mono">{organisation.code}</p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export XLSX
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Progress</CardDescription>
              <CardTitle className="text-3xl">{overallPercentage}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={overallPercentage} className="h-2" />
              <p className="text-xs text-slate-600 mt-2">
                {totalCompleted} of {totalFeatures} features rated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Categories Completed</CardDescription>
              <CardTitle className="text-3xl">
                {progress.filter((p) => p.percentage === 100).length} / {categories.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">
                {progress.filter((p) => p.percentage === 100).length} categories fully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Created</CardDescription>
              <CardTitle className="text-xl">
                {new Date(organisation.created_at).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organisation.expires_at && (
                <p className="text-xs text-slate-600">
                  Expires: {new Date(organisation.expires_at).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Responses by Category</CardTitle>
            <CardDescription>View all questionnaire responses organized by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="mb-4 flex-wrap h-auto">
                {categories.map((category) => {
                  const categoryProgress = progressMap.get(category);
                  return (
                    <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                      <span>{category}</span>
                      {categoryProgress && (
                        <span className="text-xs text-slate-600">
                          ({categoryProgress.completed}/{categoryProgress.total})
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Feature</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Current State</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeatures
                        .filter((f) => f.category === category)
                        .map((feature) => (
                          <TableRow key={feature.id}>
                            <TableCell className="font-medium">{feature.feature_text}</TableCell>
                            <TableCell>
                              {(feature.responses || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(feature.responses || []).map((response) => (
                                    <div key={response.id} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-medium text-slate-600 min-w-24">
                                        {response.respondant || 'Shared'}
                                      </span>
                                      {response.priority ? (
                                        <Badge variant={getPriorityBadgeVariant(response.priority)}>
                                          {response.priority}
                                        </Badge>
                                      ) : (
                                        <span className="text-slate-400 text-sm">Not rated</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">Not rated</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {(feature.responses || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(feature.responses || []).map((response) => (
                                    <div key={response.id}>
                                      <span className="text-xs font-medium text-slate-600 block">
                                        {response.respondant || 'Shared'}
                                      </span>
                                      <span>{response.current_state ?? '-'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {(feature.responses || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(feature.responses || []).map((response) => (
                                    <div key={response.id}>
                                      <span className="text-xs font-medium text-slate-600 block">
                                        {response.respondant || 'Shared'}
                                      </span>
                                      <span>{response.notes ?? '-'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
