'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CategoryData {
  category: string;
  subcategories: string[];
}

interface AddFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: CategoryData[];
  preSelectedCategory?: string;
  preSelectedSubcategory?: string;
}

export function AddFeatureDialog({
  open,
  onOpenChange,
  onSuccess,
  categories,
  preSelectedCategory,
  preSelectedSubcategory,
}: AddFeatureDialogProps) {
  const [category, setCategory] = useState(preSelectedCategory || '');
  const [subcategory, setSubcategory] = useState(preSelectedSubcategory || '');
  const [featureText, setFeatureText] = useState('');
  const [hintText, setHintText] = useState('');
  const [sequence, setSequence] = useState('');
  const [isSubgroup, setIsSubgroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const selectedCategoryData = categories.find(c => c.category === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subcategory || !featureText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory,
          feature_text: featureText,
          hint_text: hintText || null,
          sequence: sequence ? parseInt(sequence) : null,
          is_subgroup: isSubgroup,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create feature');
      }

      toast({
        title: 'Success',
        description: 'Feature created successfully',
      });

      setCategory(preSelectedCategory || '');
      setSubcategory(preSelectedSubcategory || '');
      setFeatureText('');
      setHintText('');
      setSequence('');
      setIsSubgroup(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating feature:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create feature',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Add New Feature</DialogTitle>
          <DialogDescription>
            Create a new feature for the questionnaire
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-600">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-slate-400 rounded-sm">
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="subcategory">
                  Subcategory <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={subcategory}
                  onValueChange={setSubcategory}
                  disabled={!category}
                >
                  <SelectTrigger className="border-slate-400 rounded-sm">
                    <SelectValue placeholder="Select subcategory" />
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

            <div className="space-y-2">
              <Label htmlFor="featureText">
                Feature Text <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="featureText"
                value={featureText}
                onChange={(e) => setFeatureText(e.target.value)}
                placeholder="Enter the feature description"
                className="min-h-[100px] border-slate-400 rounded-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hintText">Hint Text (Optional)</Label>
              <Input
                id="hintText"
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                placeholder="Enter hint text"
                className="border-slate-400 rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sequence">Sequence (Optional)</Label>
                <Input
                  id="sequence"
                  type="number"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder="Display order"
                  className="border-slate-400 rounded-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="isSubgroup"
                  checked={isSubgroup}
                  onCheckedChange={setIsSubgroup}
                />
                <Label htmlFor="isSubgroup" className="cursor-pointer">
                  Subgroup Header
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-slate-400 rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 rounded-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
