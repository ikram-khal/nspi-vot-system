import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getMember, clearMember } from '@/lib/session';
import { toast } from 'sonner';

interface ActiveQuestion {
  id: string;
  text: string;
  meeting_protocol: string;
  meeting_date: string;
  already_voted: boolean;
}

export default function VoterPage() {
  const navigate = useNavigate();
  const member = getMember();
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    if (!member) return;
    try {
      // Get meetings where this member is an attendee
      const { data: attendances } = await supabase
        .from('meeting_attendees')
        .select('meeting_id')
        .eq('member_id', member.id);

      if (!attendances?.length) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const meetingIds = attendances.map(a => a.meeting_id);

      // Get voting questions for those meetings
      const { data: votingQuestions } = await supabase
        .from('questions')
        .select('id, text, meeting_id, status')
        .eq('status', 'voting')
        .in('meeting_id', meetingIds);

      if (!votingQuestions?.length) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Get meetings info
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, protocol_number, meeting_date')
        .in('id', meetingIds);

      const meetingMap = Object.fromEntries((meetings || []).map(m => [m.id, m]));

      // Get votes this member already cast
      const { data: myVotes } = await supabase
        .from('question_votes')
        .select('question_id')
        .eq('member_id', member.id)
        .in('question_id', votingQuestions.map(q => q.id));

      const votedSet = new Set((myVotes || []).map(v => v.question_id));

      const result: ActiveQuestion[] = votingQuestions.map(q => ({
        id: q.id,
        text: q.text,
        meeting_protocol: meetingMap[q.meeting_id]?.protocol_number || '',
        meeting_date: meetingMap[q.meeting_id]?.meeting_date || '',
        already_voted: votedSet.has(q.id),
      }));

      setQuestions(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    if (!member) {
      navigate('/');
      return;
    }
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 4000);
    return () => clearInterval(interval);
  }, [member, navigate, fetchQuestions]);

  const castVote = async (questionId: string, voteType: 'for' | 'against' | 'abstain') => {
    if (!member) return;
    setVotingId(questionId);
    try {
      const { data, error } = await supabase.rpc('cast_vote', {
        p_question_id: questionId,
        p_member_id: member.id,
        p_vote_type: voteType,
      });
      if (error) throw error;
      if (data) {
        toast.success('Даўысыңыз қабыл етилди!');
        fetchQuestions();
      } else {
        toast.error('Даўыс бериў мүмкин емес');
      }
    } catch (err: any) {
      toast.error(err.message || 'Қәте');
    } finally {
      setVotingId(null);
    }
  };

  const handleLogout = () => {
    clearMember();
    navigate('/');
  };

  if (!member) return null;

  const unanswered = questions.filter(q => !q.already_voted);
  const answered = questions.filter(q => q.already_voted);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-sm">🗳️ NSPI Даўыс бериў</h1>
          <p className="text-xs text-muted-foreground">{member.name} (PIN: {member.pin})</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>Шығыў</Button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Жүкленбекте...</div>
        ) : unanswered.length === 0 && answered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground">Актив даўыс бериў жоқ</p>
            </CardContent>
          </Card>
        ) : unanswered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium">Барлық мәселелерге даўыс бердиңиз. Рахмет!</p>
            </CardContent>
          </Card>
        ) : (
          unanswered.map((q) => (
            <Card key={q.id} className="animate-fade-in-up">
              <CardHeader className="pb-2">
                <div className="text-xs text-muted-foreground mb-1">
                  Мәжилис №{q.meeting_protocol} • {q.meeting_date}
                </div>
                <CardTitle className="text-base leading-relaxed">{q.text}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => castVote(q.id, 'for')}
                    disabled={votingId === q.id}
                  >
                    ✅ Қосыламан
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => castVote(q.id, 'against')}
                    disabled={votingId === q.id}
                  >
                    ❌ Қарсыман
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => castVote(q.id, 'abstain')}
                    disabled={votingId === q.id}
                  >
                    ⬜ Бийтәреп
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {answered.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-2">⚠️ Сиз даўыс бергенсиз:</p>
            {answered.map(q => (
              <Card key={q.id} className="mb-2 opacity-60">
                <CardContent className="py-3">
                  <p className="text-sm">{q.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">Даўыс берилди ✓</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
