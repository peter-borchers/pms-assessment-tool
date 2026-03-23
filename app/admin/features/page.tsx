'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Feature } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddFeatureDialog } from '@/components/add-feature-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CategoryData {
  category: string;
  subcategories: string[];
}

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
}

export default function ManageFeaturesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      fetchFeatures();
    } else {
      setFeatures([]);
    }
  }, [selectedCategory, selectedSubcategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/features/categories');
      const data = await response.json();
      const sortedData = data
        .map((cat: CategoryData) => ({
          ...cat,
          subcategories: [...cat.subcategories].sort((a, b) => a.localeCompare(b))
        }))
        .sort((a: CategoryData, b: CategoryData) => a.category.localeCompare(b.category));
      setCategories(sortedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    }
  };

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        subcategory: selectedSubcategory,
      });
      const response = await fetch(`/api/features?${params}`);
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: 'Error',
        description: 'Failed to load features',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeature = async (featureId: string, updates: Partial<Feature>) => {
    setSaving(featureId);
    try {
      const response = await fetch('/api/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: featureId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature');
      }

      const updatedFeature = await response.json();
      setFeatures(features.map(f => f.id === featureId ? updatedFeature : f));

      toast({
        title: 'Success',
        description: 'Feature updated successfully',
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleFeatureCreated = () => {
    fetchFeatures();
  };

  const handleDeleteFeature = async () => {
    if (!featureToDelete) return;

    const featureId = featureToDelete.id;
    setDeleting(featureId);

    try {
      console.log('Deleting feature:', featureId);

      const response = await fetch(`/api/features?id=${featureId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('Delete failed:', data);
        throw new Error(data.error || 'Failed to delete feature');
      }

      const result = await response.json();
      console.log('Delete result:', result);

      setFeatures(features.filter(f => f.id !== featureId));
      setFeatureToDelete(null);

      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete feature',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const categoriesToHide = settings.find(s => s.key === 'CategoriesToHide');
      if (categoriesToHide) {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'CategoriesToHide',
            value: categoriesToHide.value,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update settings');
        }

        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const selectedCategoryData = categories.find(c => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 rounded-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Manage Features</h1>
                <p className="text-sm text-slate-400">Edit feature text and control visibility</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-300 rounded-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Settings</CardTitle>
              <CardDescription>
                Configure application-wide settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.key}</Label>
                    <p className="text-sm text-slate-600">{setting.description}</p>
                    <Input
                      id={setting.key}
                      value={setting.value}
                      onChange={(e) => {
                        setSettings(settings.map(s =>
                          s.id === setting.id ? { ...s, value: e.target.value } : s
                        ));
                      }}
                      placeholder="Enter comma-separated category names"
                      className="border-slate-400 rounded-sm"
                    />
                  </div>
                ))}
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 rounded-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-300 rounded-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Filter Features</CardTitle>
              <CardDescription>
                Select a category and subcategory to view and edit features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="border-slate-400 rounded-sm">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={selectedSubcategory}
                    onValueChange={setSelectedSubcategory}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className="border-slate-400 rounded-sm">
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategoryData?.subcategories.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="text-center py-8 text-slate-600">Loading features...</div>
          )}

          {!loading && features.length === 0 && selectedCategory && selectedSubcategory && (
            <div className="text-center py-8 text-slate-600">
              No features found for this category and subcategory
            </div>
          )}

          {!loading && features.length > 0 && (
            <div className="space-y-4">
              {features.map((feature) => (
                <Card key={feature.id} className="shadow-sm border-slate-300 rounded-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`feature-${feature.id}`}>
                            Feature Text {feature.is_subgroup && '(Subgroup Header)'}
                          </Label>
                          <Textarea
                            id={`feature-${feature.id}`}
                            value={feature.feature_text}
                            onChange={(e) => {
                              setFeatures(features.map(f =>
                                f.id === feature.id ? { ...f, feature_text: e.target.value } : f
                              ));
                            }}
                            className="min-h-[80px] border-slate-400 rounded-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                          <Switch
                            checked={feature.is_active}
                            onCheckedChange={(checked) => {
                              handleUpdateFeature(feature.id, { is_active: checked });
                            }}
                          />
                          <Label className="text-sm font-medium">
                            {feature.is_active ? 'Active' : 'Inactive'}
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`hint-${feature.id}`}>Hint Text (Optional)</Label>
                        <Input
                          id={`hint-${feature.id}`}
                          value={feature.hint_text || ''}
                          onChange={(e) => {
                            setFeatures(features.map(f =>
                              f.id === feature.id ? { ...f, hint_text: e.target.value } : f
                            ));
                          }}
                          placeholder="Enter hint text"
                          className="border-slate-400 rounded-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-600">
                          Sequence: {feature.sequence}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setFeatureToDelete(feature)}
                            disabled={deleting === feature.id}
                            className="border-red-400 text-red-700 hover:bg-red-50 rounded-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                          <Button
                            onClick={() => {
                              handleUpdateFeature(feature.id, {
                                feature_text: feature.feature_text,
                                hint_text: feature.hint_text,
                              });
                            }}
                            disabled={saving === feature.id}
                            className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 rounded-sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {saving === feature.id ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddFeatureDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleFeatureCreated}
        categories={categories}
        preSelectedCategory={selectedCategory}
        preSelectedSubcategory={selectedSubcategory}
      />

      <AlertDialog open={!!featureToDelete} onOpenChange={() => setFeatureToDelete(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feature? This will also delete all associated responses from organizations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-red-600 hover:bg-red-700 rounded-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
