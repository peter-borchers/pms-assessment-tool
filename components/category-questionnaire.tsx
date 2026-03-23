'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FeatureWithResponse, PriorityLevel } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Check, Loader as Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/contexts/progress-context';

interface CategoryQuestionnaireProps {
  category: string;
  features: FeatureWithResponse[];
  organisationId: string;
  respondant?: string;
  categoryName?: string;
  subcategoryName?: string;
  initialCategoryNotes?: string;
}

const PRIORITY_OPTIONS: PriorityLevel[] = [
  'Must Have',
  'Should Have',
  'Nice to Have',
  'Not Required',
];

const PRIORITY_COLORS = {
  'Must Have': 'bg-red-50 border-red-600',
  'Should Have': 'bg-orange-50 border-orange-600',
  'Nice to Have': 'bg-blue-50 border-blue-600',
  'Not Required': 'bg-slate-50 border-slate-400',
};

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  'Must Have': 'text-red-700 bg-red-50 border-red-300',
  'Should Have': 'text-orange-700 bg-orange-50 border-orange-300',
  'Nice to Have': 'text-blue-700 bg-blue-50 border-blue-300',
  'Not Required': 'text-slate-600 bg-slate-50 border-slate-300',
};

const PRIORITY_BUTTON_STYLES = {
  'Must Have': {
    base: 'border-red-600 text-red-700 hover:bg-red-50 bg-white rounded-sm',
    active: 'bg-red-600 border-red-700 text-white font-medium shadow-sm rounded-sm'
  },
  'Should Have': {
    base: 'border-orange-600 text-orange-700 hover:bg-orange-50 bg-white rounded-sm',
    active: 'bg-orange-600 border-orange-700 text-white font-medium shadow-sm rounded-sm'
  },
  'Nice to Have': {
    base: 'border-blue-600 text-blue-700 hover:bg-blue-50 bg-white rounded-sm',
    active: 'bg-blue-600 border-blue-700 text-white font-medium shadow-sm rounded-sm'
  },
  'Not Required': {
    base: 'border-slate-400 text-slate-600 hover:bg-slate-50 bg-white rounded-sm',
    active: 'bg-slate-600 border-slate-700 text-white font-medium shadow-sm rounded-sm'
  },
};

interface ResponseData {
  priority?: string;
  current_state?: string;
  notes?: string;
}

export function CategoryQuestionnaire({
  category,
  features,
  organisationId,
  respondant = '',
  categoryName,
  subcategoryName,
  initialCategoryNotes = '',
}: CategoryQuestionnaireProps) {
  const { triggerProgressRefresh } = useProgress();
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'saving' | 'saved' }>({});
  const [openSubgroups, setOpenSubgroups] = useState<{ [key: string]: boolean }>({});
  const [localResponses, setLocalResponses] = useState<{ [key: string]: ResponseData }>({});
  const [categoryNotes, setCategoryNotes] = useState(initialCategoryNotes);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const saveQueueRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const pendingRequestsRef = useRef<{ [key: string]: AbortController }>({});

  useEffect(() => {
    const initialResponses: { [key: string]: ResponseData } = {};
    features.forEach((feature) => {
      if (feature.response) {
        initialResponses[feature.id] = {
          priority: feature.response.priority ?? undefined,
          current_state: feature.response.current_state ?? undefined,
          notes: feature.response.notes ?? undefined,
        };
      }
    });
    setLocalResponses(initialResponses);
  }, [features, organisationId, category]);

  const saveResponse = useCallback(
    async (
      featureId: string,
      priority?: string,
      currentState?: string,
      notes?: string
    ) => {
      if (pendingRequestsRef.current[featureId]) {
        pendingRequestsRef.current[featureId].abort();
      }

      const controller = new AbortController();
      pendingRequestsRef.current[featureId] = controller;

      setSaveStatus((prev) => ({ ...prev, [featureId]: 'saving' }));

      try {
        const response = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organisationId,
            featureId,
            respondant,
            priority,
            currentState,
            notes,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          setSaveStatus((prev) => ({ ...prev, [featureId]: 'saved' }));
          if (priority !== undefined) {
            triggerProgressRefresh();
          }
          setTimeout(() => {
            setSaveStatus((prev) => {
              const newState = { ...prev };
              delete newState[featureId];
              return newState;
            });
          }, 2000);
          delete pendingRequestsRef.current[featureId];
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error saving response:', error);
          setSaveStatus((prev) => {
            const newState = { ...prev };
            delete newState[featureId];
            return newState;
          });
        }
      }
    },
    [organisationId, respondant, triggerProgressRefresh]
  );

  const debouncedSave = useCallback(
    (featureId: string, responseData: ResponseData) => {
      if (saveQueueRef.current[featureId]) {
        clearTimeout(saveQueueRef.current[featureId]);
      }

      saveQueueRef.current[featureId] = setTimeout(() => {
        saveResponse(
          featureId,
          responseData.priority,
          responseData.current_state,
          responseData.notes
        );
        delete saveQueueRef.current[featureId];
      }, 500);
    },
    [saveResponse]
  );

  const handlePriorityChange = (featureId: string, priority: string) => {
    const currentData = localResponses[featureId] || {};
    const newData = { ...currentData, priority };
    setLocalResponses((prev) => ({ ...prev, [featureId]: newData }));

    if (saveQueueRef.current[featureId]) {
      clearTimeout(saveQueueRef.current[featureId]);
    }
    saveResponse(featureId, newData.priority, newData.current_state, newData.notes);
  };

  const handleCurrentStateChange = (featureId: string, currentState: string) => {
    const currentData = localResponses[featureId] || {};
    const newData = { ...currentData, current_state: currentState };
    setLocalResponses((prev) => ({ ...prev, [featureId]: newData }));
    debouncedSave(featureId, newData);
  };

  const handleNotesChange = (featureId: string, notes: string) => {
    const currentData = localResponses[featureId] || {};
    const newData = { ...currentData, notes };
    setLocalResponses((prev) => ({ ...prev, [featureId]: newData }));
    debouncedSave(featureId, newData);
  };

  const toggleSubgroup = (subgroupId: string) => {
    setOpenSubgroups((prev) => {
      const isCurrentlyOpen = prev[subgroupId];
      if (isCurrentlyOpen) {
        return { ...prev, [subgroupId]: false };
      } else {
        return { [subgroupId]: true };
      }
    });
  };

  const handleSaveCategoryNotes = async () => {
    if (!categoryName || !subcategoryName) return;

    setIsSavingNotes(true);
    setNotesSaved(false);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisationId,
          category: categoryName,
          subcategory: subcategoryName,
          notes: categoryNotes,
        }),
      });

      if (response.ok) {
        setNotesSaved(true);
        setTimeout(() => {
          setNotesSaved(false);
          setIsNotesDialogOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving category notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const renderSubgroupRow = (feature: FeatureWithResponse): JSX.Element => {
    const isOpen = openSubgroups[feature.id] ?? false;

    return (
      <>
        <TableRow key={feature.id} className="bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-150 hover:to-slate-100">
          <TableCell colSpan={4} className="font-semibold">
            <Collapsible open={isOpen} onOpenChange={() => toggleSubgroup(feature.id)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-900" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-900" />
                )}
                <span className="text-slate-900">{feature.feature_text}</span>
              </CollapsibleTrigger>
            </Collapsible>
          </TableCell>
        </TableRow>
        {isOpen && features
          .filter(
            (f) =>
              f.sequence > feature.sequence &&
              !f.is_subgroup &&
              (features.findIndex((sg) => sg.is_subgroup && sg.sequence > feature.sequence && sg.sequence < f.sequence) === -1)
          )
          .slice(0, getSubgroupFeatureCount(feature))
          .map((subFeature) => renderFeatureRow(subFeature, true))}
      </>
    );
  };

  const renderFeatureRow = (feature: FeatureWithResponse, isNested = false): JSX.Element => {
    if (feature.is_subgroup) {
      return renderSubgroupRow(feature);
    }

    const status = saveStatus[feature.id];
    const localResponse = localResponses[feature.id] || {};
    const currentPriority = localResponse.priority || feature.response?.priority;
    const otherResponses = (feature.responses || []).filter(
      (response) => (response.respondant ?? '') !== respondant
    );
    const priorityColor = currentPriority
      ? PRIORITY_COLORS[currentPriority as PriorityLevel]
      : '';

    return (
      <TableRow
        key={feature.id}
        className={`${priorityColor} border-l-4 transition-colors`}
      >
        <TableCell className={`${isNested ? 'pl-8' : ''} w-[30%]`}>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{feature.feature_text}</p>
            {feature.hint_text && (
              <p className="text-xs text-slate-600 italic">{feature.hint_text}</p>
            )}
          </div>
        </TableCell>

        <TableCell className="w-[30%]">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = currentPriority === option;
                const styles = PRIORITY_BUTTON_STYLES[option];
                return (
                  <Button
                    key={option}
                    onClick={() => handlePriorityChange(feature.id, option)}
                    variant="outline"
                    size="sm"
                    disabled={status === 'saving'}
                    className={`text-xs px-2.5 py-1 h-7 ${isSelected ? styles.active : styles.base} transition-all ${status === 'saving' ? 'opacity-50' : ''}`}
                  >
                    {option}
                  </Button>
                );
              })}
              {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-1" />}
              {status === 'saved' && <Check className="w-4 h-4 text-green-600 ml-1" />}
            </div>

            {otherResponses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Other Respondants
                </p>
                {otherResponses.map((response) => (
                  <div key={response.id} className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{response.respondant || 'Shared'}:</span>
                    {response.priority ? (
                      <span className={`font-medium px-1.5 py-0.5 rounded-sm border ${PRIORITY_BADGE_COLORS[response.priority] ?? 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                        {response.priority}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No priority</span>
                    )}
                    {response.current_state && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span><span className="font-medium text-slate-500">State:</span> {response.current_state}</span>
                      </>
                    )}
                    {response.notes && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span><span className="font-medium text-slate-500">Note:</span> {response.notes}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell className="w-[18%] align-top pt-3">
          <Input
            placeholder="Current state..."
            value={localResponse.current_state ?? feature.response?.current_state ?? ''}
            onChange={(e) =>
              handleCurrentStateChange(feature.id, e.target.value)
            }
            className="h-9 text-sm"
          />
        </TableCell>

        <TableCell className="w-[22%] align-top pt-3">
          <Input
            placeholder="Notes..."
            value={localResponse.notes ?? feature.response?.notes ?? ''}
            onChange={(e) =>
              handleNotesChange(feature.id, e.target.value)
            }
            className="h-9 text-sm"
          />
        </TableCell>
      </TableRow>
    );
  };

  const getSubgroupFeatureCount = (subgroup: FeatureWithResponse) => {
    const startIndex = features.findIndex((f) => f.id === subgroup.id);
    const nextSubgroupIndex = features.findIndex(
      (f, i) => i > startIndex && f.is_subgroup
    );
    return nextSubgroupIndex === -1
      ? features.length - startIndex - 1
      : nextSubgroupIndex - startIndex - 1;
  };

  const topLevelFeatures = features.filter((f) => {
    if (f.is_subgroup) return true;
    const previousSubgroupIndex = features.findLastIndex(
      (sg, i) => sg.is_subgroup && i < features.indexOf(f)
    );
    return previousSubgroupIndex === -1;
  });

  const allFeatures = features.filter((f) => !f.is_subgroup);
  const completedCount = allFeatures.filter((f) => {
    const localResponse = localResponses[f.id];
    return (localResponse?.priority) || f.response?.priority;
  }).length;

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{category}</h2>
          <p className="text-sm text-slate-600">
            Complete your assessment below. All responses are saved automatically.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Saving responses for <span className="font-semibold text-slate-700">{respondant || 'Shared'}</span>
          </p>
        </div>
        <div className="text-right bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-4 rounded-sm border border-slate-300 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Progress</p>
          <p className="text-3xl font-bold text-slate-900">
            {completedCount} <span className="text-slate-400">/</span> {allFeatures.length}
          </p>
        </div>
      </div>


      <Card className="shadow-sm border-slate-300 rounded-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
              <TableHead className="w-[30%] font-semibold text-slate-900 uppercase text-xs tracking-wider">Requirement</TableHead>
              <TableHead className="w-[30%] font-semibold text-slate-900 uppercase text-xs tracking-wider">Priority</TableHead>
              <TableHead className="w-[18%] font-semibold text-slate-900 uppercase text-xs tracking-wider">Current State</TableHead>
              <TableHead className="w-[22%] font-semibold text-slate-900 uppercase text-xs tracking-wider">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topLevelFeatures.map((feature) => renderFeatureRow(feature))}
          </TableBody>
        </Table>
      </Card>

      {categoryName && subcategoryName && (
        <div className="mt-6">
          <Card className="shadow-sm border-slate-300 rounded-sm bg-amber-50/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Additional Feature Notes</h3>
                </div>
                <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Edit Notes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Additional Notes for {category}</DialogTitle>
                      <DialogDescription>
                        Add any additional notes or comments about features in this category/subcategory.
                        These notes are private to your organisation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter your notes here..."
                        value={categoryNotes}
                        onChange={(e) => setCategoryNotes(e.target.value)}
                        className="min-h-[200px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsNotesDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveCategoryNotes}
                          disabled={isSavingNotes}
                          className="gap-2"
                        >
                          {isSavingNotes && <Loader2 className="w-4 h-4 animate-spin" />}
                          {notesSaved && <Check className="w-4 h-4" />}
                          {isSavingNotes ? 'Saving...' : notesSaved ? 'Saved!' : 'Save Notes'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {categoryNotes ? (
                <div className="bg-white border border-amber-200 rounded-sm p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{categoryNotes}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No additional notes for this category yet. Click "Edit Notes" to add some.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 flex items-center gap-6 text-xs bg-slate-50 p-4 rounded-sm border border-slate-200">
        <span className="font-semibold text-slate-600 uppercase tracking-wider">Priority Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border-2 border-red-600 rounded-sm"></div>
          <span className="text-slate-700 font-medium">Must Have</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-50 border-2 border-orange-600 rounded-sm"></div>
          <span className="text-slate-700 font-medium">Should Have</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border-2 border-blue-600 rounded-sm"></div>
          <span className="text-slate-700 font-medium">Nice to Have</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-50 border-2 border-slate-400 rounded-sm"></div>
          <span className="text-slate-700 font-medium">Not Required</span>
        </div>
      </div>
    </div>
  );
}
