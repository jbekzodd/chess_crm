const { useState, useEffect, useRef, useMemo } = React;

const STORAGE_KEY = 'chess_coach_uz_state_v1';

const initialDatabase = {
  users: [
    { id: 'u1', username: 'superadmin', password: '999', name: 'Bosh Administrator', role: 'superadmin', centerId: null },
    { id: 'u2', username: 'direktor1', password: '111', name: 'Temur Shodiyev', role: 'director', centerId: 'c1' },
    { id: 'u3', username: 'coach1', password: '222', name: 'Nodirbek Rustamov', role: 'coach', centerId: 'c1' },
    { id: 'u4', username: 'student1', password: '333', name: 'Ali Vohidov', role: 'student', centerId: 'c1', studentId: 's1' }
  ],
  centers: [
    { id: 'c1', name: 'Chess Coach UZ — Markaziy Filial', directorId: 'u2', address: 'Toshkent sh., Navoiy ko‘chasi 14' }
  ],
  groups: [
    { id: 'g1', name: 'Master Gr-1', coachName: 'Nodirbek Rustamov', days: 'Dush-Chor-Juma', time: '15:00 - 17:00', price: 400000, centerId: 'c1' },
    { id: 'g2', name: 'Junior Boshlang‘ich', coachName: 'Nodirbek Rustamov', days: 'Sesh-Pay-Shan', time: '10:00 - 12:00', price: 350000, centerId: 'c1' }
  ],
  students: [
    { id: 's1', name: 'Ali Vohidov', phone: '+998 93 111 22 33', groupId: 'g1', age: 12, rating: 1450, monthlyFee: 400000, centerId: 'c1', notes: 'Taktik salohiyati yuqori.' },
    { id: 's2', name: 'Jasur Umarov', phone: '+998 97 444 55 66', groupId: 'g1', age: 14, rating: 1620, monthlyFee: 400000, centerId: 'c1', notes: 'Debyutlar ustida ishlayapti.' },
    { id: 's3', name: 'Madina Karimova', phone: '+998 99 777 88 99', groupId: 'g2', age: 9, rating: 1100, monthlyFee: 350000, centerId: 'c1', notes: 'Boshlang‘ich guruhda.' }
  ],
  attendance: [
    { id: 'att_1', date: new Date().toISOString().split('T')[0], groupId: 'g1', records: { s1: 'Keldi', s2: 'Keldi' } }
  ],
  payments: [
    { id: 'p1', studentId: 's1', studentName: 'Ali Vohidov', amount: 400000, month: 'Avgust 2026', date: '2026-08-10', status: 'To‘langan' },
    { id: 'p2', studentId: 's3', studentName: 'Madina Karimova', amount: 350000, month: 'Avgust 2026', date: '2026-08-12', status: 'To‘langan' }
  ],
  gamesHistory: [
    { id: 'gm1', date: '2026-08-18', white: 'Ali Vohidov (1450)', black: 'Jasur Umarov (1620)', result: '1-0', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6' }
  ],
  exercises: [
    { id: 'ex1', title: '1 yurishda mot', fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', targetMove: 'Qxf7#', hint: 'Farzin bilan f7 katagiga zarba bering.', desc: 'Oqlarning navbati. 1 yurishda mot qiling.' },
    { id: 'ex2', title: 'Vilka (Fork) taktikasi', fen: 'r1bqk2r/pppp1ppp/2n5/4p3/4n3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1', targetMove: 'Nxe4', hint: 'Markazdagi himoyasiz toshni oling.', desc: 'Oqlarning navbati. Eng to‘g‘ri taktik yurishni toping.' }
  ]
};

function getStoredDB() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDatabase));
    return initialDatabase;
  }
  try { return JSON.parse(data); } catch { return initialDatabase; }
}

function saveStoredDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

const PIECE_SYMBOLS = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function App() {
  const [db, setDb] = useState(getStoredDB());
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('chess_coach_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const syncDB = (newDb) => {
    setDb(newDb);
    saveStoredDB(newDb);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('chess_coach_auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chess_coach_auth_user');
    setSelectedStudentId(null);
  };

  if (!currentUser) {
    return <LoginComponent users={db.users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setSelectedStudentId(null); }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          currentUser={currentUser}
          activeTab={activeTab}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-brand-dark">
          {activeTab === 'dashboard' && (
            <DashboardComponent 
              db={db} 
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsComponent 
              db={db} 
              syncDB={syncDB}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsComponent 
              db={db} 
              syncDB={syncDB}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceComponent 
              db={db} 
              syncDB={syncDB}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceComponent 
              db={db} 
              syncDB={syncDB}
            />
          )}

          {activeTab === 'lessons' && (
            <LessonsComponent 
              db={db}
              onStartLive={() => setActiveTab('live_chess')}
            />
          )}

          {activeTab === 'live_chess' && (
            <LiveChessComponent 
              currentUser={currentUser}
              onSaveGame={(gameData) => {
                const newGames = [gameData, ...db.gamesHistory];
                syncDB({ ...db, gamesHistory: newGames });
              }}
            />
          )}

          {activeTab === 'analysis' && (
            <ChessAnalysisComponent />
          )}

          {activeTab === 'exercises' && (
            <ExercisesComponent exercises={db.exercises} />
          )}

          {activeTab === 'games' && (
            <GamesHistoryComponent 
              games={db.gamesHistory} 
              onReview={(pgn) => setActiveTab('analysis')}
            />
          )}

          {activeTab === 'super_admin' && currentUser.role === 'superadmin' && (
            <SuperAdminComponent 
              db={db} 
              syncDB={syncDB}
            />
          )}

          {activeTab === 'manual' && currentUser.role === 'superadmin' && (
            <ManualComponent />
          )}
        </main>
      </div>
    </div>
  );
}

function LoginComponent({ users, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const u = users.find(x => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password);
    if (u) {
      onLogin(u);
    } else {
      setError("Username yoki parol noto'g'ri!");
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-sidebar border border-brand-border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-black font-black text-2xl">
            ♞
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">CHESS COACH UZ</h1>
            <p className="text-xs text-slate-400">Professional Boshqaruv Platformasi</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Username kiriting"
              className="w-full bg-[#0a0b0d] border border-brand-border focus:border-brand-gold text-white text-sm rounded-lg px-4 py-3 outline-none transition"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Parol</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              className="w-full bg-[#0a0b0d] border border-brand-border focus:border-brand-gold text-white text-sm rounded-lg px-4 py-3 outline-none transition"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-sm rounded-lg transition mt-2">
            Tizimga Kirish
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-brand-border/50 text-[11px] text-slate-500 space-y-1">
          <p><span className="text-slate-400 font-bold">Super Admin:</span> superadmin / 999</p>
          <p><span className="text-slate-400 font-bold">Direktor:</span> direktor1 / 111</p>
          <p><span className="text-slate-400 font-bold">Murabbiy:</span> coach1 / 222</p>
          <p><span className="text-slate-400 font-bold">O‘quvchi:</span> student1 / 333</p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentUser, activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onLogout }) {
  const isSuper = currentUser.role === 'superadmin';

  const NavItem = ({ id, label, icon }) => (
    <button
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
        activeTab === id 
          ? 'bg-brand-gold text-black font-bold shadow-md' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-brand-card'
      }`}>
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-brand-sidebar border-r border-brand-border flex flex-col justify-between transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center space-x-3 pb-6 border-b border-brand-border mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-gold flex items-center justify-center text-black font-black text-xl">
              ♞
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wider leading-none">CHESS COACH UZ</h2>
              <span className="text-[10px] text-brand-gold font-bold uppercase mt-1 inline-block">Akademiya Tizimi</span>
            </div>
          </div>

          <div className="mb-5">
            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Boshqaruv</p>
            <div className="space-y-0.5">
              <NavItem id="dashboard" label="Boshqaruv paneli" icon="📊" />
              {currentUser.role !== 'student' && <NavItem id="students" label="O‘quvchilar" icon="🎓" />}
              {currentUser.role !== 'student' && <NavItem id="groups" label="Guruhlar" icon="👥" />}
              {currentUser.role !== 'student' && <NavItem id="attendance" label="Davomat" icon="✓" />}
              {currentUser.role !== 'student' && <NavItem id="finance" label="To‘lovlar / Kassa" icon="💰" />}
            </div>
          </div>

          <div className="mb-5">
            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Darslar</p>
            <div className="space-y-0.5">
              <NavItem id="lessons" label="Bugungi darslar" icon="📅" />
              <NavItem id="live_chess" label="Jonli shaxmat" icon="🔴" />
            </div>
          </div>

          <div className="mb-5">
            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Shaxmat</p>
            <div className="space-y-0.5">
              <NavItem id="analysis" label="Tahlil doskasi" icon="♟" />
              <NavItem id="exercises" label="Mashqlar" icon="🎯" />
              <NavItem id="games" label="O‘yinlar tarixi" icon="📜" />
            </div>
          </div>

          {isSuper && (
            <div className="mb-4 pt-3 border-t border-brand-border">
              <p className="px-3 text-[10px] font-extrabold text-amber-500 uppercase tracking-wider mb-1.5">Tizim Administratori</p>
              <div className="space-y-0.5">
                <NavItem id="super_admin" label="👑 Super Admin" icon="⚙️" />
                <NavItem id="manual" label="Haqiqiy Qo‘llanma" icon="📖" />
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-brand-border bg-brand-dark/50">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <span className="text-[10px] text-brand-gold uppercase font-bold">{currentUser.role}</span>
            </div>
            <button 
              onClick={onLogout}
              title="Chiqish" 
              className="p-1.5 hover:bg-brand-card rounded-md text-slate-400 hover:text-red-400 transition text-sm">
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ currentUser, activeTab, onMenuToggle, onLogout }) {
  const titles = {
    dashboard: 'Boshqaruv Paneli',
    students: 'O‘quvchilar Bazasi',
    groups: 'Guruhlar & Dars Jadvallari',
    attendance: 'Dars Davomati',
    finance: 'Moliya & Kassa Nazorati',
    lessons: 'Bugungi Darslar',
    live_chess: 'Jonli Shaxmat Darsi',
    analysis: 'Shaxmat Tahlili',
    exercises: 'Shaxmat Taktikalari & Mashqlar',
    games: 'Partiyalar Arxivi',
    super_admin: 'Super Admin Boshqaruvi',
    manual: 'Tizimdan Foydalanish Qo‘llanmasi'
  };

  return (
    <header className="h-14 bg-brand-sidebar border-b border-brand-border px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-brand-card">
          ☰
        </button>
        <h2 className="text-sm font-bold text-white tracking-wide">{titles[activeTab] || 'Chess Coach UZ'}</h2>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-white">{currentUser.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border flex items-center justify-center text-xs font-bold text-brand-gold">
          {currentUser.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

function DashboardComponent({ db, currentUser, onNavigate }) {
  const totalStudents = db.students.length;
  const activeGroups = db.groups.length;
  
  const currentMonth = 'Avgust 2026';
  const paidStudentIds = new Set(db.payments.filter(p => p.month === currentMonth).map(p => p.studentId));
  const debtorsCount = db.students.filter(s => !paidStudentIds.has(s.id)).length;

  const totalIncome = db.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <button 
          onClick={() => onNavigate('students')}
          className="bg-brand-sidebar hover:bg-brand-card border border-brand-border p-4 rounded-xl text-left transition flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-slate-400 uppercase">1. O‘quvchilar</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-white">{totalStudents}</span>
            <span className="text-xs text-brand-gold font-bold">Ochish →</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('groups')}
          className="bg-brand-sidebar hover:bg-brand-card border border-brand-border p-4 rounded-xl text-left transition flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-slate-400 uppercase">2. Guruhlar</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-white">{activeGroups}</span>
            <span className="text-xs text-brand-gold font-bold">Ochish →</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('finance')}
          className="bg-brand-sidebar hover:bg-brand-card border border-brand-border p-4 rounded-xl text-left transition flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-slate-400 uppercase">3. Kassa / Qarzdorlar</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-red-400">{debtorsCount} qarz</span>
            <span className="text-xs text-brand-gold font-bold">Moliya →</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('live_chess')}
          className="bg-brand-sidebar hover:bg-brand-card border border-brand-gold/40 p-4 rounded-xl text-left transition flex flex-col justify-between h-24 shadow-lg shadow-brand-gold/5">
          <span className="text-xs font-bold text-brand-gold uppercase">4. Jonli Shaxmat</span>
          <div className="flex justify-between items-end">
            <span className="text-xl font-black text-white">Dars Taxtasi</span>
            <span className="text-xs text-brand-gold font-bold">Boshlash →</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Oylik Tushum (Jami)</p>
          <p className="text-2xl font-black text-white font-mono">{totalIncome.toLocaleString()} UZS</p>
          <p className="text-[11px] text-slate-500 mt-2">Tasdiqlangan to‘lovlar asosida</p>
        </div>

        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bugungi Darslar</p>
          <p className="text-2xl font-black text-white font-mono">{db.groups.length} ta guruh</p>
          <p className="text-[11px] text-slate-500 mt-2">Jadval bo‘yicha</p>
        </div>

        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Markaz Holati</p>
          <p className="text-2xl font-black text-emerald-400 font-mono">Faol</p>
          <p className="text-[11px] text-slate-500 mt-2">Chess Coach UZ Tizimi</p>
        </div>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Guruhlar Jadvali</h3>
        <div className="divide-y divide-brand-border">
          {db.groups.map(g => (
            <div key={g.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{g.name}</p>
                <p className="text-slate-400">{g.coachName} • {g.days}</p>
              </div>
              <span className="font-mono text-brand-gold font-bold">{g.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentsComponent({ db, syncDB, selectedStudentId, onSelectStudent }) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', groupId: '', age: '', rating: 1200, monthlyFee: 350000, notes: ''
  });

  const students = useMemo(() => {
    return db.students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
      const matchGroup = groupFilter === 'all' || s.groupId === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [db.students, search, groupFilter]);

  const openAdd = () => {
    setEditingStudent(null);
    setFormData({ name: '', phone: '', groupId: db.groups[0]?.id || '', age: '', rating: 1200, monthlyFee: 350000, notes: '' });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setFormData(s);
    setModalOpen(true);
  };

  const saveStudent = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingStudent) {
      const updated = db.students.map(s => s.id === editingStudent.id ? { ...formData, id: s.id } : s);
      syncDB({ ...db, students: updated });
    } else {
      const newStd = {
        ...formData,
        id: 's_' + Date.now(),
        centerId: 'c1'
      };
      syncDB({ ...db, students: [...db.students, newStd] });
    }
    setModalOpen(false);
  };

  const deleteStudent = (id) => {
    if (!confirm("O‘quvchini o‘chirishni xohlaysizmi?")) return;
    syncDB({
      ...db,
      students: db.students.filter(s => s.id !== id),
      payments: db.payments.filter(p => p.studentId !== id)
    });
    if (selectedStudentId === id) onSelectStudent(null);
  };

  if (selectedStudentId) {
    const student = db.students.find(s => s.id === selectedStudentId);
    if (student) {
      return (
        <StudentProfileComponent 
          student={student} 
          db={db} 
          onBack={() => onSelectStudent(null)}
          onEdit={() => openEdit(student)}
        />
      );
    }
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <input 
            type="text"
            placeholder="Ism yoki telefon orqali qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0c0d10] border border-brand-border text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-brand-gold"
          />
          <select 
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="bg-[#0c0d10] border border-brand-border text-white text-xs rounded-lg px-3 py-2.5 outline-none">
            <option value="all">Barcha guruhlar</option>
            {db.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button 
          onClick={openAdd}
          className="px-4 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-xs rounded-lg transition whitespace-nowrap">
          + Yangi O‘quvchi
        </button>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-card text-slate-400 uppercase font-bold border-b border-brand-border">
            <tr>
              <th className="py-3 px-4">O‘quvchi</th>
              <th className="py-3 px-4">Telefon</th>
              <th className="py-3 px-4">Guruh</th>
              <th className="py-3 px-4">Reyting</th>
              <th className="py-3 px-4">Oylik To‘lov</th>
              <th className="py-3 px-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">O‘quvchilar topilmadi.</td>
              </tr>
            ) : (
              students.map(s => {
                const group = db.groups.find(g => g.id === s.groupId);
                return (
                  <tr key={s.id} className="hover:bg-brand-card/40 transition">
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => onSelectStudent(s.id)}
                        className="font-bold text-white hover:text-brand-gold text-left">
                        {s.name}
                      </button>
                      <p className="text-[10px] text-slate-400">{s.age} yosh</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{s.phone}</td>
                    <td className="py-3 px-4 text-slate-300">{group?.name || 'Guruhsiz'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-gold">{s.rating}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{Number(s.monthlyFee).toLocaleString()} UZS</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button 
                        onClick={() => onSelectStudent(s.id)}
                        className="px-2.5 py-1 bg-brand-card hover:bg-brand-border text-slate-300 rounded font-medium">
                        Profil
                      </button>
                      <button 
                        onClick={() => openEdit(s)}
                        className="px-2.5 py-1 bg-brand-card hover:bg-brand-border text-slate-300 rounded font-medium">
                        Tahrirlash
                      </button>
                      <button 
                        onClick={() => deleteStudent(s.id)}
                        className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded font-medium">
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-sidebar border border-brand-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {editingStudent ? 'O‘quvchini Tahrirlash' : 'Yangi O‘quvchi Qo‘shish'}
            </h3>
            <form onSubmit={saveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Ism Familiya</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none focus:border-brand-gold"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                    placeholder="+998..." 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Yoshi</label>
                  <input 
                    type="number" 
                    value={formData.age} 
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Guruh</label>
                  <select 
                    value={formData.groupId} 
                    onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none">
                    <option value="">Guruhni tanlang</option>
                    {db.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Shaxmat Reytingi</label>
                  <input 
                    type="number" 
                    value={formData.rating} 
                    onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Oylik To‘lov Miqdori (UZS)</label>
                <input 
                  type="number" 
                  value={formData.monthlyFee} 
                  onChange={e => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Qo‘shimcha Izoh</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none h-16" 
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-brand-card hover:bg-brand-border text-white font-bold rounded-lg transition">
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold rounded-lg transition">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentProfileComponent({ student, db, onBack, onEdit }) {
  const group = db.groups.find(g => g.id === student.groupId);
  const studentPayments = db.payments.filter(p => p.studentId === student.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-3 py-1.5 bg-brand-sidebar hover:bg-brand-card border border-brand-border rounded-lg text-xs font-bold text-slate-300">
          ← Ro‘yxatga qaytish
        </button>
        <button 
          onClick={onEdit}
          className="px-4 py-1.5 bg-brand-gold hover:bg-brand-goldLight text-black rounded-lg text-xs font-extrabold">
          Profilni Tahrirlash
        </button>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center text-2xl font-black text-brand-gold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-black text-white">{student.name}</h2>
            <p className="text-xs text-slate-400">Guruh: <span className="text-white font-semibold">{group?.name || 'Biriktirilmagan'}</span></p>
            <p className="text-xs text-slate-400">Murabbiy: <span className="text-white font-semibold">{group?.coachName || 'Mavjud emas'}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-brand-border pt-4 md:pt-0 md:pl-6 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Reyting</p>
            <p className="text-lg font-black text-brand-gold font-mono">{student.rating}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Yoshi</p>
            <p className="text-lg font-black text-white font-mono">{student.age}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Oylik</p>
            <p className="text-xs font-bold text-slate-200 font-mono mt-1">{Number(student.monthlyFee).toLocaleString()} UZS</p>
          </div>
        </div>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">To‘lovlar Tarixi</h3>
        {studentPayments.length === 0 ? (
          <p className="text-xs text-slate-500">Ushbu o‘quvchida to‘lovlar mavjud emas.</p>
        ) : (
          <div className="divide-y divide-brand-border">
            {studentPayments.map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{p.month}</span>
                  <span className="text-slate-400 ml-2">({p.date})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-emerald-400 font-bold">+{Number(p.amount).toLocaleString()} UZS</span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[10px]">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupsComponent({ db, syncDB, currentUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', coachName: '', days: 'Dush-Chor-Juma', time: '15:00 - 17:00', price: 400000 });

  const openAdd = () => {
    setEditingGroup(null);
    setFormData({ name: '', coachName: currentUser.name, days: 'Dush-Chor-Juma', time: '15:00 - 17:00', price: 400000 });
    setModalOpen(true);
  };

  const openEdit = (g) => {
    setEditingGroup(g);
    setFormData(g);
    setModalOpen(true);
  };

  const saveGroup = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingGroup) {
      const updated = db.groups.map(g => g.id === editingGroup.id ? { ...formData, id: g.id } : g);
      syncDB({ ...db, groups: updated });
    } else {
      const newGrp = { ...formData, id: 'g_' + Date.now(), centerId: 'c1' };
      syncDB({ ...db, groups: [...db.groups, newGrp] });
    }
    setModalOpen(false);
  };

  const deleteGroup = (id) => {
    if (!confirm("Guruhni o‘chirsangiz, unga tegishli o‘quvchilar guruhsiz qoladi. Davom etasizmi?")) return;
    syncDB({
      ...db,
      groups: db.groups.filter(g => g.id !== id),
      students: db.students.map(s => s.groupId === id ? { ...s, groupId: '' } : s)
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-white">Shaxmat Guruhlari</h2>
          <p className="text-xs text-slate-400">Jadvallar va murabbiylar taqsimoti</p>
        </div>
        <button 
          onClick={openAdd}
          className="px-4 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-xs rounded-lg transition">
          + Yangi Guruh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.groups.map(g => {
          const groupStudents = db.students.filter(s => s.groupId === g.id);
          return (
            <div key={g.id} className="bg-brand-sidebar border border-brand-border rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-white text-base">{g.name}</h3>
                  <span className="px-2 py-0.5 bg-brand-card text-brand-gold rounded text-[11px] font-mono font-bold">
                    {groupStudents.length} ta o‘quvchi
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Murabbiy: <span className="text-slate-200 font-semibold">{g.coachName}</span></p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <p>📅 Kunlar: <span className="text-white font-medium">{g.days}</span></p>
                  <p>⏰ Vaqt: <span className="text-white font-mono font-medium">{g.time}</span></p>
                  <p>💰 Oylik: <span className="text-brand-gold font-mono font-bold">{Number(g.price).toLocaleString()} UZS</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button 
                  onClick={() => openEdit(g)}
                  className="px-3 py-1 bg-brand-card hover:bg-brand-border text-slate-300 text-xs rounded font-medium">
                  Tahrirlash
                </button>
                <button 
                  onClick={() => deleteGroup(g.id)}
                  className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs rounded font-medium">
                  O‘chirish
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-sidebar border border-brand-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {editingGroup ? 'Guruhni Tahrirlash' : 'Yangi Guruh Yaratish'}
            </h3>
            <form onSubmit={saveGroup} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Guruh Nomi</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none focus:border-brand-gold"
                  required 
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Murabbiy Ismi</label>
                <input 
                  type="text" 
                  value={formData.coachName} 
                  onChange={e => setFormData({ ...formData, coachName: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Dars Kunlari</label>
                  <input 
                    type="text" 
                    value={formData.days} 
                    onChange={e => setFormData({ ...formData, days: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Vaqti</label>
                  <input 
                    type="text" 
                    value={formData.time} 
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Oylik To‘lov (UZS)</label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-brand-card hover:bg-brand-border text-white font-bold rounded-lg transition">
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold rounded-lg transition">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceComponent({ db, syncDB }) {
  const [selectedGroup, setSelectedGroup] = useState(db.groups[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});

  const groupStudents = useMemo(() => {
    return db.students.filter(s => s.groupId === selectedGroup);
  }, [db.students, selectedGroup]);

  useEffect(() => {
    const existing = db.attendance.find(a => a.groupId === selectedGroup && a.date === selectedDate);
    if (existing) {
      setRecords(existing.records || {});
    } else {
      const initial = {};
      groupStudents.forEach(s => { initial[s.id] = 'Keldi'; });
      setRecords(initial);
    }
  }, [selectedGroup, selectedDate, groupStudents]);

  const setStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = () => {
    const filtered = db.attendance.filter(a => !(a.groupId === selectedGroup && a.date === selectedDate));
    const newEntry = {
      id: 'att_' + Date.now(),
      groupId: selectedGroup,
      date: selectedDate,
      records
    };
    syncDB({ ...db, attendance: [...filtered, newEntry] });
    alert("Davomat muvaffaqiyatli saqlandi!");
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <select 
            value={selectedGroup} 
            onChange={e => setSelectedGroup(e.target.value)}
            className="bg-[#0c0d10] border border-brand-border text-white text-xs rounded-lg px-3 py-2 outline-none">
            {db.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#0c0d10] border border-brand-border text-white text-xs rounded-lg px-3 py-2 outline-none" 
          />
        </div>
        <button 
          onClick={saveAttendance}
          className="px-5 py-2 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-xs rounded-lg transition">
          Davomatni Saqlash
        </button>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-card text-slate-400 uppercase font-bold border-b border-brand-border">
            <tr>
              <th className="py-3 px-4">O‘quvchi</th>
              <th className="py-3 px-4 text-right">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {groupStudents.length === 0 ? (
              <tr>
                <td colSpan="2" className="py-6 text-center text-slate-500">Ushbu guruhda o‘quvchilar yo‘q.</td>
              </tr>
            ) : (
              groupStudents.map(s => {
                const cur = records[s.id] || 'Keldi';
                return (
                  <tr key={s.id} className="hover:bg-brand-card/30">
                    <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex space-x-1">
                        {['Keldi', 'Kelmagan', 'Sababli', 'Kechikdi'].map(st => {
                          const active = cur === st;
                          let color = 'bg-brand-card text-slate-400';
                          if (active && st === 'Keldi') color = 'bg-emerald-600 text-white';
                          if (active && st === 'Kelmagan') color = 'bg-red-600 text-white';
                          if (active && st === 'Sababli') color = 'bg-amber-600 text-white';
                          if (active && st === 'Kechikdi') color = 'bg-blue-600 text-white';

                          return (
                            <button
                              key={st}
                              onClick={() => setStatus(s.id, st)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${color}`}>
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceComponent({ db, syncDB }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amount: 400000, month: 'Avgust 2026', date: new Date().toISOString().split('T')[0] });

  const currentMonth = 'Avgust 2026';
  const paidMap = new Map(db.payments.filter(p => p.month === currentMonth).map(p => [p.studentId, p]));

  const addPayment = (e) => {
    e.preventDefault();
    const student = db.students.find(s => s.id === formData.studentId);
    if (!student) return;

    const newPayment = {
      id: 'p_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      amount: Number(formData.amount),
      month: formData.month,
      date: formData.date,
      status: 'To‘langan'
    };

    syncDB({ ...db, payments: [newPayment, ...db.payments] });
    setModalOpen(false);
  };

  const removePayment = (id) => {
    if (!confirm("To‘lovni bekor qilmoqchimisiz?")) return;
    syncDB({ ...db, payments: db.payments.filter(p => p.id !== id) });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-white">Moliya & Kassa</h2>
          <p className="text-xs text-slate-400">Oylik tushumlar va qarzdorlar monitoringi</p>
        </div>
        <button 
          onClick={() => { setFormData({ studentId: db.students[0]?.id || '', amount: 400000, month: currentMonth, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }}
          className="px-4 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-xs rounded-lg transition">
          + To‘lov Qabul Qilish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Qarzdorlar ({currentMonth})</h3>
          <div className="divide-y divide-brand-border max-h-80 overflow-y-auto">
            {db.students.filter(s => !paidMap.has(s.id)).length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Barcha o‘quvchilar to‘lov qilgan.</p>
            ) : (
              db.students.filter(s => !paidMap.has(s.id)).map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.phone}</p>
                  </div>
                  <span className="font-mono text-red-400 font-bold">-{Number(s.monthlyFee).toLocaleString()} UZS</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-5">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">So‘nggi To‘lovlar</h3>
          <div className="divide-y divide-brand-border max-h-80 overflow-y-auto">
            {db.payments.map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{p.studentName}</p>
                  <p className="text-[10px] text-slate-400">{p.month} • {p.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-emerald-400 font-bold">+{Number(p.amount).toLocaleString()} UZS</span>
                  <button onClick={() => removePayment(p.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-sidebar border border-brand-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">To‘lov Qo‘shish</h3>
            <form onSubmit={addPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">O‘quvchi</label>
                <select 
                  value={formData.studentId} 
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none">
                  {db.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Summa (UZS)</label>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Qaysi Oy Uchun</label>
                  <input 
                    type="text" 
                    value={formData.month} 
                    onChange={e => setFormData({ ...formData, month: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Sana</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none" 
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 bg-brand-card text-white font-bold rounded-lg">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-gold text-black font-extrabold rounded-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonsComponent({ db, onStartLive }) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-white">Bugungi Darslar Jadvali</h2>
          <p className="text-xs text-slate-400">Rejalashtirilgan mashg‘ulotlar</p>
        </div>
      </div>

      <div className="space-y-3">
        {db.groups.map(g => (
          <div key={g.id} className="bg-brand-sidebar border border-brand-border p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className="font-extrabold text-white text-sm">{g.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Murabbiy: <span className="text-slate-200">{g.coachName}</span></p>
              <p className="text-xs text-brand-gold font-mono mt-0.5">⏰ {g.time} ({g.days})</p>
            </div>
            <button 
              onClick={onStartLive}
              className="px-5 py-2.5 bg-brand-gold hover:bg-brand-goldLight text-black font-extrabold text-xs rounded-lg transition whitespace-nowrap">
              🔴 Jonli Darsni Boshlash
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveChessComponent({ currentUser, onSaveGame }) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Tizim', text: 'Jonli shaxmat darsi boshlandi.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const board = game.board();

  const handleSquareClick = (square) => {
    if (selectedSquare) {
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });

      if (move) {
        setGame(new Chess(game.fen()));
        setHistory(game.history());
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const valid = game.moves({ square, verbose: true }).map(m => m.to);
      setPossibleMoves(valid);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const undoMove = () => {
    game.undo();
    setGame(new Chess(game.fen()));
    setHistory(game.history());
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const resetGame = () => {
    if (!confirm("O‘yinni qayta boshlaysizmi?")) return;
    const newG = new Chess();
    setGame(newG);
    setHistory([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: currentUser.name, text: chatInput }]);
    setChatInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto h-full">
      <div className="lg:col-span-8 flex flex-col items-center justify-center bg-brand-sidebar border border-brand-border p-4 md:p-6 rounded-2xl">
        <div className="w-full max-w-[480px] aspect-square chess-board-grid border-2 border-brand-border rounded-lg overflow-hidden shadow-2xl">
          {(isFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]).map(r => 
            (isFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]).map(c => {
              const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
              const piece = board[r][c];
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedSquare === squareName;
              const isTarget = possibleMoves.includes(squareName);

              return (
                <div
                  key={squareName}
                  onClick={() => handleSquareClick(squareName)}
                  className={`flex items-center justify-center relative cursor-pointer ${
                    isDark ? 'square-dark' : 'square-light'
                  } ${isSelected ? 'square-selected' : ''} ${isTarget ? 'square-valid-target' : ''}`}>
                  {c === (isFlipped ? 7 : 0) && (
                    <span className="absolute top-0.5 left-1 text-[8px] font-bold opacity-60 pointer-events-none">
                      {8 - r}
                    </span>
                  )}
                  {r === (isFlipped ? 0 : 7) && (
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-bold opacity-60 pointer-events-none">
                      {String.fromCharCode(97 + c)}
                    </span>
                  )}

                  {piece && (
                    <span className={`chess-piece ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}>
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <button onClick={undoMove} className="px-3 py-1.5 bg-brand-card hover:bg-brand-border text-slate-300 text-xs font-bold rounded-lg">
            ↩ Qaytarish
          </button>
          <button onClick={() => setIsFlipped(!isFlipped)} className="px-3 py-1.5 bg-brand-card hover:bg-brand-border text-slate-300 text-xs font-bold rounded-lg">
            🔄 Doskani Aylantirish
          </button>
          <button onClick={resetGame} className="px-3 py-1.5 bg-brand-card hover:bg-brand-border text-red-400 text-xs font-bold rounded-lg">
            Yangi O‘yin
          </button>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase">Yurishlar Notatsiyasi</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${game.turn() === 'w' ? 'bg-white text-black' : 'bg-black text-white border border-slate-700'}`}>
              Navbat: {game.turn() === 'w' ? 'Oqlar' : 'Qoralar'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-40 bg-[#0c0d10] p-3 rounded-lg border border-brand-border text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1">
            {history.map((m, i) => (
              <span key={i} className="text-slate-300">
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-4 h-64 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">Dars Chati</h3>
          <div className="flex-1 overflow-y-auto space-y-2 text-xs mb-3 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-[#0c0d10] p-2 rounded border border-brand-border">
                <span className="font-bold text-brand-gold">{msg.sender}:</span> <span className="text-slate-300">{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Savol yoki izoh yozing..."
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-[#0c0d10] border border-brand-border text-white text-xs rounded-lg px-3 py-2 outline-none" 
            />
            <button type="submit" className="px-4 py-2 bg-brand-gold text-black font-extrabold text-xs rounded-lg">
              Yuborish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChessAnalysisComponent() {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);

  const board = game.board();

  const handleSquareClick = (square) => {
    if (selectedSquare) {
      const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
        setHistory(game.history());
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
    }
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      setPossibleMoves(game.moves({ square, verbose: true }).map(m => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      <div className="lg:col-span-8 flex flex-col items-center bg-brand-sidebar border border-brand-border p-6 rounded-2xl">
        <div className="w-full max-w-[440px] aspect-square chess-board-grid border-2 border-brand-border rounded-lg overflow-hidden shadow-2xl">
          {[0,1,2,3,4,5,6,7].map(r => 
            [0,1,2,3,4,5,6,7].map(c => {
              const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
              const piece = board[r][c];
              const isDark = (r + c) % 2 === 1;
              return (
                <div
                  key={squareName}
                  onClick={() => handleSquareClick(squareName)}
                  className={`flex items-center justify-center relative cursor-pointer ${
                    isDark ? 'square-dark' : 'square-light'
                  } ${selectedSquare === squareName ? 'square-selected' : ''}`}>
                  {piece && (
                    <span className={`chess-piece ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}>
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="lg:col-span-4 bg-brand-sidebar border border-brand-border rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tahlil & FEN</h3>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">FEN Pozitsiya</label>
          <input 
            type="text" 
            readOnly 
            value={game.fen()} 
            className="w-full bg-[#0c0d10] border border-brand-border text-brand-gold text-[11px] font-mono p-2.5 rounded-lg select-all" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Yurishlar</label>
          <div className="h-48 bg-[#0c0d10] p-3 rounded-lg border border-brand-border text-xs font-mono overflow-y-auto">
            {history.map((m, i) => (
              <span key={i} className="text-slate-300 mr-2">
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExercisesComponent({ exercises }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const ex = exercises[activeIdx] || exercises[0];
  const [game, setGame] = useState(new Chess(ex.fen));
  const [status, setStatus] = useState('');
  const [selectedSquare, setSelectedSquare] = useState(null);

  useEffect(() => {
    setGame(new Chess(ex.fen));
    setStatus('');
    setSelectedSquare(null);
  }, [activeIdx, ex]);

  const board = game.board();

  const handleSquareClick = (square) => {
    if (selectedSquare) {
      const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
        if (move.san === ex.targetMove || game.in_checkmate()) {
          setStatus('correct');
        } else {
          setStatus('wrong');
        }
        setSelectedSquare(null);
        return;
      }
    }
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      <div className="lg:col-span-7 flex flex-col items-center bg-brand-sidebar border border-brand-border p-6 rounded-2xl">
        <div className="w-full max-w-[420px] aspect-square chess-board-grid border-2 border-brand-border rounded-lg overflow-hidden shadow-2xl">
          {[0,1,2,3,4,5,6,7].map(r => 
            [0,1,2,3,4,5,6,7].map(c => {
              const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
              const piece = board[r][c];
              const isDark = (r + c) % 2 === 1;
              return (
                <div
                  key={squareName}
                  onClick={() => handleSquareClick(squareName)}
                  className={`flex items-center justify-center relative cursor-pointer ${
                    isDark ? 'square-dark' : 'square-light'
                  } ${selectedSquare === squareName ? 'square-selected' : ''}`}>
                  {piece && (
                    <span className={`chess-piece ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}>
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="lg:col-span-5 bg-brand-sidebar border border-brand-border rounded-2xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">Mashq {activeIdx + 1} / {exercises.length}</span>
          <h2 className="text-lg font-black text-white mt-1">{ex.title}</h2>
          <p className="text-xs text-slate-300 mt-2">{ex.desc}</p>
          <p className="text-xs text-slate-500 mt-1">Maslahat: {ex.hint}</p>

          {status === 'correct' && (
            <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-lg">
              ✓ To‘g‘ri yurish! Barakalla.
            </div>
          )}
          {status === 'wrong' && (
            <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold rounded-lg">
              ✕ Noto‘g‘ri yurish. Qaytadan urinib ko‘ring.
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-4 border-t border-brand-border">
          <button 
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx(activeIdx - 1)}
            className="flex-1 py-2 bg-brand-card disabled:opacity-30 text-white text-xs font-bold rounded-lg">
            ← Oldingisi
          </button>
          <button 
            disabled={activeIdx === exercises.length - 1}
            onClick={() => setActiveIdx(activeIdx + 1)}
            className="flex-1 py-2 bg-brand-gold text-black disabled:opacity-30 text-xs font-extrabold rounded-lg">
            Keyingisi →
          </button>
        </div>
      </div>
    </div>
  );
}

function GamesHistoryComponent({ games, onReview }) {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-brand-sidebar border border-brand-border p-4 rounded-xl">
        <h2 className="text-sm font-bold text-white">Partiyalar Arxivi</h2>
        <p className="text-xs text-slate-400">O‘tkazilgan darslar va musobaqa o‘yinlari</p>
      </div>

      <div className="space-y-3">
        {games.map(g => (
          <div key={g.id} className="bg-brand-sidebar border border-brand-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">{g.white} VS {g.black}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sana: {g.date} • Natija: <span className="text-brand-gold font-bold">{g.result}</span></p>
              <p className="text-[11px] font-mono text-slate-500 mt-1 truncate max-w-md">{g.moves}</p>
            </div>
            <button 
              onClick={() => onReview(g.pgn)}
              className="px-4 py-2 bg-brand-card hover:bg-brand-border text-brand-gold text-xs font-bold rounded-lg transition whitespace-nowrap">
              Tahlil qilish →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuperAdminComponent({ db, syncDB }) {
  const [dirModal, setDirModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', centerName: '' });

  const addDirector = (e) => {
    e.preventDefault();
    const newUserId = 'u_' + Date.now();
    const newCenterId = 'c_' + Date.now();

    const newUser = {
      id: newUserId,
      username: formData.username.trim(),
      password: formData.password,
      name: formData.name,
      role: 'director',
      centerId: newCenterId
    };

    const newCenter = {
      id: newCenterId,
      name: formData.centerName,
      directorId: newUserId,
      address: 'Filial manzili'
    };

    syncDB({
      ...db,
      users: [...db.users, newUser],
      centers: [...db.centers, newCenter]
    });

    setDirModal(false);
    setFormData({ name: '', username: '', password: '', centerName: '' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-brand-sidebar border border-amber-500/30 p-5 rounded-2xl">
        <div>
          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold uppercase">Super Admin Nazorati</span>
          <h2 className="text-lg font-black text-white mt-1">Platforma Markazlari & Direktorlar</h2>
        </div>
        <button 
          onClick={() => setDirModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition">
          + Yangi Filial & Direktor Qo‘shish
        </button>
      </div>

      <div className="bg-brand-sidebar border border-brand-border rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-card text-slate-400 uppercase font-bold border-b border-brand-border">
            <tr>
              <th className="py-3 px-4">Markaz / Filial</th>
              <th className="py-3 px-4">Direktor</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Parol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {db.centers.map(c => {
              const dir = db.users.find(u => u.id === c.directorId);
              return (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-4 text-slate-300">{dir?.name || '—'}</td>
                  <td className="py-3 px-4 font-mono text-brand-gold">@{dir?.username}</td>
                  <td className="py-3 px-4 font-mono text-red-400 font-bold">{dir?.password}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dirModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-sidebar border border-brand-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Yangi Markaz & Direktor</h3>
            <form onSubmit={addDirector} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Markaz Nomi</label>
                <input 
                  type="text" 
                  value={formData.centerName} 
                  onChange={e => setFormData({ ...formData, centerName: e.target.value })}
                  placeholder="Masalan: Chilonzor Shaxmat Akademiyasi"
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                  required 
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Direktor Ismi</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Username</label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({ ...formData, username: e.target.value.replace(/\s+/g, '') })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Parol</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0c0d10] border border-brand-border text-white rounded-lg p-2.5 outline-none"
                    required 
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setDirModal(false)} className="flex-1 py-2.5 bg-brand-card text-white font-bold rounded-lg">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-black font-extrabold rounded-lg">Yaratish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualComponent() {
  return (
    <div className="max-w-4xl mx-auto bg-brand-sidebar border border-brand-border rounded-2xl p-6 space-y-6 text-xs text-slate-300">
      <div>
        <h2 className="text-base font-black text-white">Chess Coach UZ — Foydalanish Qo‘llanmasi</h2>
        <p className="text-slate-400 mt-1">Super Admin uchun tizim arxitekturasi va qo‘llanma</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-brand-card rounded-xl border border-brand-border">
          <h3 className="font-bold text-brand-gold text-sm mb-1">1. Filiallar va Direktorlarni boshqarish</h3>
          <p>Super Admin menyusidan yangi filial ochish va unga direktor biriktirish mumkin. Har bir direktor faqat o‘z filiali o‘quvchilarini ko‘radi.</p>
        </div>

        <div className="p-4 bg-brand-card rounded-xl border border-brand-border">
          <h3 className="font-bold text-brand-gold text-sm mb-1">2. Guruhlar va Dars jadvallari</h3>
          <p>Har bir guruhga mas'ul murabbiy biriktiriladi. O‘quvchilar qo‘shilganda tegishli guruh tanlanadi va dars kunlari avtomatik davomat sahifasiga uzatiladi.</p>
        </div>

        <div className="p-4 bg-brand-card rounded-xl border border-brand-border">
          <h3 className="font-bold text-brand-gold text-sm mb-1">3. Jonli Shaxmat Taxtasi</h3>
          <p>Taxta to‘liq xalqaro shaxmat qoidalari (chess.js) asosida ishlaydi. Noto‘g‘ri yurishlarga ruxsat berilmaydi va yurishlar algebraik notatsiyada yozib boriladi.</p>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
