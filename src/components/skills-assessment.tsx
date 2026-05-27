import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getAvailableSkills, getSkillWithQuestions, startAssessment, submitAssessment, getUserCurrentAssessment, getUserAssessmentHistory, getUserVerifiedSkills } from '@/lib/supabase-skills';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function SkillsAssessment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: ['available-skills'],
    queryFn: () => getAvailableSkills(),
    enabled: true,
  });

  const verifiedQuery = useQuery({
    queryKey: ['verified-skills', user?.id],
    enabled: !!user?.id,
    queryFn: () => (user?.id ? getUserVerifiedSkills(user.id) : Promise.resolve([])),
  });

  const historyQuery = useQuery({
    queryKey: ['assessment-history', user?.id],
    enabled: !!user?.id,
    queryFn: () => (user?.id ? getUserAssessmentHistory(user.id) : Promise.resolve([])),
  });

  const [selectedSkill, setSelectedSkill] = React.useState<any | null>(null);
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [assessmentId, setAssessmentId] = React.useState<string | null>(null);
  const [timeStarted, setTimeStarted] = React.useState<number | null>(null);

  const handleSelectSkill = async (skill: any) => {
    setSelectedSkill(skill);
    const detail = await getSkillWithQuestions(skill.id);
    setQuestions(detail?.questions || []);
  };

  const startMutation = useMutation({
    mutationFn: async (skillId: string) => {
      if (!user?.id) throw new Error('User not found');
      const assessment = await startAssessment(user.id, skillId);
      return assessment;
    },
    onSuccess: (data) => {
      if (!data) return;
      setAssessmentId(data.id);
      setTimeStarted(Date.now());
      toast.success('Assessment started');
    },
    onError: () => toast.error('Failed to start assessment'),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentId) throw new Error('No assessment');
      const timeTaken = timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0;
      const res = await submitAssessment(assessmentId, answers, timeTaken);
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['verified-skills', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['assessment-history', user?.id] });
      toast.success(res?.passed ? 'You passed the assessment!' : 'Assessment submitted');
      setAssessmentId(null);
      setSelectedSkill(null);
      setQuestions([]);
      setAnswers({});
    },
    onError: () => toast.error('Failed to submit assessment'),
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Choose a skill to take an assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {skillsQuery.data?.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-muted-foreground">{skill.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {verifiedQuery.data?.some((v) => v.skill_id === skill.id) ? (
                      <div className="text-sm text-green-600">Verified</div>
                    ) : (
                      <Button onClick={() => handleSelectSkill(skill)}>Take Test</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verified Skills</CardTitle>
            <CardDescription>Your badges from assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {verifiedQuery.data?.length ? (
                verifiedQuery.data.map((v) => (
                  <div key={v.id} className="flex items-center justify-between">
                    <div>{v.skill?.name}</div>
                    <div className="text-sm text-muted-foreground">{new Date(v.verified_at).toLocaleDateString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No verified skills yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedSkill && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment: {selectedSkill.name}</CardTitle>
            <CardDescription>{selectedSkill.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No questions available</div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <div className="font-medium">{q.question_text}</div>
                    {q.question_type === 'multiple_choice' && (
                      <div className="grid gap-2">
                        {q.options?.map((opt: any) => (
                          <Button key={opt.id} onClick={() => setAnswers({ ...answers, [q.id]: opt.id })} variant={answers[q.id] === opt.id ? 'default' : 'ghost'}>
                            {opt.text}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button onClick={() => startMutation.mutate(selectedSkill.id)} disabled={!!assessmentId}>Start</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={!assessmentId}>Submit</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
