const { useState } = React;

// ======================================================
// CHESS COACH UZ — YANGI VERSIYA
// ======================================================

const DB_KEY = "chess_coach_uz_master_db";

const PIECES = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙"
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟"
  }
};

const START_POSITION = [
  ["black-rook","black-knight","black-bishop","black-queen","black-king","black-bishop","black-knight","black-rook"],
  ["black-pawn","black-pawn","black-pawn","black-pawn","black-pawn","black-pawn","black-pawn","black-pawn"],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ["white-pawn","white-pawn","white-pawn","white-pawn","white-pawn","white-pawn","white-pawn","white-pawn"],
  ["white-rook","white-knight","white-bishop","white-queen","white-king","white-bishop","white-knight","white-rook"]
];

const defaultDB = {
  users: [
    {
      id: "super_1",
      username: "bekzod_admin",
      password: "superpassword123",
      name: "Bekzod Javliev",
      role: "superadmin",
      centerId: null,
      online: true
    }
  ],
  centers: [
    {
      id: "center_1",
      name: "Markaziy Shaxmat Akademiyasi",
      directorId: "super_1"
    }
  ],
  groups: [],
  students: []
};

function getDB() {
  try {
    const saved = localStorage.getItem(DB_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
    return defaultDB;
  } catch {
    return defaultDB;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ChessPiece({ piece }) {
  if (!piece) return null;

  const [color, type] = piece.split("-");

  return (
    <div
      className={`chess-piece ${
        color === "white" ? "piece-white" : "piece-black"
      }`}
    >
      {PIECES[color][type]}
    </div>
  );
}

function ChessBoard() {
  const [board, setBoard] = useState(
    START_POSITION.map(row => [...row])
  );

  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("white");
  const [message, setMessage] = useState("Oq donalar yuradi");

  function handleSquareClick(row, col) {
    const piece = board[row][col];

    if (selected) {
      const newBoard = board.map(r => [...r]);

      const selectedPiece = newBoard[selected.row][selected.col];

      if (selectedPiece) {
        const pieceColor = selectedPiece.startsWith("white")
          ? "white"
          : "black";

        if (pieceColor === turn) {
          newBoard[row][col] = selectedPiece;
          newBoard[selected.row][selected.col] = null;

          setBoard(newBoard);

          const nextTurn = turn === "white" ? "black" : "white";
          setTurn(nextTurn);

          setMessage(
            nextTurn === "white"
              ? "Oq donalar yuradi"
              : "Qora donalar yuradi"
          );
        }
      }

      setSelected(null);
      return;
    }

    if (piece) {
      const pieceColor = piece.startsWith("white")
        ? "white"
        : "black";

      if (pieceColor === turn) {
        setSelected({ row, col });
      }
    }
  }

  function resetBoard() {
    setBoard(START_POSITION.map(row => [...row]));
    setSelected(null);
    setTurn("white");
    setMessage("Oq donalar yuradi");
  }

  return (
    <div className="chess-area">

      <div className="board-header">
        <div>
          <h2>♟ Jonli Shaxmat Taxtasi</h2>
          <p>{message}</p>
        </div>

        <button
          className="reset-btn"
          onClick={resetBoard}
        >
          ↻ Yangilash
        </button>
      </div>

      <div className="board-wrapper">

        <div className="coordinates-left">
          {["8","7","6","5","4","3","2","1"].map(n => (
            <span key={n}>{n}</span>
          ))}
        </div>

        <div className="chess-board">

          {board.map((row, r) =>
            row.map((piece, c) => {

              const dark = (r + c) % 2 === 1;

              const isSelected =
                selected &&
                selected.row === r &&
                selected.col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`square ${
                    dark ? "dark-square" : "light-square"
                  } ${isSelected ? "selected-square" : ""}`}
                >
                  <ChessPiece piece={piece} />

                  {r === 7 && (
                    <span className="file-coordinate">
                      {String.fromCharCode(97 + c)}
                    </span>
                  )}
                </div>
              );
            })
          )}

        </div>
      </div>

      <div className="piece-info">

        <div className="piece-card">
          <span>♔</span>
          <small>Qirol</small>
        </div>

        <div className="piece-card">
          <span>♕</span>
          <small>Farzin</small>
        </div>

        <div className="piece-card">
          <span>♖</span>
          <small>Tura</small>
        </div>

        <div className="piece-card">
          <span>♗</span>
          <small>Fil</small>
        </div>

        <div className="piece-card">
          <span>♘</span>
          <small>Ot</small>
        </div>

        <div className="piece-card">
          <span>♙</span>
          <small>Piyoda</small>
        </div>

      </div>

    </div>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();

    const db = getDB();

    const user = db.users.find(
      u =>
        u.username.toLowerCase() === username.toLowerCase().trim() &&
        u.password === password
    );

    if (!user) {
      setError("Username yoki parol noto'g'ri!");
      return;
    }

    localStorage.setItem(
      "chess_coach_current_user",
      JSON.stringify(user)
    );

    onLogin(user);
  }

  return (
    <div className="login-page">

      <div className="login-box">

        <div className="logo-big">
          ♞
        </div>

        <h1>Chess Coach UZ</h1>

        <p className="login-subtitle">
          Shaxmat boshqaruv tizimi
        </p>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <form onSubmit={submit}>

          <label>Username</label>

          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="bekzod_admin"
            required
          />

          <label>Parol</label>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Parol"
            required
          />

          <button className="main-btn">
            Tizimga kirish
          </button>

        </form>

        <div className="demo-login">
          <b>Sinov uchun:</b><br />
          Username: bekzod_admin<br />
          Parol: superpassword123
        </div>

      </div>

    </div>
  );
}

function App() {

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "chess_coach_current_user"
      );

      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("dashboard");

  if (!currentUser) {
    return (
      <Login onLogin={setCurrentUser} />
    );
  }

  function logout() {
    localStorage.removeItem(
      "chess_coach_current_user"
    );

    setCurrentUser(null);
  }

  return (
    <div className="app">

      <header className="topbar">

        <div className="brand">
          <div className="brand-logo">♞</div>

          <div>
            <strong>Chess Coach UZ</strong>
            <small>SHAXMAT CRM</small>
          </div>
        </div>

        <div className="user-area">

          <span>
            {currentUser.name}
          </span>

          <button
            onClick={logout}
            className="logout-btn"
          >
            Chiqish
          </button>

        </div>

      </header>

      <div className="layout">

        <aside className="sidebar">

          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Boshqaruv paneli
          </button>

          <button
            className={activeTab === "live" ? "active" : ""}
            onClick={() => setActiveTab("live")}
          >
            ♟ Jonli shaxmat
          </button>

          <button
            className={activeTab === "groups" ? "active" : ""}
            onClick={() => setActiveTab("groups")}
          >
            👥 Guruhlar
          </button>

          <button
            className={activeTab === "students" ? "active" : ""}
            onClick={() => setActiveTab("students")}
          >
            🎓 O'quvchilar
          </button>

          <button
            className={activeTab === "finance" ? "active" : ""}
            onClick={() => setActiveTab("finance")}
          >
            💰 Moliya
          </button>

        </aside>

        <main className="content">

          {activeTab === "dashboard" && (

            <div>

              <div className="welcome-card">

                <div>
                  <span>Chess Coach UZ</span>

                  <h1>
                    Salom, {currentUser.name}! 👋
                  </h1>

                  <p>
                    Shaxmat markazingizni boshqaring.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("live")}
                  className="live-btn"
                >
                  🔴 Jonli darsni ochish
                </button>

              </div>

              <div className="stats">

                <div className="stat">
                  <span>👥</span>
                  <b>0</b>
                  <small>Guruhlar</small>
                </div>

                <div className="stat">
                  <span>🎓</span>
                  <b>0</b>
                  <small>O'quvchilar</small>
                </div>

                <div className="stat">
                  <span>💰</span>
                  <b>0 so'm</b>
                  <small>Kassa</small>
                </div>

                <div className="stat">
                  <span>♟</span>
                  <b>1</b>
                  <small>Shaxmat xonasi</small>
                </div>

              </div>

              <div className="quick-card">

                <h2>♟ Shaxmat darsi</h2>

                <p>
                  O'quvchi bilan jonli shaxmat o'ynash,
                  yurishlarni ko'rsatish va dars o'tish.
                </p>

                <button
                  onClick={() => setActiveTab("live")}
                  className="main-btn small"
                >
                  Shaxmat taxtasini ochish →
                </button>

              </div>

            </div>

          )}

          {activeTab === "live" && (
            <ChessBoard />
          )}

          {activeTab === "groups" && (
            <div className="empty-page">
              <div>👥</div>
              <h2>Guruhlar</h2>
              <p>
                Bu bo'lim keyingi bosqichda qo'shiladi.
              </p>
            </div>
          )}

          {activeTab === "students" && (
            <div className="empty-page">
              <div>🎓</div>
              <h2>O'quvchilar</h2>
              <p>
                O'quvchilar bazasi keyingi bosqichda qo'shiladi.
              </p>
            </div>
          )}

          {activeTab === "finance" && (
            <div className="empty-page">
              <div>💰</div>
              <h2>Moliya</h2>
              <p>
                Kassa va to'lovlar keyingi bosqichda qo'shiladi.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

const root =
  ReactDOM.createRoot(
    document.getElementById("root")
  );

root.render(<App />);
