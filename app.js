// --- Chess Coach UZ Engine & Storage --- //

const DB_KEY = 'chess_coach_uz_master_db';

const defaultDB = {
  users: [
    {
      id: 'super_1',
      username: 'bekzod_admin',
      password: 'superpassword123',
      name: 'Bekzod Javliev',
      role: 'superadmin',
      centerId: null,
      online: true,
      lastActive: new Date().toISOString()
    }
  ],
  centers: [
    {
      id: 'center_1',
      name: 'Markaziy Shaxmat Akademiyasi',
      directorId: 'super_1'
    }
  ],
  coaches: [],
  groups: [],
  students: [],
  payments: [],
  liveLessons: []
};

function getDB() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
    return defaultDB;
  }
  return JSON.parse(data);
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// --- React Asosiy Tizimi --- //
const { useState, useEffect, useRef } = React;

function App() {
  const [db, setDb] = useState(getDB());
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('chess_coach_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('all');

  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [authData, setAuthData] = useState({ username: '', password: '', name: '', role: 'coach', centerName: '' });
  const [authError, setAuthError] = useState('');

  // Yangi element qo'shish modallari
  const [modalType, setModalType] = useState(null); // 'center' | 'director' | 'group' | 'student' | 'transfer'
  const [modalData, setModalData] = useState({});

  // Jonli Dars Doskasi State'lari
  const [gameRoom, setGameRoom] = useState(null);
  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  const [turnControl, setTurnControl] = useState('both'); // coach | student | both
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const syncDB = (newDb) => {
    setDb(newDb);
    saveDB(newDb);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const user = db.users.find(u => u.username.toLowerCase() === authData.username.toLowerCase().trim() && u.password === authData.password);
    if (!user) {
      setAuthError("Username yoki parol noto'g'ri!");
      return;
    }
    user.online = true;
    user.lastActive = new Date().toISOString();
    syncDB({ ...db });
    setCurrentUser(user);
    localStorage.setItem('chess_coach_current_user', JSON.stringify(user));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    const cleanUser = authData.username.trim();

    // Validatsiyalar
    if (/\s/.test(cleanUser)) {
      setAuthError("Username'da bo'sh joy (space) bo'lishi mumkin emas!");
      return;
    }
    if (!/^[a-zA-Z0-9_]{6,}$/.test(cleanUser)) {
      setAuthError("Username kamida 6 belgidan iborat, faqat harf, son va pastki chiziqcha (_) bo'lishi kerak!");
      return;
    }
    if (authData.password.length < 6) {
      setAuthError("Parol kamida 6 belgidan iborat bo'lishi kerak!");
      return;
    }
    if (db.users.some(u => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      setAuthError("Ushbu username band! Boshqa nom tanlang.");
      return;
    }

    const newUserId = 'user_' + Date.now();
    let userCenterId = null;

    let updatedCenters = [...db.centers];
    if (authData.role === 'director') {
      userCenterId = 'center_' + Date.now();
      updatedCenters.push({
        id: userCenterId,
        name: authData.centerName || 'Yangi Akademiya',
        directorId: newUserId
      });
    }

    const newUser = {
      id: newUserId,
      username: cleanUser,
      password: authData.password,
      name: authData.name || cleanUser,
      role: authData.role,
      centerId: userCenterId,
      online: true,
      lastActive: new Date().toISOString()
    };

    const newDb = {
      ...db,
      users: [...db.users, newUser],
      centers: updatedCenters
    };

    syncDB(newDb);
    setCurrentUser(newUser);
    localStorage.setItem('chess_coach_current_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    if (currentUser) {
      const u = db.users.find(x => x.id === currentUser.id);
      if (u) u.online = false;
      syncDB({ ...db });
    }
    setCurrentUser(null);
    localStorage.removeItem('chess_coach_current_user');
  };

  // --- Filterlangan ma'lumotlar (Izolyatsiya qoidasi) --- //
  const isSuper = currentUser?.role === 'superadmin';
  const isDirector = currentUser?.role === 'director';
  
  const accessibleCenters = isSuper ? db.centers : db.centers.filter(c => c.directorId === currentUser?.id || c.id === currentUser?.centerId);
  const currentCenter = accessibleCenters[0] || null;

  const accessibleGroups = isSuper ? db.groups : db.groups.filter(g => isDirector ? g.centerId === currentCenter?.id : g.coachId === currentUser?.id);
  const accessibleStudents = isSuper ? db.students : db.students.filter(s => accessibleGroups.some(g => g.id === s.groupId));

  // --- Boshqaruv funksiyalari --- //
  const addGroup = (e) => {
    e.preventDefault();
    if (!modalData.name) return;
    const newGroup = {
      id: 'grp_' + Date.now(),
      name: modalData.name,
      days: modalData.days || 'Dush-Sesh-Chor',
      time: modalData.time || '14:00 - 16:00',
      coachId: modalData.coachId || currentUser.id,
      coachName: modalData.coachName || currentUser.name,
      centerId: currentCenter?.id || 'center_1',
      price: Number(modalData.price) || 300000
    };
    syncDB({ ...db, groups: [...db.groups, newGroup] });
    setModalType(null);
    setModalData({});
  };

  const deleteGroup = (groupId) => {
    if (!confirm("Guruhni butunlay o'chirmoqchimisiz?")) return;
    syncDB({
      ...db,
      groups: db.groups.filter(g => g.id !== groupId),
      students: db.students.filter(s => s.groupId !== groupId)
    });
  };

  const addStudent = (e) => {
    e.preventDefault();
    if (!modalData.name || !modalData.groupId) return;
    const newStudent = {
      id: 'std_' + Date.now(),
      name: modalData.name,
      phone: modalData.phone || '',
      groupId: modalData.groupId,
      joinedDate: new Date().toLocaleDateString(),
      paidCurrentMonth: false,
      debt: Number(modalData.debt) || 0,
      achievements: []
    };
    syncDB({ ...db, students: [...db.students, newStudent] });
    setModalType(null);
    setModalData({});
  };

  const togglePayment = (studentId) => {
    const updated = db.students.map(s => {
      if (s.id === studentId) {
        return { ...s, paidCurrentMonth: !s.paidCurrentMonth, debt: s.paidCurrentMonth ? 300000 : 0 };
      }
      return s;
    });
    syncDB({ ...db, students: updated });
  };

  // --- Shaxmat Taxtasi Harakat Logikasi --- //
  const handleSquareClick = (square) => {
    if (!selectedSquare) {
      setSelectedSquare(square);
    } else {
      // Soddalashtirilgan tosh surish mexanizmi
      setSelectedSquare(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl text-emerald-400">
              ♟
            </div>
            <h1 className="text-2xl font-black tracking-wide text-white">Chess Coach UZ</h1>
            <p className="text-xs text-slate-400 mt-1">Shaxmat Akademiyalari Boshqaruv Tizimi</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Kirish
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Ro'yxatdan o'tish
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Username</label>
                <input 
                  type="text"
                  placeholder="masalan: bekzod_coach"
                  value={authData.username}
                  onChange={e => setAuthData({...authData, username: e.target.value.replace(/\s+/g, '')})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Parol</label>
                <input 
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={authData.password}
                  onChange={e => setAuthData({...authData, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                Tizimga Kirish
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ism Familiya</label>
                <input 
                  type="text"
                  placeholder="Bekzod Javliev"
                  value={authData.name}
                  onChange={e => setAuthData({...authData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Username (Bosh joylarsiz)</label>
                <input 
                  type="text"
                  placeholder="bekzod_coach1"
                  value={authData.username}
                  onChange={e => setAuthData({...authData, username: e.target.value.replace(/\s+/g, '')})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Parol</label>
                <input 
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={authData.password}
                  onChange={e => setAuthData({...authData, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Rolingiz</label>
                <select 
                  value={authData.role}
                  onChange={e => setAuthData({...authData, role: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="coach">Murabbiy (Coach)</option>
                  <option value="director">O'quv Markazi Direktori</option>
                </select>
              </div>
              {authData.role === 'director' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Akademiya Nomi</label>
                  <input 
                    type="text"
                    placeholder="Masalan: Yuksalish Shaxmat Klubi"
                    value={authData.centerName}
                    onChange={e => setAuthData({...authData, centerName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              )}
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2">
                Ro'yxatdan O'tish
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Asosiy CRM Interfeysi --- //
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobil Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white text-lg">♟</div>
          <span className="font-extrabold text-lg text-white">Chess Coach UZ</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 bg-slate-800 rounded-lg text-slate-200">
          ☰
        </button>
      </div>

      {/* Chap Menyu (Sidebar) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="p-6 border-b border-slate-800 hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-500/30">♟</div>
            <div>
              <h2 className="font-black text-lg text-white leading-tight">Chess Coach UZ</h2>
              <p className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase">Boshqaruv Tizimi</p>
            </div>
          </div>

          {/* Menyu Bo'limlari */}
          <nav className="p-4 space-y-1.5">
            <button 
              onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <span>📊</span>
              <span>Boshqaruv Paneli</span>
            </button>

            {isSuper && (
              <button 
                onClick={() => { setActiveTab('super_admin'); setMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'super_admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-indigo-400 hover:bg-slate-800/60'}`}>
                <span>👑</span>
                <span>Super Admin Nazorati</span>
              </button>
            )}

            <button 
              onClick={() => { setActiveTab('groups'); setMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'groups' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <span>👥</span>
              <span>Guruhlar & Darslar</span>
            </button>

            <button 
              onClick={() => { setActiveTab('students'); setMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'students' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <span>🎓</span>
              <span>O'quvchilar Bazasi</span>
            </button>

            <button 
              onClick={() => { setActiveTab('finance'); setMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'finance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <span>💰</span>
              <span>Kassa & Qarzlar</span>
            </button>

            <button 
              onClick={() => { setActiveTab('live'); setMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'live' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <span>🔴</span>
              <span>Jonli Dars Taxtasi</span>
            </button>
          </nav>
        </div>

        {/* Profil bloki */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 m-3 rounded-2xl">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-xs rounded-xl transition-all">
            Chiqish
          </button>
        </div>
      </aside>

      {/* Asosiy Ish Maydoni */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        {/* SUPER ADMIN NAZORATI */}
        {activeTab === 'super_admin' && isSuper && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl">
              <div>
                <h2 className="text-2xl font-black text-white">Super Admin Monitoring Tizimi</h2>
                <p className="text-xs text-indigo-300 mt-1">Platformadagi barcha markazlar, direktorlar va real vaqtdagi foydalanuvchilar</p>
              </div>
              <button 
                onClick={() => { setModalType('director'); setModalData({}); }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30">
                + Yangi Direktor & Markaz Qo'shish
              </button>
            </div>

            {/* Real vaqt statlari */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase">Jonli Ishlatayotganlar</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                  <p className="text-3xl font-black text-white">{db.users.filter(u => u.online).length} kishi</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase">Jami Direktorlar & Markazlar</p>
                <p className="text-3xl font-black text-white mt-2">{db.centers.length} ta</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase">Jami O'quvchilar Tizimda</p>
                <p className="text-3xl font-black text-white mt-2">{db.students.length} ta</p>
              </div>
            </div>

            {/* Direktorlar va Parollari Jadvali */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Barcha Direktorlar va Akademiyalar Nazorati</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="pb-3">Akademiya</th>
                      <th className="pb-3">Direktor</th>
                      <th className="pb-3">Username</th>
                      <th className="pb-3">Parol (Admin uchun)</th>
                      <th className="pb-3">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {db.centers.map(center => {
                      const dir = db.users.find(u => u.id === center.directorId);
                      return (
                        <tr key={center.id} className="hover:bg-slate-800/40">
                          <td className="py-3 font-bold text-white">{center.name}</td>
                          <td className="py-3 text-slate-300">{dir?.name || 'Tayinlanmagan'}</td>
                          <td className="py-3 text-emerald-400 font-mono">@{dir?.username}</td>
                          <td className="py-3 text-rose-400 font-mono font-bold">{dir?.password}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dir?.online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              {dir?.online ? 'Online' : 'Offline'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
                  {currentCenter?.name || "Shaxsiy Kabinet"}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-2">Salom, {currentUser.name}!</h1>
                <p className="text-xs text-slate-400 mt-1">Guruhlar, to'lovlar va jonli shaxmat darslari nazorati</p>
              </div>
              <button 
                onClick={() => { setActiveTab('live'); }}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 font-bold rounded-2xl shadow-lg shadow-rose-500/30 flex items-center space-x-2">
                <span>🔴</span>
                <span>Jonli Darsga O'tish</span>
              </button>
            </div>

            {/* Asosiy ko'rsatkichlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={() => setActiveTab('groups')} className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl transition-all">
                <p className="text-xs font-bold text-slate-400 uppercase">Guruhlar</p>
                <p className="text-2xl md:text-3xl font-black text-white mt-1">{accessibleGroups.length}</p>
                <p className="text-[11px] text-emerald-400 mt-1">Boshqarish ➔</p>
              </div>
              <div onClick={() => setActiveTab('students')} className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl transition-all">
                <p className="text-xs font-bold text-slate-400 uppercase">O'quvchilar</p>
                <p className="text-2xl md:text-3xl font-black text-white mt-1">{accessibleStudents.length}</p>
                <p className="text-[11px] text-emerald-400 mt-1">Ro'yxat ➔</p>
              </div>
              <div onClick={() => { setActiveTab('finance'); setActiveSubTab('debt'); }} className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-rose-500/40 p-5 rounded-2xl transition-all">
                <p className="text-xs font-bold text-rose-400 uppercase">Qarzdorlar</p>
                <p className="text-2xl md:text-3xl font-black text-rose-400 mt-1">
                  {accessibleStudents.filter(s => !s.paidCurrentMonth).length}
                </p>
                <p className="text-[11px] text-rose-400 mt-1">Ro'yxatni ko'rish ➔</p>
              </div>
              <div onClick={() => setActiveTab('finance')} className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl transition-all">
                <p className="text-xs font-bold text-emerald-400 uppercase">Kassa Tushumi</p>
                <p className="text-2xl md:text-3xl font-black text-white mt-1">
                  {(accessibleStudents.filter(s => s.paidCurrentMonth).length * 300000).toLocaleString()} so'm
                </p>
                <p className="text-[11px] text-emerald-400 mt-1">Moliya ➔</p>
              </div>
            </div>
          </div>
        )}

        {/* GURUHLAR BO'LIMI */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Guruhlar Ro'yxati</h2>
                <p className="text-xs text-slate-400">Har bir guruh uchun mas'ul murabbiy va vaqtlar</p>
              </div>
              <button 
                onClick={() => { setModalType('group'); setModalData({}); }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20">
                + Yangi Guruh Ochish
              </button>
            </div>

            {accessibleGroups.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-slate-400 text-sm">Hozircha hech qanday guruh mavjud emas.</p>
                <button 
                  onClick={() => { setModalType('group'); setModalData({}); }}
                  className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl">
                  Birinchi guruhni yarating
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessibleGroups.map(grp => {
                  const grpStudents = db.students.filter(s => s.groupId === grp.id);
                  return (
                    <div key={grp.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-lg text-white">{grp.name}</h3>
                          <button 
                            onClick={() => deleteGroup(grp.id)} 
                            className="text-slate-500 hover:text-rose-400 text-sm p-1">
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium mt-1">Ustoz: {grp.coachName}</p>
                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                          <p>📅 Kunlar: <span className="text-slate-200">{grp.days}</span></p>
                          <p>⏰ Vaqt: <span className="text-slate-200">{grp.time}</span></p>
                          <p>👥 O'quvchilar: <span className="text-white font-bold">{grpStudents.length} ta</span></p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">{grp.price.toLocaleString()} so'm/oy</span>
                        <button 
                          onClick={() => { setModalType('student'); setModalData({ groupId: grp.id }); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-lg">
                          + O'quvchi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* O'QUVCHILAR BO'LIMI */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">O'quvchilar Bazasi</h2>
                <p className="text-xs text-slate-400">Shogirdlar davomati va yutuqlari</p>
              </div>
              <button 
                onClick={() => { setModalType('student'); setModalData({}); }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20">
                + O'quvchi Qo'shish
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase">
                  <tr>
                    <th className="pb-3">Ism Familiya</th>
                    <th className="pb-3">Guruh</th>
                    <th className="pb-3">Telefon</th>
                    <th className="pb-3">To'lov Holati</th>
                    <th className="pb-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accessibleStudents.map(std => {
                    const grp = db.groups.find(g => g.id === std.groupId);
                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40">
                        <td className="py-3 font-bold text-white">{std.name}</td>
                        <td className="py-3 text-slate-300">{grp?.name || 'Guruhsiz'}</td>
                        <td className="py-3 text-slate-400">{std.phone || '—'}</td>
                        <td className="py-3">
                          <button 
                            onClick={() => togglePayment(std.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${std.paidCurrentMonth ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                            {std.paidCurrentMonth ? "To'langan ✓" : "Qarzdor ✕"}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => {
                              const newName = prompt("Yangi ismni kiriting:", std.name);
                              if (newName) {
                                std.name = newName;
                                syncDB({...db});
                              }
                            }}
                            className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg hover:bg-slate-700">
                            Tahrirlash
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KASSA & MOLIYA */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Kassa va Moliya Hisoboti</h2>
              <p className="text-xs text-slate-400">Oylik tushumlar, qarzdorlar va murabbiylar ulushi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <h3 className="font-bold text-white mb-4">To'lov qilgan o'quvchilar</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accessibleStudents.filter(s => s.paidCurrentMonth).map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <span className="text-sm font-semibold text-white">{s.name}</span>
                      <span className="text-xs font-bold text-emerald-400">+300,000 so'm</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <h3 className="font-bold text-rose-400 mb-4">Qarzdorlar Ro'yxati</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accessibleStudents.filter(s => !s.paidCurrentMonth).map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <span className="text-sm font-semibold text-white">{s.name}</span>
                      <span className="text-xs font-bold text-rose-400">Qarz: 300,000 so'm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JONLI DARS TAHXTASI (LICHESS/CHESS.COM STANDARTI) */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <div>
                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-bold">
                  Jonli Dars Xonasi
                </span>
                <h2 className="text-2xl font-black text-white mt-2">Dars Kodingiz: <span className="text-emerald-400 font-mono">{currentUser.username}_1246</span></h2>
                <p className="text-xs text-slate-400 mt-1">Shogirdlaringiz shu kod orqali dars taxtasiga ulanishadi</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setTurnControl(turnControl === 'coach' ? 'both' : 'coach')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs border ${turnControl === 'both' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {turnControl === 'both' ? "Shogirdga Navbat Berilgan ✓" : "Navbat Faqat Ustozda ✕"}
                </button>
              </div>
            </div>

            {/* Taxta maydoni */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-3xl flex flex-col items-center">
                {/* 8x8 Shaxmat Taxtasi (Touch-action to'g'irlangan) */}
                <div 
                  className="w-full max-w-[420px] aspect-square grid grid-cols-8 grid-rows-8 border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl"
                  style={{ touchAction: 'none' }}>
                  {Array.from({ length: 64 }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const isDark = (row + col) % 2 === 1;
                    const squareName = `${String.fromCharCode(97 + col)}${8 - row}`;

                    return (
                      <div 
                        key={i}
                        onClick={() => handleSquareClick(squareName)}
                        className={`flex items-center justify-center font-bold text-lg select-none cursor-pointer relative ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}`}>
                        {/* Koordinatalar */}
                        {col === 0 && <span className={`absolute top-0.5 left-1 text-[9px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{8 - row}</span>}
                        {row === 7 && <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{String.fromCharCode(97 + col)}</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300">
                    Boshlang'ich Holat
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300">
                    Taxtani Aylantirish
                  </button>
                </div>
              </div>

              {/* Chat va Dars Qatnashchilari */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-[450px]">
                <div>
                  <h3 className="font-bold text-white text-sm mb-3">Dars Chati & Savollar</h3>
                  <div className="space-y-2 h-64 overflow-y-auto text-xs">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-bold text-emerald-400">Ustoz:</span> Dars boshlandi! Hamma e4 yurishini tahlil qilsin.
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input 
                    type="text"
                    placeholder="Xabar yozing..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button className="px-4 py-2 bg-emerald-500 font-bold text-xs rounded-xl">
                    Yuborish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALLAR */}
      {modalType === 'director' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Yangi Direktor va Akademiya Qo'shish</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input 
                type="text"
                placeholder="Direktor Ismi Familiyasi"
                value={authData.name}
                onChange={e => setAuthData({...authData, name: e.target.value, role: 'director'})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <input 
                type="text"
                placeholder="Akademiya Nomi (Masalan: Yuksalish)"
                value={authData.centerName}
                onChange={e => setAuthData({...authData, centerName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <input 
                type="text"
                placeholder="Username (bo'sh joysiz)"
                value={authData.username}
                onChange={e => setAuthData({...authData, username: e.target.value.replace(/\s+/g, '')})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <input 
                type="password"
                placeholder="Parol (kamida 6 ta belgi)"
                value={authData.password}
                onChange={e => setAuthData({...authData, password: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 bg-slate-800 font-bold text-xs rounded-xl">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 font-bold text-xs rounded-xl">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'group' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Yangi Guruh Ochish</h3>
            <form onSubmit={addGroup} className="space-y-3">
              <input 
                type="text"
                placeholder="Guruh Nomi (Masalan: Boshlang'ich A)"
                value={modalData.name || ''}
                onChange={e => setModalData({...modalData, name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <input 
                type="text"
                placeholder="Kunlar (Masalan: Dush-Chor-Juma)"
                value={modalData.days || ''}
                onChange={e => setModalData({...modalData, days: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
              />
              <input 
                type="text"
                placeholder="Vaqt (Masalan: 15:00 - 17:00)"
                value={modalData.time || ''}
                onChange={e => setModalData({...modalData, time: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
              />
              <input 
                type="number"
                placeholder="Oylik to'lov (Masalan: 300000)"
                value={modalData.price || ''}
                onChange={e => setModalData({...modalData, price: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
              />
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 bg-slate-800 font-bold text-xs rounded-xl">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 font-bold text-xs rounded-xl">Guruhni Ochish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'student' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">O'quvchi Qo'shish</h3>
            <form onSubmit={addStudent} className="space-y-3">
              <input 
                type="text"
                placeholder="O'quvchi Ism Familiyasi"
                value={modalData.name || ''}
                onChange={e => setModalData({...modalData, name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <input 
                type="text"
                placeholder="Telefon Raqami (+998...)"
                value={modalData.phone || ''}
                onChange={e => setModalData({...modalData, phone: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
              />
              <select 
                value={modalData.groupId || ''}
                onChange={e => setModalData({...modalData, groupId: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                required>
                <option value="">Guruhni tanlang</option>
                {accessibleGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 bg-slate-800 font-bold text-xs rounded-xl">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 font-bold text-xs rounded-xl">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
