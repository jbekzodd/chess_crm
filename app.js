const { useState, useEffect, useMemo } = React;
const STORAGE_KEY = 'chess_coach_uz_state_v1';

// Boshlang'ich bazani yuklash
const initialDatabase = {
  users: [{ id: 'u1', username: 'bekzod', password: '', name: 'Bekzod Admin', role: 'superadmin' }],
  groups: [],
  students: [],
  attendance: [],
  payments: [],
  gamesHistory: [],
  exercises: [
    { id: 'ex1', title: '1 yurishda mot', fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', targetMove: 'Qxf7#', hint: 'Farzin bilan f7 katagiga zarba bering.', desc: 'Oqlarning navbati. 1 yurishda mot qiling.' }
  ]
};

function getStoredDB() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialDatabase;
}

function App() {
  const [db, setDb] = useState(getStoredDB());
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login Logikasi (Bekzod uchun parolsiz kirish)
  const login = (username) => {
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
    } else {
      // Agar user bo'lmasa, avtomatik yaratish
      const newUser = { id: 'u_' + Date.now(), username, name: username, role: 'superadmin' };
      setDb(prev => ({ ...prev, users: [...prev.users, newUser] }));
      setCurrentUser(newUser);
    }
  };

  if (!currentUser) return <LoginComponent onLogin={login} />;

  return (
    <div className="flex h-screen bg-brand-dark">
      <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && <DashboardComponent db={db} onNavigate={setActiveTab} />}
        {activeTab === 'students' && <StudentsComponent db={db} setDb={setDb} />}
        {activeTab === 'groups' && <GroupsComponent db={db} setDb={setDb} />}
        {activeTab === 'live_chess' && <LiveChessComponent currentUser={currentUser} />}
        {/* Boshqa komponentlar ham shu tarzda ulanadi */}
      </main>
    </div>
  );
}

// LOGIN KOMPONENTI (Bekzod uchun soddalashtirilgan)
function LoginComponent({ onLogin }) {
  const [user, setUser] = useState('');
  return (
    <div className="flex items-center justify-center h-screen bg-brand-dark">
      <div className="bg-brand-sidebar p-8 rounded-xl border border-brand-border w-96">
        <h2 className="text-white text-xl font-bold mb-4">Kirish</h2>
        <input 
          className="w-full bg-brand-dark border border-brand-border p-3 rounded mb-4 text-white"
          placeholder="Username (Bekzod deb yozing)"
          onChange={(e) => setUser(e.target.value)}
        />
        <button 
          onClick={() => onLogin(user)}
          className="w-full bg-brand-gold py-3 rounded font-bold text-black">
          Kirish
        </button>
      </div>
    </div>
  );
}

// SIDEBAR (Barcha bo'limlar bilan)
function Sidebar({ currentUser, activeTab, setActiveTab, onLogout }) {
  const menu = [
    { id: 'dashboard', label: 'Boshqaruv', icon: '📊' },
    { id: 'students', label: 'O‘quvchilar', icon: '🎓' },
    { id: 'groups', label: 'Guruhlar', icon: '👥' },
    { id: 'live_chess', label: 'Jonli Shaxmat', icon: '🔴' }
  ];

  return (
    <aside className="w-64 bg-brand-sidebar p-4 border-r border-brand-border">
      <h1 className="text-brand-gold font-black mb-8 text-xl">CHESS COACH UZ</h1>
      {menu.map(item => (
        <button 
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center p-3 rounded mb-2 ${activeTab === item.id ? 'bg-brand-gold text-black' : 'text-slate-400'}`}>
          {item.icon} <span className="ml-3 font-bold">{item.label}</span>
        </button>
      ))}
      <button onClick={onLogout} className="mt-10 text-red-500 font-bold px-3">Chiqish</button>
    </aside>
  );
}

// DASHBOARD (Tezkor menyular)
function DashboardComponent({ db, onNavigate }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-brand-sidebar p-6 rounded-xl border border-brand-border">
        <h3 className="text-slate-400">O‘quvchilar</h3>
        <p className="text-3xl text-white font-bold">{db.students.length}</p>
      </div>
      <div className="bg-brand-sidebar p-6 rounded-xl border border-brand-border">
        <h3 className="text-slate-400">Guruhlar</h3>
        <p className="text-3xl text-white font-bold">{db.groups.length}</p>
      </div>
      <button onClick={() => onNavigate('live_chess')} className="bg-brand-gold p-6 rounded-xl text-black font-bold">
        Jonli Dars →
      </button>
    </div>
  );
}

function StudentsComponent({ db, setDb }) {
  // CRUD uchun kodlar (avvalgisidagi kabi)
  return <div className="text-white">O'quvchilar boshqaruvi</div>;
}

function GroupsComponent({ db, setDb }) {
  return <div className="text-white">Guruhlar boshqaruvi</div>;
}

function LiveChessComponent({ currentUser }) {
  const [game] = useState(new Chess());
  // Shaxmat taxtasi logikasi shu yerda bo'ladi
  return <div className="text-white">Jonli Shaxmat Darsi (Taxta)</div>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
