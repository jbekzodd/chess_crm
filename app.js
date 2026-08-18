const { useState, useEffect, useRef } = React;

const PIECE_SYMBOLS = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

function App() {
  // 1. Foydalanuvchi va Kirish holatlari
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [coachNameInput, setCoachNameInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 2. Navigatsiya va Sidebar (3 ta chiziqcha ochib-yopilishi)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 3. Markazlar tizimi
  const [centers, setCenters] = useState(['Apex Chess Academy']);
  const [currentCenter, setCurrentCenter] = useState('Apex Chess Academy');
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [newCenterName, setNewCenterName] = useState('');

  // 4. Ma'lumotlar bazasi
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState(['Boshlangʻich - Toq kunlar', 'Havaskor - Juft kunlar', 'Individual']);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState('Boshlangʻich - Toq kunlar');
  const [selectedTopicNum, setSelectedTopicNum] = useState('');

  // 5. Modallar
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);

  // 6. Shaxmat doskasi
  const chessRef = useRef(new window.Chess());
  const [boardState, setBoardState] = useState(chessRef.current.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // 7. Jonli dars va Arxiv
  const [isRecording, setIsRecording] = useState(false);
  const [activeStudentControl, setActiveStudentControl] = useState(null);
  const [lessonNotes, setLessonNotes] = useState([]);

  // Anketalar
  const [studentForm, setStudentForm] = useState({
    name: '', age: '', phone: '', parentPhone: '',
    lichessUsername: '', initialRating: '',
    group: 'Boshlangʻich - Toq kunlar',
    initialDiagnosis: '', monthlyFee: '300000',
    isPaid: false
  });

  // Tizimni yuklash
  useEffect(() => {
    const savedSession = localStorage.getItem('apex_active_coach');
    if (savedSession) {
      const coach = JSON.parse(savedSession);
      setCurrentUser(coach);
      loadAcademyData(coach.username);
    }
  }, []);

  const loadAcademyData = (username) => {
    const savedCenters = localStorage.getItem(`apex_centers_${username}`);
    if (savedCenters) {
      const parsedCenters = JSON.parse(savedCenters);
      setCenters(parsedCenters);
      if (parsedCenters.length > 0) setCurrentCenter(parsedCenters[0]);
    }
    const savedSt = localStorage.getItem(`apex_students_${username}`);
    if (savedSt) setStudents(JSON.parse(savedSt));
    const savedGr = localStorage.getItem(`apex_groups_${username}`);
    if (savedGr) setGroups(JSON.parse(savedGr));
    const savedNotes = localStorage.getItem(`apex_notes_${username}`);
    if (savedNotes) setLessonNotes(JSON.parse(savedNotes));
  };

  const saveStudents = (newSt) => {
    setStudents(newSt);
    if (currentUser) localStorage.setItem(`apex_students_${currentUser.username}`, JSON.stringify(newSt));
  };

  const saveGroups = (newGr) => {
    setGroups(newGr);
    if (currentUser) localStorage.setItem(`apex_groups_${currentUser.username}`, JSON.stringify(newGr));
  };

  const saveCenters = (newCent) => {
    setCenters(newCent);
    if (currentUser) localStorage.setItem(`apex_centers_${currentUser.username}`, JSON.stringify(newCent));
  };

  // Kirish / Ro'yxatdan o'tish mantiqi
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');
    const coaches = JSON.parse(localStorage.getItem('apex_coaches') || '{}');

    if (usernameInput === 'bekzod' && passwordInput === 'jovliyev75828') {
      const adminUser = { username: 'bekzod', name: 'Bekzod (Super Admin)', role: 'admin' };
      localStorage.setItem('apex_active_coach', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      loadAcademyData('bekzod');
      return;
    }

    if (authMode === 'register') {
      if (coaches[usernameInput]) {
        setAuthError('Bu username band!');
        return;
      }
      const newCoach = { username: usernameInput, password: passwordInput, name: coachNameInput || usernameInput, role: 'coach' };
      coaches[usernameInput] = newCoach;
      localStorage.setItem('apex_coaches', JSON.stringify(coaches));
      localStorage.setItem('apex_active_coach', JSON.stringify(newCoach));
      setCurrentUser(newCoach);
      loadAcademyData(newCoach.username);
    } else {
      const coach = coaches[usernameInput];
      if (!coach || coach.password !== passwordInput) {
        setAuthError('Login yoki parol xato!');
        return;
      }
      localStorage.setItem('apex_active_coach', JSON.stringify(coach));
      setCurrentUser(coach);
      loadAcademyData(coach.username);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_active_coach');
    setCurrentUser(null);
  };

  // Markaz qo'shish
  const handleAddCenter = (e) => {
    e.preventDefault();
    if (!newCenterName.trim()) return;
    const updated = [...centers, newCenterName.trim()];
    saveCenters(updated);
    setCurrentCenter(newCenterName.trim());
    setNewCenterName('');
    setShowAddCenterModal(false);
  };

  // Shaxmat yurish mantiqi
  const handleSquareClick = (rowIndex, colIndex) => {
    const actualRow = isFlipped ? 7 - rowIndex : rowIndex;
    const actualCol = isFlipped ? 7 - colIndex : colIndex;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const square = files[actualCol] + (8 - actualRow);

    if (!selectedSquare) {
      const piece = chessRef.current.get(square);
      if (piece) setSelectedSquare(square);
    } else {
      const move = chessRef.current.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });

      if (move) {
        setBoardState([...chessRef.current.board()]);
        setSelectedSquare(null);
      } else {
        const piece = chessRef.current.get(square);
        if (piece) setSelectedSquare(square);
        else setSelectedSquare(null);
      }
    }
  };

  const resetBoard = () => {
    chessRef.current.reset();
    setBoardState([...chessRef.current.board()]);
    setSelectedSquare(null);
  };

  // O'quvchi qo'shish
  const handleAddStudent = (e) => {
    e.preventDefault();
    const newSt = {
      ...studentForm,
      id: Date.now().toString(),
      center: currentCenter,
      attendance: {}
    };
    const updated = [...students, newSt];
    saveStudents(updated);
    setShowAddStudentModal(false);
    setStudentForm({
      name: '', age: '', phone: '', parentPhone: '',
      lichessUsername: '', initialRating: '',
      group: groups[0] || 'Umumiy',
      initialDiagnosis: '', monthlyFee: '300000',
      isPaid: false
    });
  };

  // Guruh qo'shish
  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const updated = [...groups, newGroupName.trim()];
    saveGroups(updated);
    setNewGroupName('');
    setShowAddGroupModal(false);
  };

  // O'chirish
  const confirmDelete = () => {
    if (!deleteConfirmStudent) return;
    const updated = students.filter(s => s.id !== deleteConfirmStudent.id);
    saveStudents(updated);
    setDeleteConfirmStudent(null);
  };

  // To'lov
  const togglePayment = (studentId) => {
    const updated = students.map(s => {
      if (s.id === studentId) return { ...s, isPaid: !s.isPaid };
      return s;
    });
    saveStudents(updated);
  };

  // Davomat
  const toggleAttendance = (studentId, status) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          attendance: {
            ...s.attendance,
            [journalDate]: {
              status,
              topic: selectedTopicNum ? `${selectedTopicNum}-mavzu` : 'Mavzu kiritilmagan'
            }
          }
        };
      }
      return s;
    });
    saveStudents(updated);
  };

  const toggleRecordLesson = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      const newNote = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        movesCount: chessRef.current.history().length,
        coach: currentUser.name,
        center: currentCenter
      };
      const updatedNotes = [newNote, ...lessonNotes];
      setLessonNotes(updatedNotes);
      if (currentUser) {
        localStorage.setItem(`apex_notes_${currentUser.username}`, JSON.stringify(updatedNotes));
      }
      alert("Dars yakunlandi va tizim arxiviga saqlandi.");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-emerald-400">♟️ APEX CRM</h1>
            <p className="text-xs text-slate-400">Apex Chess Academy boshqaruv tizimi</p>
          </div>

          {authError && (
            <div className="bg-rose-500/20 border border-rose-500/50 p-2.5 rounded-xl text-xs text-rose-300 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {authMode === 'register' && (
              <input
                required
                type="text"
                placeholder="Ism Familiyangiz"
                value={coachNameInput}
                onChange={(e) => setCoachNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
              />
            )}
            <input
              required
              type="text"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
            />
            <input
              required
              type="password"
              placeholder="Parol"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-emerald-500/20"
            >
              {authMode === 'login' ? 'Tizimga kirish' : 'Roʻyxatdan oʻtish'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition"
            >
              {authMode === 'login' ? 'Yangi ustozmisiz? Roʻyxatdan oʻtish' : 'Akkaunt bormi? Tizimga kirish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const centerStudents = students.filter(s => !s.center || s.center === currentCenter);
  const totalIncome = centerStudents.filter(s => s.isPaid).reduce((acc, s) => acc + Number(s.monthlyFee || 0), 0);
  const totalDebtors = centerStudents.filter(s => !s.isPaid).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Ochilib-yopiluvchi Parda */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      {/* Chap Yon Menyu (Sidebar) */}
      <aside className={`fixed md:static top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-emerald-400 flex items-center gap-2">♟️ APEX CHESS</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentUser.name}</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1 text-lg">✕</button>
          </div>

          {/* O'quv Markazlari */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold">Oʻquv Markaz:</span>
              <button
                onClick={() => setShowAddCenterModal(true)}
                className="text-emerald-400 font-bold hover:underline"
              >
                + Yangi
              </button>
            </div>
            <select
              value={currentCenter}
              onChange={(e) => setCurrentCenter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              {centers.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Menyu Tugmalari */}
          <nav className="space-y-1 text-sm font-medium pt-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              📊 Boshqaruv Paneli
            </button>
            <button
              onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'students' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              👥 Oʻquvchilar ({centerStudents.length})
            </button>
            <button
              onClick={() => { setActiveTab('groups'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'groups' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              🎓 Guruhlar ({groups.length})
            </button>
            <button
              onClick={() => { setActiveTab('journal'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'journal' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              📅 Dars & Davomat
            </button>
            <button
              onClick={() => { setActiveTab('live'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'live' ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20' : 'text-emerald-400 hover:bg-slate-800'}`}
            >
              🔴 Jonli Dars Xonasi
            </button>
            <button
              onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${activeTab === 'finance' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              💰 Kassa & Moliya
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Chiqish
          </button>
        </div>
      </aside>

      {/* Asosiy Ishchi Oyna */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Yuqori Header va Gamburger (3 ta chiziqcha) */}
        <header className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 focus:outline-none flex flex-col gap-1 w-9 h-9 justify-center items-center"
            >
              <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
              <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
              <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
            </button>
            <div>
              <h1 className="font-bold text-emerald-400 text-sm">{currentCenter}</h1>
              <p className="text-[10px] text-slate-400">Ustoz: {currentUser.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCenterModal(true)}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition"
            >
              + Markaz
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 max-w-5xl w-full mx-auto pb-10">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Jami Oʻquvchilar</p>
                  <p className="text-2xl font-black text-white mt-1">{centerStudents.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Guruhlar</p>
                  <p className="text-2xl font-black text-sky-400 mt-1">{groups.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Oylik Tushum</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{totalIncome.toLocaleString()} soʻm</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Qarzdorlar</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">{totalDebtors} ta</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition"
                >
                  + Yangi Oʻquvchi Qoʻshish
                </button>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-200 transition"
                >
                  + Yangi Guruh Ochish
                </button>
              </div>
            </div>
          )}

          {/* O'QUVCHILAR */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-white">Oʻquvchilar ({currentCenter})</h2>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition"
                >
                  + Oʻquvchi
                </button>
              </div>

              <div className="grid gap-3">
                {centerStudents.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500">
                    Ushbu markazda hali oʻquvchilar yoʻq.
                  </div>
                ) : (
                  centerStudents.map(st => (
                    <div key={st.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">{st.name}</h3>
                          <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded-md">{st.group}</span>
                          {st.isPaid ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">Toʻlangan</span>
                          ) : (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md font-bold">Qarz</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">Tel: {st.phone || 'Yoʻq'} • Ota-onasi: {st.parentPhone || 'Kiritilmagan'}</p>
                        <p className="text-xs text-slate-300">
                          <strong className="text-emerald-400">Boshlangʻich Lichess:</strong> {st.initialRating || '0'} | <strong className="text-slate-400">Tashxis:</strong> {st.initialDiagnosis || 'Kiritilmagan'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {st.lichessUsername && (
                          <a
                            href={`https://lichess.org/@/${st.lichessUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-emerald-400 font-medium"
                          >
                            Lichess ↗
                          </a>
                        )}
                        <button
                          onClick={() => togglePayment(st.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${st.isPaid ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white'}`}
                        >
                          {st.isPaid ? 'Qarz qilish' : 'Toʻlov qabul qilish'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmStudent(st)}
                          className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                        >
                          Oʻchirish
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* GURUHLAR */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-white">Akademiya Guruhlari</h2>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition"
                >
                  + Yangi Guruh
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((grp, idx) => {
                  const count = centerStudents.filter(s => s.group === grp).length;
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white text-base">{grp}</h3>
                        <span className="text-xs bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg font-semibold">{count} ta oʻquvchi</span>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        {centerStudents.filter(s => s.group === grp).map(s => (
                          <div key={s.id} className="flex justify-between border-b border-slate-800/50 py-1">
                            <span>{s.name}</span>
                            <span className="text-slate-500">{s.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* JURNAL & DAVOMAT */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Dars Sanasi</label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Guruhni Tanlang</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    {groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Oʻtilgan Mavzu №</label>
                  <input
                    type="text"
                    placeholder="Masalan: 5"
                    value={selectedTopicNum}
                    onChange={(e) => setSelectedTopicNum(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {centerStudents.filter(s => s.group === selectedGroup).map(st => {
                  const dayStatus = st.attendance?.[journalDate]?.status;
                  return (
                    <div key={st.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-white">{st.name}</p>
                        <p className="text-xs text-slate-400">{st.attendance?.[journalDate]?.topic || 'Mavzu kiritilmagan'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAttendance(st.id, 'present')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${dayStatus === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                          ✓ Keldi
                        </button>
                        <button
                          onClick={() => toggleAttendance(st.id, 'absent')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${dayStatus === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                          ✕ Kelmadi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* JONLI DARS XONASI */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h2 className="font-bold text-white text-base">🔴 Jonli Dars Xonasi</h2>
                  <p className="text-xs text-slate-400">Interaktiv doska va dars tarixi</p>
                </div>
                <button
                  onClick={toggleRecordLesson}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition flex items-center gap-2 ${isRecording ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  <span className={`w-2.5 h-2.5 bg-white rounded-full ${isRecording ? 'animate-ping' : ''}`}></span>
                  {isRecording ? '⏹️ Darsni Tugatish' : '🔴 Darsni Boshlash'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                  <div className="w-full max-w-[360px] sm:max-w-[420px] bg-amber-900/40 p-2 rounded-2xl border-4 border-slate-800 shadow-2xl">
                    <div className="flex flex-wrap border-2 border-slate-700 rounded-lg overflow-hidden">
                      {(isFlipped ? [...boardState].reverse() : boardState).map((row, rIdx) => 
                        (isFlipped ? [...row].reverse() : row).map((square, cIdx) => {
                          const isDark = (rIdx + cIdx) % 2 === 1;
                          const pieceChar = square ? (square.color === 'w' ? square.type.toUpperCase() : square.type) : null;
                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              onClick={() => handleSquareClick(rIdx, cIdx)}
                              className={`chess-square transition ${isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'} ${square && square.color === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-slate-950'}`}
                            >
                              {pieceChar ? PIECE_SYMBOLS[pieceChar] : ''}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={resetBoard}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition"
                    >
                      Boshlangʻich holat
                    </button>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition"
                    >
                      Doskani aylantirish ({isFlipped ? 'Oqlar' : 'Qoralar'})
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-emerald-400">🎮 Shogirdga Navbat Berish</h3>
                  <p className="text-[11px] text-slate-400">Qaysi oʻquvchi doskada yursin?</p>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {centerStudents.map(st => (
                      <div key={st.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-white">{st.name}</span>
                        <button
                          onClick={() => setActiveStudentControl(st.name)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${activeStudentControl === st.name ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {activeStudentControl === st.name ? 'Yurmoqda' : 'Ruxsat berish'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">📁 Darslar Tarixi (Arxiv)</h4>
                    {lessonNotes.length === 0 ? (
                      <p className="text-[11px] text-slate-500">Hozircha arxivlangan darslar yoʻq.</p>
                    ) : (
                      lessonNotes.map(n => (
                        <div key={n.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1 mb-1">
                          <p className="text-slate-300 font-semibold">{n.date}</p>
                          <p className="text-slate-400">Ustoz: {n.coach} • {n.movesCount} ta yurish</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KASSA & MOLIYA */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">💰 Moliya & Toʻlovlar ({currentCenter})</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Jami tushgan mablagʻ</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{totalIncome.toLocaleString()} soʻm</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400">Qarzdorlar soni</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">{totalDebtors} ta oʻquvchi</p>
                </div>
              </div>

              <div className="space-y-2">
                {centerStudents.map(st => (
                  <div key={st.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-white">{st.name}</p>
                      <p className="text-xs text-slate-400">Oylik toʻlov: {Number(st.monthlyFee).toLocaleString()} soʻm</p>
                    </div>
                    <button
                      onClick={() => togglePayment(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${st.isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
                    >
                      {st.isPaid ? '✓ Toʻlangan' : '✕ Toʻlanmagan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALLAR */}
      {showAddCenterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-sm space-y-4">
            <h3 className="text-base font-bold text-white">Yangi Oʻquv Markazi Qoʻshish</h3>
            <form onSubmit={handleAddCenter} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Markaz nomi (Masalan: Apex Samarqand)"
                value={newCenterName}
                onChange={(e) => setNewCenterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCenterModal(false)}
                  className="flex-1 bg-slate-800 py-2 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Markazni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Yangi Oʻquvchi ({currentCenter})</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input
                required
                type="text"
                placeholder="F.I.O"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Yoshi"
                  value={studentForm.age}
                  onChange={(e) => setStudentForm({ ...studentForm, age: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
                <select
                  value={studentForm.group}
                  onChange={(e) => setStudentForm({ ...studentForm, group: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  {groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Telefon raqami"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Ota-onasining tel raqami"
                  value={studentForm.parentPhone}
                  onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Lichess username"
                  value={studentForm.lichessUsername}
                  onChange={(e) => setStudentForm({ ...studentForm, lichessUsername: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Boshlangʻich reyting"
                  value={studentForm.initialRating}
                  onChange={(e) => setStudentForm({ ...studentForm, initialRating: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>
              <textarea
                placeholder="Diagnostika / Boshlangʻich holat (debyut, zaifliklar)"
                value={studentForm.initialDiagnosis}
                onChange={(e) => setStudentForm({ ...studentForm, initialDiagnosis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                rows="2"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 bg-slate-800 py-2.5 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-sm space-y-4">
            <h3 className="text-base font-bold text-white">Yangi Guruh Qoʻshish</h3>
            <form onSubmit={handleAddGroup} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Guruh nomi"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="flex-1 bg-slate-800 py-2 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Qoʻshish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-xs space-y-4 text-center">
            <h3 className="font-bold text-white text-base">Oʻquvchini oʻchirish</h3>
            <p className="text-xs text-slate-400">
              <strong className="text-white">{deleteConfirmStudent.name}</strong> bazadan oʻchirilsinmi?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 bg-slate-800 py-2 rounded-xl text-xs font-semibold text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 py-2 rounded-xl text-xs font-bold text-white"
              >
                Ha, oʻchirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
