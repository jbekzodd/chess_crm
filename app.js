const { useState, useEffect } = React;

function App() {
  const [db, setDb] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Menyu tablari
  const [activeTab, setActiveTab] = useState('schedule');
  const [currentCenter, setCurrentCenter] = useState(null);
  const [selectedDayType, setSelectedDayType] = useState('juft');
  const [selectedDay, setSelectedDay] = useState('Seshanba');

  // Modallar
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassInput, setDeletePassInput] = useState('');

  // Formalar
  const [centerForm, setCenterForm] = useState({ name: '', ownerName: '', phone: '', password: '' });
  const [studentForm, setStudentForm] = useState({
    name: '', age: '', phone: '', room: '1-xona', time: '14:00',
    days: 'juft', lichess: '', chesscom: '', diagnosis: '', goal: '',
    book: 'Step 2 Thinking', completedTopics: 0
  });

  // Bazani yuklash va sessiyani tiklash
  useEffect(() => {
    const saved = localStorage.getItem('apex_chess_db');
    let initialData;
    if (saved) {
      initialData = JSON.parse(saved);
    } else {
      initialData = {
        admin: { username: 'bekzod', password: 'jovliyev75828' },
        centers: [
          {
            id: 'apex_1',
            name: 'Apex Chess Academy',
            ownerName: 'Bekzod Jovliyev',
            phone: '+998 90 123 45 67',
            rooms: ['1-xona', '2-xona', '3-xona'],
            coaches: [{ id: 'c1', name: 'Rustam Murabbiy', username: 'rustam', password: '123' }],
            students: [
              {
                id: 's1',
                name: 'Ali Vohidov',
                age: '11',
                phone: '+998 90 111 22 33',
                room: '1-xona',
                time: '14:00',
                days: 'juft',
                lichess: 'MagnusCarlsen',
                chesscom: '',
                diagnosis: 'Italiya debyuti, taktikasi yaxshi',
                goal: 'Step 2 tugatish, 1400 Lichess',
                book: 'Step 2 Thinking',
                completedTopics: 7,
                attendance: {}
              }
            ],
            archive: []
          }
        ]
      };
      localStorage.setItem('apex_chess_db', JSON.stringify(initialData));
    }
    setDb(initialData);
    setCurrentCenter(initialData.centers[0]);

    // Saqlangan sessiyani tekshirish
    const savedSession = localStorage.getItem('apex_active_user');
    if (savedSession) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
      if (user.centerId) {
        const found = initialData.centers.find(c => c.id === user.centerId);
        if (found) setCurrentCenter(found);
      }
    }
  }, []);

  const saveState = (newDb) => {
    setDb(newDb);
    localStorage.setItem('apex_chess_db', JSON.stringify(newDb));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Super Admin
    if (loginInput === db.admin.username && passwordInput === db.admin.password) {
      const adminUser = { role: 'admin', name: 'Super Admin (Bekzod)' };
      setCurrentUser(adminUser);
      localStorage.setItem('apex_active_user', JSON.stringify(adminUser));
      return;
    }

    // 2. Markaz egasi yoki murabbiylar
    for (let c of db.centers) {
      if (c.ownerName.toLowerCase() === loginInput.toLowerCase() && passwordInput === '1234') {
        const ownerUser = { role: 'owner', name: c.ownerName, centerId: c.id };
        setCurrentUser(ownerUser);
        setCurrentCenter(c);
        localStorage.setItem('apex_active_user', JSON.stringify(ownerUser));
        return;
      }
      const coach = c.coaches.find(co => co.username === loginInput && co.password === passwordInput);
      if (coach) {
        const coachUser = { role: 'coach', name: coach.name, centerId: c.id };
        setCurrentUser(coachUser);
        setCurrentCenter(c);
        localStorage.setItem('apex_active_user', JSON.stringify(coachUser));
        return;
      }
    }

    setErrorMsg('Login yoki parol noto‘g‘ri!');
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_active_user');
    setCurrentUser(null);
    setLoginInput('');
    setPasswordInput('');
  };

  const handleAddCenter = (e) => {
    e.preventDefault();
    const newCenter = {
      id: 'center_' + Date.now(),
      name: centerForm.name,
      ownerName: centerForm.ownerName,
      phone: centerForm.phone,
      rooms: ['1-xona', '2-xona'],
      coaches: [],
      students: [],
      archive: []
    };
    const updated = { ...db, centers: [...db.centers, newCenter] };
    saveState(updated);
    setShowCenterModal(false);
    setCenterForm({ name: '', ownerName: '', phone: '', password: '' });
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const newStudent = {
      ...studentForm,
      id: 'st_' + Date.now(),
      completedTopics: Number(studentForm.completedTopics) || 0,
      attendance: {}
    };

    const updatedCenters = db.centers.map(c => {
      if (c.id === currentCenter.id) {
        return { ...c, students: [...c.students, newStudent] };
      }
      return c;
    });

    const updated = { ...db, centers: updatedCenters };
    saveState(updated);
    setCurrentCenter(updatedCenters.find(c => c.id === currentCenter.id));
    setShowStudentModal(false);
    setStudentForm({
      name: '', age: '', phone: '', room: '1-xona', time: '14:00',
      days: 'juft', lichess: '', chesscom: '', diagnosis: '', goal: '',
      book: 'Step 2 Thinking', completedTopics: 0
    });
  };

  const confirmDelete = () => {
    if (deletePassInput !== 'bekzod') {
      alert('Xavfsizlik paroli noto‘g‘ri!');
      return;
    }

    if (deleteTarget.type === 'student') {
      const updatedCenters = db.centers.map(c => {
        if (c.id === currentCenter.id) {
          const st = c.students.find(s => s.id === deleteTarget.id);
          return {
            ...c,
            students: c.students.filter(s => s.id !== deleteTarget.id),
            archive: [...c.archive, { ...st, archivedAt: new Date().toLocaleDateString() }]
          };
        }
        return c;
      });
      const updated = { ...db, centers: updatedCenters };
      saveState(updated);
      setCurrentCenter(updatedCenters.find(c => c.id === currentCenter.id));
    }

    setShowDeleteModal(false);
    setDeletePassInput('');
    setDeleteTarget(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm space-y-5 shadow-2xl">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-emerald-400">♟️ APEX CRM</h1>
            <p className="text-xs text-slate-400">Shaxmat akademiyasi tizimi</p>
          </div>

          {errorMsg && <div className="bg-rose-500/20 text-rose-300 text-xs p-3 rounded-xl text-center border border-rose-500/30">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase">Login</label>
              <input
                required
                type="text"
                placeholder="bekzod"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase">Parol</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 text-white mt-2">
              Tizimga kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 flex flex-col pb-28 border-x border-slate-900 sm:max-w-xl">
      <header className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-emerald-400 text-base">{currentCenter ? currentCenter.name : 'Apex System'}</h1>
          <p className="text-[10px] text-slate-400">👤 {currentUser.name} ({currentUser.role.toUpperCase()})</p>
        </div>
        <button onClick={handleLogout} className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-700">
          Chiqish
        </button>
      </header>

      {currentUser.role === 'admin' && (
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex gap-2 overflow-x-auto">
          {db.centers.map(c => (
            <button
              key={c.id}
              onClick={() => setCurrentCenter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentCenter?.id === c.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              🏢 {c.name}
            </button>
          ))}
          <button onClick={() => setShowCenterModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 border border-emerald-500/50 text-emerald-400 whitespace-nowrap">
            + Yangi Markaz
          </button>
        </div>
      )}

      <main className="p-4 flex-1 space-y-4">
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setSelectedDayType('juft')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${selectedDayType === 'juft' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                Juft kunlar
              </button>
              <button onClick={() => setSelectedDayType('toq')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${selectedDayType === 'toq' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                Toq kunlar
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
              {(selectedDayType === 'juft' ? ['Seshanba', 'Payshanba', 'Shanba'] : ['Dushanba', 'Chorshanba', 'Juma']).map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={`px-3 py-1 rounded-lg font-medium ${selectedDay === d ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40' : 'text-slate-500'}`}>
                  {d}
                </button>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-3">
              {currentCenter?.rooms.map(room => (
                <div key={room} className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{room}</span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['14:00', '16:00', '18:00'].map(t => {
                      const stInSlot = currentCenter.students.filter(s => s.room === room && s.time === t && s.days === selectedDayType);
                      return (
                        <div key={t} className="bg-slate-950 border border-slate-800/80 p-2 rounded-xl text-center min-h-[60px] flex flex-col justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold">{t}</span>
                          <span className="text-xs font-bold text-slate-200">{stInSlot.length} ta o‘quvchi</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase">O‘quvchilar ({currentCenter?.students.length})</h2>
            {currentCenter?.students.map(st => (
              <div key={st.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{st.name}</h3>
                    <p className="text-[11px] text-slate-400">{st.room} • {st.time} ({st.days} kunlar)</p>
                  </div>
                  <div className="flex gap-1.5">
                    {st.lichess && (
                      <a href={`https://lichess.org/@/${st.lichess}`} target="_blank" rel="noreferrer" className="bg-slate-800 px-2 py-1 rounded text-[10px] text-emerald-300">
                        Lichess ↗
                      </a>
                    )}
                    <button
                      onClick={() => { setDeleteTarget({ type: 'student', id: st.id, name: st.name }); setShowDeleteModal(true); }}
                      className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white px-2 py-1 rounded text-[10px] transition"
                    >
                      O‘chirish
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 text-xs space-y-1">
                  <p><span className="text-emerald-400 font-medium">Holati:</span> {st.diagnosis || 'Kiritilmagan'}</p>
                  <p><span className="text-sky-400 font-medium">Kitob:</span> {st.book} ({st.completedTopics}-mavzu)</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase">Arxivlangan O‘quvchilar</h2>
            {currentCenter?.archive.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">Arxivda o‘quvchilar yo‘q</p>
            ) : (
              currentCenter?.archive.map(st => (
                <div key={st.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-300">{st.name}</p>
                    <p className="text-[10px] text-slate-500">Arxivlangan sana: {st.archivedAt}</p>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">Arxivda</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Doimiy + tugmasi */}
      <button
        onClick={() => setShowStudentModal(true)}
        className="fab-btn bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition active:scale-95"
      >
        +
      </button>

      {/* O'chirish paroli modali */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-xs space-y-4">
            <h3 className="text-sm font-bold text-white">Arxivga olmoqchimisiz?</h3>
            <p className="text-xs text-slate-400 font-medium">"{deleteTarget?.name}" arxivga o‘tkaziladi. Tasdiqlash uchun parolni kiriting:</p>
            <input
              type="password"
              placeholder="Parolni kiriting (bekzod)"
              value={deletePassInput}
              onChange={(e) => setDeletePassInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-slate-800 py-2 rounded-xl text-xs">Bekor qilish</button>
              <button onClick={confirmDelete} className="flex-1 bg-rose-600 hover:bg-rose-700 py-2 rounded-xl text-xs font-bold text-white">O‘chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Yangi Markaz Modali */}
      {showCenterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-3">
            <h3 className="text-sm font-bold text-white">Yangi O‘quv Markazi Qo‘shish</h3>
            <form onSubmit={handleAddCenter} className="space-y-2.5">
              <input required placeholder="Markaz nomi (masalan: Apex Chess)" value={centerForm.name} onChange={e => setCenterForm({...centerForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <input required placeholder="Markaz rahbari (F.I.O)" value={centerForm.ownerName} onChange={e => setCenterForm({...centerForm, ownerName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <input required placeholder="Telefon raqami" value={centerForm.phone} onChange={e => setCenterForm({...centerForm, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCenterModal(false)} className="flex-1 bg-slate-800 py-2.5 rounded-xl text-xs">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-emerald-500 py-2.5 rounded-xl text-xs font-bold text-white">Qo‘shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yangi O'quvchi Modali */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">Yangi O‘quvchi Anketasi</h3>
            <form onSubmit={handleAddStudent} className="space-y-2.5">
              <input required placeholder="F.I.O" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Yoshi" type="number" value={studentForm.age} onChange={e => setStudentForm({...studentForm, age: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
                <input placeholder="Telefon" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={studentForm.room} onChange={e => setStudentForm({...studentForm, room: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white">
                  {currentCenter?.rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={studentForm.time} onChange={e => setStudentForm({...studentForm, time: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white">
                  <option value="14:00">14:00</option>
                  <option value="16:00">16:00</option>
                  <option value="18:00">18:00</option>
                </select>
                <select value={studentForm.days} onChange={e => setStudentForm({...studentForm, days: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white">
                  <option value="juft">Juft</option>
                  <option value="toq">Toq</option>
                </select>
              </div>
              <input placeholder="Lichess username" value={studentForm.lichess} onChange={e => setStudentForm({...studentForm, lichess: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <textarea placeholder="Boshlang‘ich diagnostika" rows={2} value={studentForm.diagnosis} onChange={e => setStudentForm({...studentForm, diagnosis: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowStudentModal(false)} className="flex-1 bg-slate-800 py-2.5 rounded-xl text-xs">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-emerald-500 py-2.5 rounded-xl text-xs font-bold text-white">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pastki Menyu */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around p-2.5 z-30">
        <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === 'schedule' ? 'text-emerald-400' : 'text-slate-500'}`}>
          📅 Jadval
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === 'students' ? 'text-emerald-400' : 'text-slate-500'}`}>
          👥 O‘quvchilar
        </button>
        <button onClick={() => setActiveTab('archive')} className={`flex flex-col items-center text-[10px] font-bold ${activeTab === 'archive' ? 'text-emerald-400' : 'text-slate-500'}`}>
          🗄️ Arxiv
        </button>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
