import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId, setMember, setAdmin, ADMIN_PASSWORD } from '@/lib/session';
import { toast } from 'sonner';

export default function LoginPage() {
  const [mode, setMode] = useState<'voter' | 'admin'>('voter');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVoterLogin = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('pin', pin.trim())
        .maybeSingle();

      if (error) throw error;
      if (!member) {
        toast.error('PIN табылмады');
        return;
      }

      if (member.session_id && member.session_id !== sessionId) {
        toast.error('Бул PIN басқа аккаунтқа байланған. Хаткерге хабарласың.');
        return;
      }

      if (!member.session_id) {
        await supabase.from('members').update({ session_id: sessionId }).eq('id', member.id);
      }

      setMember({ id: member.id, name: member.name, pin: member.pin });
      toast.success(`Хош келдиңиз, ${member.name}!`);
      navigate('/vote');
    } catch (err: any) {
      toast.error(err.message || 'Қәте');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAdmin(true);
      toast.success('Админ панелге кириш');
      navigate('/admin');
    } else {
      toast.error('Қәте пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground text-2xl font-bold">🗳️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NSPI Даўыс бериў системасы</h1>
          <p className="text-muted-foreground mt-1">Илмий кеңеш жасырын даўыс бериў</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'voter' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('voter')}
          >
            Ағза (Даўыс бериўши)
          </Button>
          <Button
            variant={mode === 'admin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('admin')}
          >
            Хаткер (Админ)
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {mode === 'voter' ? 'PIN код менен кириш' : 'Админ кириси'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'voter' ? (
              <div className="space-y-4">
                <Input
                  placeholder="PIN кодыңызды киргизиң"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVoterLogin()}
                  maxLength={10}
                  className="text-center text-lg tracking-widest"
                />
                <Button className="w-full" onClick={handleVoterLogin} disabled={loading}>
                  {loading ? 'Тексерилмекте...' : 'Кириш'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                <Button className="w-full" onClick={handleAdminLogin}>
                  Кириш
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
