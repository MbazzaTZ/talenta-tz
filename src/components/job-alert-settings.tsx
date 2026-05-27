import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getJobAlert, createJobAlert, updateJobAlert, JobAlert } from '@/lib/supabase-alerts';
import { useAuth } from '@/lib/auth';

export function JobAlertSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [keywordInput, setKeywordInput] = React.useState('');
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [frequency, setFrequency] = React.useState<'daily' | 'weekly' | 'immediately'>('daily');
  const [enabled, setEnabled] = React.useState(true);

  const commonRegions = ['Dar es Salaam', 'Nairobi', 'Lagos', 'Remote'];
  const commonIndustries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Sales', 'Marketing'];
  const positionLevels = ['entry', 'mid', 'senior', 'manager', 'director'];

  // Fetch existing alert
  const alertQuery = useQuery({
    queryKey: ['jobAlert', user?.id],
    enabled: !!user?.id,
    queryFn: () => getJobAlert(user!.id),
  });

  React.useEffect(() => {
    if (alertQuery.data) {
      setKeywords(alertQuery.data.keywords || []);
      setSelectedRegions(alertQuery.data.regions || []);
      setSelectedIndustries(alertQuery.data.industries || []);
      setSelectedLevels(alertQuery.data.position_levels || []);
      setFrequency(alertQuery.data.email_frequency || 'daily');
      setEnabled(alertQuery.data.enabled !== false);
    }
  }, [alertQuery.data]);

  // Save alert mutation
  const saveAlertMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');

      const alertData = {
        keywords,
        regions: selectedRegions,
        industries: selectedIndustries,
        position_levels: selectedLevels,
        email_frequency: frequency,
        enabled,
      };

      if (alertQuery.data?.id) {
        return updateJobAlert(user.id, alertData);
      } else {
        return createJobAlert(user.id, alertData);
      }
    },
    onSuccess: () => {
      toast.success('Job alert saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobAlert', user?.id] });
    },
    onError: () => {
      toast.error('Failed to save job alert');
    },
  });

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Job Alerts
            </CardTitle>
            <CardDescription>Get notified when jobs match your criteria</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="alert-enabled">Enable</Label>
            <Switch
              id="alert-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Keywords */}
        <div className="space-y-2">
          <Label>Keywords (job titles, skills)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., React Developer, Python"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                {keyword}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeKeyword(keyword)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-2">
          <Label>Preferred Regions</Label>
          <div className="flex flex-wrap gap-2">
            {commonRegions.map((region) => (
              <Badge
                key={region}
                variant={selectedRegions.includes(region) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Badge>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div className="space-y-2">
          <Label>Industries</Label>
          <div className="flex flex-wrap gap-2">
            {commonIndustries.map((industry) => (
              <Badge
                key={industry}
                variant={selectedIndustries.includes(industry) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Position Levels */}
        <div className="space-y-2">
          <Label>Position Levels</Label>
          <div className="flex flex-wrap gap-2">
            {positionLevels.map((level) => (
              <Badge
                key={level}
                variant={selectedLevels.includes(level) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => toggleLevel(level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        {/* Email Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">Email Frequency</Label>
          <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          onClick={() => saveAlertMutation.mutate()}
          disabled={saveAlertMutation.isPending}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveAlertMutation.isPending ? 'Saving...' : 'Save Alert Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
