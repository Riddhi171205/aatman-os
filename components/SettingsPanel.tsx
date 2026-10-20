import { Settings, Shield, Zap, Key } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPanel({ user }: { user: any }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative p-6">
        <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
            <div>
                <span className="text-[10px] font-bold text-primary/80 uppercase">SYSTEM_CONFIGURATION</span>
                <h1 className="text-xl font-bold tracking-tighter uppercase font-mono mt-1">Global Settings</h1>
            </div>
            <div className="text-[10px] space-x-4 uppercase font-bold tracking-widest text-primary/60">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Security level: MAXIMUM</span>
            </div>
        </header>

        <div className="max-w-2xl space-y-6">
          <Card className="border border-border bg-card/10 p-6 rounded-none">
            <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Key className="w-4 h-4"/> API Configurations</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-primary/60 uppercase tracking-widest">Ollama Endpoint</label>
                <Input defaultValue="http://localhost:11434" className="bg-black border-primary/30 text-primary font-mono text-xs rounded-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-primary/60 uppercase tracking-widest">Gemini API Key (Fallback)</label>
                <Input type="password" placeholder="************************" className="bg-black border-primary/30 text-primary font-mono text-xs rounded-none" />
              </div>
              <Button className="rounded-none bg-primary text-black hover:bg-primary/80 text-xs font-bold tracking-widest uppercase">Update Keys</Button>
            </div>
          </Card>

          <Card className="border border-border bg-card/10 p-6 rounded-none">
            <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Zap className="w-4 h-4"/> System Preferences</h3>
            <div className="space-y-4 text-sm text-primary/80 font-mono">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <span>Voice Synthesis Output</span>
                <span className="text-green-500 font-bold text-[10px] uppercase tracking-widest">ENABLED</span>
              </div>
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <span>Vector Memory Sync</span>
                <span className="text-green-500 font-bold text-[10px] uppercase tracking-widest">ENABLED</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span>Telemetry Broadcasts</span>
                <span className="text-primary/40 font-bold text-[10px] uppercase tracking-widest">DISABLED</span>
              </div>
            </div>
          </Card>
        </div>
    </div>
  );
}
