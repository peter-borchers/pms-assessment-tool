'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CategoryProgress } from '@/lib/types';
import { CategoryWithSubcategories } from '@/lib/db-helpers';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Loader as Loader2 } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { useProgress } from '@/contexts/progress-context';

interface QuestionnaireNavProps {
  orgCode: string;
  organisationId: string;
  categoriesWithSubs: CategoryWithSubcategories[];
}

export function QuestionnaireNav({ orgCode, organisationId, categoriesWithSubs }: QuestionnaireNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [progress, setProgress] = useState<CategoryProgress[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const { refreshKey } = useProgress();
  const progressMap = new Map(progress.map((p) => [p.category, p]));
  const respondant = searchParams.get('respondant')?.trim() ?? '';
  const querySuffix = respondant ? `?respondant=${encodeURIComponent(respondant)}` : '';

  useEffect(() => {
    setLoadingPath(null);
  }, [pathname]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `/api/progress?orgId=${organisationId}${querySuffix ? `&respondant=${encodeURIComponent(respondant)}` : ''}`
        );
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };
    fetchProgress();
  }, [organisationId, refreshKey, querySuffix, respondant]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleNavigation = (path: string, hasSubcategories: boolean = false) => {
    if (hasSubcategories) return;

    setLoadingPath(path);
    startTransition(() => {
      router.push(path);
      router.refresh();
    });
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 sticky top-[73px] h-[calc(100vh-73px)]">
      <ScrollArea className="h-full">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Categories</h2>
          <nav className="space-y-1">
            {categoriesWithSubs.map((item) => {
              const categorySlug = encodeURIComponent(item.category);
              const isCategoryActive = pathname.includes(`/${categorySlug}`);
              const isExpanded = expandedCategories.has(item.category);
              const categoryProgress = progressMap.get(item.category);

              return (
                <div key={item.category}>
                  <div className="flex items-start gap-1">
                    {item.subcategories.length > 0 && (
                      <button
                        onClick={() => toggleCategory(item.category)}
                        className="p-1 hover:bg-slate-100 rounded-sm mt-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                    )}
                    <div
                      className={`flex-1 ${item.subcategories.length === 0 ? 'ml-6' : ''}`}
                    >
                      <Link
                        href={`/q/${orgCode}/${categorySlug}${querySuffix}`}
                        onClick={(e) => {
                          if (item.subcategories.length > 0) {
                            e.preventDefault();
                            toggleCategory(item.category);
                          } else {
                            e.preventDefault();
                            handleNavigation(`/q/${orgCode}/${categorySlug}${querySuffix}`);
                          }
                        }}
                        className={`block p-3 rounded-sm transition-colors ${
                          isCategoryActive && !pathname.split('/').pop()?.includes('%')
                            ? 'bg-blue-50 border border-blue-600'
                            : 'hover:bg-slate-50 border border-transparent'
                        } ${item.subcategories.length > 0 ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`text-sm font-semibold flex-1 ${
                              isCategoryActive ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        {categoryProgress && (
                          <Progress value={categoryProgress.percentage} className="h-1.5 mb-1.5" />
                        )}
                        {categoryProgress && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-slate-500">
                              You: <span className="font-semibold text-slate-700">{categoryProgress.completed}/{categoryProgress.total}</span>
                            </span>
                            {categoryProgress.othersCompleted > 0 && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="text-amber-600">
                                  Others: <span className="font-semibold">{categoryProgress.othersCompleted}/{categoryProgress.total}</span>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>

                  {isExpanded && item.subcategories.length > 0 && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.subcategories.map((subcategory) => {
                        const subcategorySlug = encodeURIComponent(subcategory);
                        const fullPath = `/q/${orgCode}/${categorySlug}/${subcategorySlug}${querySuffix}`;
                        const isSubActive = `${pathname}${querySuffix}` === fullPath;
                        const subProgress = categoryProgress?.subcategories?.find(
                          (sp) => sp.subcategory === subcategory
                        );
                        const isCompleted = subProgress && subProgress.completed === subProgress.total && subProgress.total > 0;

                        const isLoading = loadingPath === fullPath;

                        return (
                          <Link
                            key={subcategory}
                            href={fullPath}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation(fullPath);
                            }}
                            className={`block p-2 pl-4 rounded-sm transition-colors text-sm ${
                              isSubActive
                                ? 'bg-blue-50 text-blue-900 font-medium border border-blue-600'
                                : isCompleted
                                ? 'bg-green-50 text-green-900 hover:bg-green-100 border border-green-200'
                                : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                            } ${isLoading ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={isCompleted && !isSubActive ? 'font-medium' : ''}>{subcategory}</span>
                              <div className="flex items-center gap-1.5">
                                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                {subProgress && (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className={`text-[10px] whitespace-nowrap ${
                                      isCompleted && !isSubActive ? 'text-green-700 font-semibold' : 'text-slate-600'
                                    }`}>
                                      You: {subProgress.completed}/{subProgress.total}
                                    </span>
                                    {subProgress.othersCompleted > 0 && (
                                      <span className="text-[10px] whitespace-nowrap text-amber-600 font-medium">
                                        +{subProgress.othersCompleted} others
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}
