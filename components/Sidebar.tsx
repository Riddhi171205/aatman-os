import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Hexagon, MessageSquare, BrainCircuit, Activity, Settings, LogOut, PlusCircle } from 'lucide-react';

export default function Sidebar({ 
    user, 
    onLogout, 
    activeView, 
    setActiveView, 
    conversations, 
    currentConvoId, 
    setCurrentConvoId,
    onNewSession
}: any) {
  return (
    <aside className="w-64 border-r border-border flex flex-col p-5 bg-sidebar-background">
      {/* OS Branding */}
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-primary/60 mb-2">System_Aatman_Core</div>
        <h1 className="text-xl font-bold tracking-tighter uppercase font-mono">AATMAN OS v1.0</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-green-500/80">NEURAL_LINK_ESTABLISHED</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="space-y-2 mt-4">
        <Button 
          variant={activeView === 'chat' ? 'secondary' : 'ghost'} 
          className={`w-full justify-start h-10 tracking-widest text-xs uppercase px-3 border ${activeView === 'chat' ? 'border-primary/20 bg-primary/5 text-primary' : 'border-transparent text-primary/60 hover:text-primary hover:bg-primary/5'}`}
          onClick={() => setActiveView('chat')}
        >
          <span className={`w-1 h-6 mr-3 ${activeView === 'chat' ? 'bg-primary' : 'bg-primary/30'}`}></span>
          SYSTEM_INTERFACE
        </Button>
        <Button 
          variant={activeView === 'memory' ? 'secondary' : 'ghost'} 
          className={`w-full justify-start h-10 tracking-widest text-xs uppercase px-3 border ${activeView === 'memory' ? 'border-primary/20 bg-primary/5 text-primary' : 'border-transparent text-primary/60 hover:text-primary hover:bg-primary/5'}`}
          onClick={() => setActiveView('memory')}
        >
          <span className={`w-1 h-6 mr-3 ${activeView === 'memory' ? 'bg-primary' : 'bg-primary/30'}`}></span>
          MEMORY_CORE
        </Button>
        <Button 
          variant={activeView === 'agents' ? 'secondary' : 'ghost'} 
          className={`w-full justify-start h-10 tracking-widest text-xs uppercase px-3 border ${activeView === 'agents' ? 'border-primary/20 bg-primary/5 text-primary' : 'border-transparent text-primary/60 hover:text-primary hover:bg-primary/5'}`}
          onClick={() => setActiveView('agents')}
        >
          <span className={`w-1 h-6 mr-3 ${activeView === 'agents' ? 'bg-primary' : 'bg-primary/30'}`}></span>
          ORCHESTRATOR
        </Button>
        <Button 
          variant={activeView === 'settings' ? 'secondary' : 'ghost'} 
          className={`w-full justify-start h-10 tracking-widest text-xs uppercase px-3 border ${activeView === 'settings' ? 'border-primary/20 bg-primary/5 text-primary' : 'border-transparent text-primary/60 hover:text-primary hover:bg-primary/5'}`}
          onClick={() => setActiveView('settings')}
        >
          <span className={`w-1 h-6 mr-3 ${activeView === 'settings' ? 'bg-primary' : 'bg-primary/30'}`}></span>
          SYSTEM_SETTINGS
        </Button>
      </div>

      <div className="py-4 mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-primary/80 uppercase">Active_Sessions</span>
          <button onClick={onNewSession} className="text-[9px] px-1 border border-primary/30 hover:bg-primary hover:text-black transition-colors font-bold uppercase text-primary">
            + New
          </button>
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1">
                {conversations.map((convo: any) => (
                    <Button
                        key={convo.id}
                        variant={currentConvoId === convo.id && activeView === 'chat' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-8 text-[11px] font-mono truncate px-2 border border-transparent ${currentConvoId === convo.id && activeView === 'chat' ? 'border-primary/20 text-primary bg-primary/5' : 'text-muted-foreground opacity-60 hover:opacity-100'}`}
                        onClick={() => {
                            setCurrentConvoId(convo.id);
                            setActiveView('chat');
                        }}
                    >
                        <span className="w-1 h-4 bg-primary/40 mr-2 shrink-0"></span>
                        <span className="truncate">{convo.title}</span>
                    </Button>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* User Section */}
      <div className="mt-auto pt-4 border-t border-dashed border-border/50 space-y-2">
        <div className="flex items-center gap-3 p-2 border border-primary/20 bg-primary/5">
            <div className="w-8 h-8 bg-secondary flex items-center justify-center font-bold text-xs text-primary border border-primary/20">
                {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-[11px] truncate font-mono">{user.username}</p>
                <p className="text-[9px] text-primary/70 uppercase tracking-widest">STATUS: ONLINE</p>
            </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive h-9 text-[10px] uppercase tracking-widest" onClick={onLogout}>
          <LogOut className="w-4 h-4" /> TERMINATE_LINK
        </Button>
      </div>
    </aside>
  );
}
