import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { parseXlsx, downloadTemplate } from '@/lib/xlsx-utils';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  pin: string;
  session_id: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('members').select('*').order('name');
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addMember = async () => {
    if (!name.trim() || !pin.trim()) return;
    const { error } = await supabase.from('members').insert({ name: name.trim(), pin: pin.trim() });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Бул PIN аллақашан бар' : error.message);
      return;
    }
    toast.success('Ағза қосылды');
    setName(''); setPin('');
    load();
  };

  const deleteMember = async (id: string, memberName: string) => {
    if (!confirm(`"${memberName}" ағзасын өширесиз бе?`)) return;
    await supabase.from('members').delete().eq('id', id);
    toast.success('Өширилди');
    load();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseXlsx(file);
      const existingPins = new Set(members.map(m => m.pin));
      const toAdd = parsed.filter(p => !existingPins.has(p.pin));
      const skipped = parsed.length - toAdd.length;

      if (toAdd.length > 0) {
        const { error } = await supabase.from('members').insert(toAdd);
        if (error) throw error;
      }

      toast.success(`Қосылды: ${toAdd.length}, Өткизилди (дубликат PIN): ${skipped}`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Импорт қәтеси');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ағзалар</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>📥 Шаблон</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            📤 XLSX импорт
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Жаңа ағза қосыў</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Аты-жөни" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
            <Input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} className="w-28" />
            <Button onClick={addMember}>Қосыў</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Жүкленбекте...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Ағзалар жоқ</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Аты-жөни</TableHead>
                  <TableHead className="w-24">PIN</TableHead>
                  <TableHead className="w-24">Статус</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m, i) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="font-mono">{m.pin}</TableCell>
                    <TableCell>{m.session_id ? '✅' : '⏳'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMember(m.id, m.name)}>
                        🗑️
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
