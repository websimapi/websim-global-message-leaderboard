const { useState, useEffect, useSyncExternalStore, useRef } = React;

const room = new WebsimSocket();
const COLLECTION_NAME = 'leaderboard_posts_v2';

// Sound effect for posting
const playPostSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
};

function App() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef(null);

  // Sync with Websim records
  const posts = useSyncExternalStore(
    room.collection(COLLECTION_NAME).subscribe,
    room.collection(COLLECTION_NAME).getList
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await room.collection(COLLECTION_NAME).create({
        content: inputValue.trim(),
      });
      setInputValue('');
      playPostSound();
    } catch (err) {
      console.error("Failed to post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden shadow-2xl bg-slate-950">
      {/* Header */}
      <header className="p-4 glass z-10 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          The Global Wall
        </h1>
        <p className="text-xs text-slate-400">Add your thought to the permanent record.</p>
      </header>

      {/* Posts List */}
      <main 
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        ref={scrollRef}
      >
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <div className="w-12 h-12 border-2 border-dashed border-slate-500 rounded-full mb-4"></div>
            <p>No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div 
              key={post.id} 
              className="glass p-3 rounded-xl flex items-start gap-3 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img 
                src={`https://images.websim.com/avatar/${post.username}`} 
                alt={post.username}
                className="w-10 h-10 rounded-full border border-white/10 shadow-lg"
                onerror="this.src='https://images.websim.com/avatar/default'"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-sm text-slate-200 truncate mr-2">
                    {post.username}
                  </span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 text-sm break-words leading-relaxed">
                  {post.content}
                </p>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 glass border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type something..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-100"
            maxLength={280}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputValue.trim()}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              isSubmitting || !inputValue.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-lg shadow-blue-900/20'
            }`}
          >
            {isSubmitting ? '...' : 'Post'}
          </button>
        </form>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);