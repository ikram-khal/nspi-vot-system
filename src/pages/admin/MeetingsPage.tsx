import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  protocol_number: string;
  meeting_date: string;
  question_count: number;
  closed_count: number;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState('');
  const [protocol, setProtocol] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const { data: meetingsData } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
    if (!meetingsData) { setLoading(false); return; }

    // Get question counts
    const { data: questions } = await supabase.from('questions').select('meeting_id, status');
    const qMap: Record<string, { total: number; closed: number }> = {};
    (questions || []).forEach(q => {
      if (!qMap[q.meeting_id]) qMap[q.meeting_id] = { total: 0, closed: 0 };
      qMap[q.meeting_id].total++;
      if (q.status === 'closed') qMap[q.meeting_id].closed++;
    });

    setMeetings(meetingsData.map(m => ({
      ...m,
      question_count: qMap[m.id]?.total || 0,
      closed_count: qMap[m.id]?.closed || 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createMeeting = async () => {
    if (!date.trim() || !protocol.trim()) return;
    const { error } = await supabase.from('meetings').insert({ meeting_date: date.trim(), protocol_number: protocol.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success('Мәжилис жаратылды');
    setDate(''); setProtocol('');
    load();
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm('Мәжилисти өширесиз бе?')) return;
    await supabase.from('meetings').delete().eq('id', id);
    toast.success('Өширилди');
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold">Мәжилислер</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Жаңа мәжилис</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Сәне (мыс. 22.03.2026)" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
            <Input placeholder="Протокол №" value={protocol} onChange={e => setProtocol(e.target.value)} className="w-32" />
            <Button onClick={createMeeting}>Жаратыў</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Жүкленбекте...</div>
      ) : meetings.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Мәжилислер жоқ</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {meetings.map(m => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/admin/meetings/${m.id}`)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Мәжилис №{m.protocol_number}</div>
                  <div className="text-sm text-muted-foreground">{m.meeting_date} • {m.question_count} мәселе ({m.closed_count} жабық)</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMeeting(m.id); }} className="text-destructive">
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
