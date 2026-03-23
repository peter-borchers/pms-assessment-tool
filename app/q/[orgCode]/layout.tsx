import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getOrganisationByCode, getCategoriesWithSubcategories } from '@/lib/db-helpers';
import { QuestionnaireNav } from '@/components/questionnaire-nav';
import { ProgressProvider } from '@/contexts/progress-context';

export default async function QuestionnaireLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { orgCode: string };
}) {
  const organisation = await getOrganisationByCode(params.orgCode);

  if (!organisation) {
    redirect('/');
  }

  const categoriesWithSubs = await getCategoriesWithSubcategories();

  return (
    <ProgressProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-lg">
          <div className="max-w-full mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center clip-hexagon">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white tracking-tight">{organisation.name}</h1>
                  <p className="text-sm text-slate-400 font-medium tracking-wide mt-0.5">{organisation.code}</p>
                </div>
              </div>
              <a
                href="/"
                className="px-5 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-sm transition-colors backdrop-blur-sm border border-white/20"
              >
                Exit Assessment
              </a>
            </div>
          </div>
        </header>
        <div className="flex">
          <QuestionnaireNav
            orgCode={params.orgCode}
            organisationId={organisation.id}
            categoriesWithSubs={categoriesWithSubs}
          />
          <main className="flex-1 p-8 overflow-x-auto">{children}</main>
        </div>
      </div>
    </ProgressProvider>
  );
}
