import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { isAdmin, clearAdmin } from '@/lib/session';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = isAdmin();

  useEffect(() => {
    if (!admin) navigate('/');
  }, [admin, navigate]);

  if (!admin) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-lg">🗳️ NSPI Админ</h1>
            <nav className="flex gap-1">
              <NavLink to="/admin" end className={linkClass}>Басты бет</NavLink>
              <NavLink to="/admin/members" className={linkClass}>Ағзалар</NavLink>
              <NavLink to="/admin/meetings" className={linkClass}>Мәжилислер</NavLink>
            </nav>
          </div>
          <Button variant="outline" size="sm" onClick={() => { clearAdmin(); navigate('/'); }}>
            Шығыў
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
