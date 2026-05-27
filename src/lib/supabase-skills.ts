// @ts-nocheck
// Types will be regenerated after migration runs
import { supabase } from '@/integrations/supabase/client';

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  quiz_duration_minutes: number;
  passing_score: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  skill_id: string;
  question_text: string;
  question_type: string;
  options: Array<{ id: string; text: string; correct?: boolean }> | null;
  correct_answer: string | null;
  explanation: string | null;
  points: number;
  order_number: number | null;
}

export interface SkillAssessment {
  id: string;
  user_id: string;
  skill_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  passed: boolean | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  time_taken_seconds: number | null;
  answers: Record<string, any> | null;
}

export interface VerifiedSkill {
  id: string;
  user_id: string;
  skill_id: string;
  verified_at: string;
  skill?: Skill;
}

// Fetch all available skills
export async function getAvailableSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
  return (data || []) as Skill[];
}

// Fetch skill details with quiz questions
export async function getSkillWithQuestions(skillId: string): Promise<{
  skill: Skill;
  questions: QuizQuestion[];
} | null> {
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .single();

  if (skillError || !skill) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('skill_quiz_questions')
    .select('*')
    .eq('skill_id', skillId)
    .order('order_number');

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return { skill: skill as Skill, questions: [] };
  }

  return {
    skill: skill as Skill,
    questions: (questions || []) as QuizQuestion[],
  };
}

// Start a new assessment
export async function startAssessment(userId: string, skillId: string): Promise<SkillAssessment | null> {
  const { data, error } = await supabase
    .from('user_skill_assessments')
    .insert([
      {
        user_id: userId,
        skill_id: skillId,
        status: 'in_progress',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error starting assessment:', error);
    return null;
  }
  return data as SkillAssessment;
}

// Submit assessment answers and calculate score
export async function submitAssessment(
  assessmentId: string,
  answers: Record<string, string>,
  timeTakenSeconds: number
): Promise<SkillAssessment | null> {
  // Fetch the assessment and skill to calculate score
  const { data: assessment, error: assessmentError } = await supabase
    .from('user_skill_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (assessmentError || !assessment) return null;

  // Fetch correct answers from questions
  const { data: questions, error: questionsError } = await supabase
    .from('skill_quiz_questions')
    .select('*')
    .eq('skill_id', assessment.skill_id);

  if (questionsError || !questions) return null;

  // Calculate score
  let correctCount = 0;
  let totalPoints = 0;

  questions.forEach((q: any) => {
    totalPoints += q.points || 10;
    if (answers[q.id] === q.correct_answer) {
      correctCount += q.points || 10;
    }
  });

  const score = totalPoints > 0 ? Math.round((correctCount / totalPoints) * 100) : 0;
  const skill = (await (supabase as any).from('skills').select('passing_score').eq('id', assessment.skill_id).single()).data;
  const passed = score >= (skill?.passing_score || 70);

  // Update assessment
  const { data, error } = await supabase
    .from('user_skill_assessments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      score,
      passed,
      answers,
      time_taken_seconds: timeTakenSeconds,
    })
    .eq('id', assessmentId)
    .select()
    .single();

  if (error) {
    console.error('Error submitting assessment:', error);
    return null;
  }
  return data as SkillAssessment;
}

// Get user's verified skills
export async function getUserVerifiedSkills(userId: string): Promise<VerifiedSkill[]> {
  const { data, error } = await supabase
    .from('user_verified_skills')
    .select(
      `
      id,
      user_id,
      skill_id,
      verified_at,
      skills(id, name, description, difficulty)
    `
    )
    .eq('user_id', userId)
    .order('verified_at', { ascending: false });

  if (error) {
    console.error('Error fetching verified skills:', error);
    return [];
  }
  return (data || []) as VerifiedSkill[];
}

// Get user's current assessment (if any)
export async function getUserCurrentAssessment(userId: string, skillId: string): Promise<SkillAssessment | null> {
  const { data, error } = await supabase
    .from('user_skill_assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .eq('status', 'in_progress')
    .single();

  if (error) return null;
  return data as SkillAssessment;
}

// Get assessment history for a user
export async function getUserAssessmentHistory(userId: string): Promise<SkillAssessment[]> {
  const { data, error } = await supabase
    .from('user_skill_assessments')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'abandoned')
    .order('completed_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching assessment history:', error);
    return [];
  }
  return (data || []) as SkillAssessment[];
}
