import { redirect } from 'next/navigation';
import { getOrganisationByCode, getCategories, getCategoryProgress } from '@/lib/db-helpers';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CircleCheck as CheckCircle2, Circle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QuestionnairePage({
  params,
  searchParams,
}: {
  params: { orgCode: string };
  searchParams?: { respondant?: string | string[] };
}) {
  const organisation = await getOrganisationByCode(params.orgCode);

  if (!organisation) {
    redirect('/');
  }

  const respondant =
    typeof searchParams?.respondant === 'string'
      ? searchParams.respondant.trim()
      : Array.isArray(searchParams?.respondant)
      ? searchParams?.respondant[0]?.trim() ?? ''
      : '';

  const categories = await getCategories();
  const categoryProgress = await getCategoryProgress(organisation.id, categories, respondant);

  const totalCount = categoryProgress.reduce((sum, cat) => sum + cat.total, 0);
  const completedCount = categoryProgress.reduce((sum, cat) => sum + cat.completed, 0);
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <Card className="shadow-lg border-slate-300 rounded-sm p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Welcome to Your Assessment
            </h1>
            <p className="text-lg text-slate-600">
              {organisation.name}
            </p>
            {respondant && (
              <p className="text-sm text-slate-500 mt-2">Responding as {respondant}</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-sm p-8 mb-8 border border-slate-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Overall Progress</h2>
              <div className="text-right">
                <p className="text-4xl font-bold text-slate-900">
                  {progressPercentage}%
                </p>
                <p className="text-sm text-slate-600">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">
                Select a category from the sidebar to begin
              </h3>
            </div>
            <div className="grid gap-3">
              {categoryProgress.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-4 bg-white rounded-sm border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {cat.completed === cat.total && cat.total > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-900">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {cat.completed} / {cat.total}
                      </p>
                      <p className="text-xs text-slate-500">features</p>
                    </div>
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-sm p-6">
            <h4 className="font-semibold text-slate-900 mb-2">Getting Started</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">1.</span>
                <span>Choose a category from the navigation menu on the left</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">2.</span>
                <span>Review each requirement and select the appropriate priority level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">3.</span>
                <span>Add notes and current state information as needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">4.</span>
                <span>All responses are saved automatically as you work</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
