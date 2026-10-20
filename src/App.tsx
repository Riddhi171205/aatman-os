import React, { useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BrainCircuit, Orbit } from 'lucide-react';
import AatmanDashboard from '@/components/AatmanDashboard';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [user, setUser] = useState<any>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.getMe()
        .then((res) => setUser(res.user))
        .catch(() => setIsAuthenticated(false));
    }
  }, [isAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let res;
      if (isLoginView) {
        res = await api.login({ username, password });
      } else {
        res = await api.register({ username, password });
      }
      setAuthToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      toast.success(isLoginView ? 'System Authorized' : 'Neurolink Established');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <>
        <Toaster theme="dark" />
        <AatmanDashboard user={user} onLogout={() => {
          localStorage.removeItem('aatman_token');
          setIsAuthenticated(false);
          setUser(null);
        }} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background technical-grid relative overflow-hidden">
      <Toaster theme="dark" />
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md p-8 border border-border bg-[#0a0a0a]/80 backdrop-blur-xl z-10 shadow-[0_0_20px_rgba(0,240,255,0.1)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-20" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/5 flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            {isLoginView ? <Orbit className="w-8 h-8 text-primary animate-[spin_10s_linear_infinite]" /> : <BrainCircuit className="w-8 h-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-mono">AATMAN_OS</h1>
          <p className="text-[10px] text-primary/60 tracking-[0.3em] uppercase mt-2">v1.0.0 Experimental</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="System_ID" 
              className="bg-black text-primary border-primary/30 focus-visible:ring-primary h-12 focus-visible:border-primary placeholder:text-primary/30 font-mono tracking-widest text-xs uppercase"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="Neurolink_Passphrase" 
              className="bg-black text-primary border-primary/30 focus-visible:ring-primary h-12 focus-visible:border-primary placeholder:text-primary/30 font-mono tracking-widest text-xs uppercase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-md tracking-[0.2em] uppercase font-bold bg-primary text-black hover:bg-white transition-colors" disabled={isLoading}>
            {isLoading ? 'INITIALIZING...' : (isLoginView ? 'INIT_SEQUENCE' : 'ESTABLISH_LINK')}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button 
            type="button" 
            onClick={() => setIsLoginView(!isLoginView)} 
            className="text-primary/60 hover:text-primary transition-colors uppercase tracking-widest font-mono"
          >
            {isLoginView ? '> REQUEST_NEW_SYSTEM_ID' : '> RETURN_TO_AUTHORIZATION'}
          </button>
        </div>
      </Card>
    </div>
  );
}
