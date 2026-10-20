import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import MemoryVisualizer from './MemoryVisualizer';
import AgentActivity from './AgentActivity';
import SettingsPanel from './SettingsPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'memory' | 'agents' | 'settings'
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations(user.id);
      const convos = res.sessions || [];
      setConversations(convos);
      if (convos.length > 0 && !currentConvoId) {
        setCurrentConvoId(convos[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewSession = async () => {
    try {
      const res = await api.createConversation(user.id, 'New Session');
      const convo = res.session;
      setConversations([convo, ...conversations]);
      setCurrentConvoId(convo.id);
      setActiveView('chat');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        activeView={activeView} 
        setActiveView={setActiveView}
        conversations={conversations}
        currentConvoId={currentConvoId}
        setCurrentConvoId={setCurrentConvoId}
        onNewSession={handleNewSession}
      />
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none technical-grid" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,240,255,1)_0%,transparent_70%)]" />
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeView}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full h-full flex flex-col"
          >
              {activeView === 'chat' && <ChatPanel currentConvoId={currentConvoId} user={user} />}
              {activeView === 'memory' && <MemoryVisualizer userId={user.id} />}
              {activeView === 'agents' && <AgentActivity />}
              {activeView === 'settings' && <SettingsPanel user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
