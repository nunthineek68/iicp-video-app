import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

import "./video-vertical.css";
/*
  เน€เธเธฅเธตเนเธขเธเน€เธเนเธ Video ID เธเธญเธเธเธฅเธดเธเธเธฃเธดเธ
  เธ•เธฑเธงเธญเธขเนเธฒเธเธฅเธดเธเธเน:
  https://www.youtube.com/watch?v=AbCdEf12345
  เนเธซเนเนเธชเนเน€เธเธเธฒเธฐ AbCdEf12345
*/
const YOUTUBE_VIDEO_ID = "pYxyH56v8rQ";

/*
  time เธกเธตเธซเธเนเธงเธขเน€เธเนเธเธงเธดเธเธฒเธ—เธต
  120 = เธเธฒเธ—เธต 2:00
  270 = เธเธฒเธ—เธต 4:30
  420 = เธเธฒเธ—เธต 7:00
  570 = เธเธฒเธ—เธต 9:30
*/
const questions = [
  {
    id: 1,
    time: 120,
    text: "เธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธ GCS เธเธฃเธฐเธเธญเธเธ”เนเธงเธขเธญเธเธเนเธเธฃเธฐเธเธญเธเนเธ”",
    choices: [
      "Eye, Verbal เนเธฅเธฐ Motor",
      "Pupil, Motor power เนเธฅเธฐ Vital signs",
    ],
    correctAnswer: "Eye, Verbal เนเธฅเธฐ Motor",
  },
  {
    id: 2,
    time: 270,
    text: "เธเธฒเธฃเธ•เธฃเธงเธเธฃเธนเธกเนเธฒเธเธ•เธฒเธ—เธตเนเธ–เธนเธเธ•เนเธญเธเธเธงเธฃเธ—เธณเธญเธขเนเธฒเธเนเธฃ",
    choices: [
      "เธ•เธฃเธงเธเน€เธเธเธฒเธฐเธเนเธฒเธเธ—เธตเนเธชเธเธชเธฑเธขเธงเนเธฒเธเธดเธ”เธเธเธ•เธด",
      "เธ•เธฃเธงเธเธเธเธฒเธ”เนเธฅเธฐเธเธฒเธฃเธ•เธญเธเธชเธเธญเธเธ•เนเธญเนเธชเธเธ—เธฑเนเธเธชเธญเธเธเนเธฒเธ",
    ],
    correctAnswer:
      "เธ•เธฃเธงเธเธเธเธฒเธ”เนเธฅเธฐเธเธฒเธฃเธ•เธญเธเธชเธเธญเธเธ•เนเธญเนเธชเธเธ—เธฑเนเธเธชเธญเธเธเนเธฒเธ",
  },
  {
    id: 3,
    time: 420,
    text: "เธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธ Motor power เธเธงเธฃเธเธฃเธฐเน€เธกเธดเธเธเธฃเธดเน€เธงเธ“เนเธ”",
    choices: [
      "เนเธเธเนเธฅเธฐเธเธฒเธ—เธฑเนเธเธชเธญเธเธเนเธฒเธ",
      "เน€เธเธเธฒเธฐเธ”เนเธฒเธเธ—เธตเนเธเธนเนเธเนเธงเธขเธญเนเธญเธเนเธฃเธ",
    ],
    correctAnswer: "เนเธเธเนเธฅเธฐเธเธฒเธ—เธฑเนเธเธชเธญเธเธเนเธฒเธ",
  },
  {
    id: 4,
    time: 570,
    text: "เธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธเธฅเธฑเธเธฉเธ“เธฐเธเธฒเธฃเธซเธฒเธขเนเธเธเธงเธฃเธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅเนเธ”",
    choices: [
      "เธเธงเธฒเธกเธชเธกเนเธณเน€เธชเธกเธญเนเธฅเธฐเธฅเธฑเธเธฉเธ“เธฐเธ—เธตเนเธเธเธ•เธดเธซเธฃเธทเธญเธเธดเธ”เธเธเธ•เธด",
      "เธเธฑเธเธ—เธถเธเน€เธเธเธฒเธฐเธเนเธฒ SpOโ",
    ],
    correctAnswer:
      "เธเธงเธฒเธกเธชเธกเนเธณเน€เธชเธกเธญเนเธฅเธฐเธฅเธฑเธเธฉเธ“เธฐเธ—เธตเนเธเธเธ•เธดเธซเธฃเธทเธญเธเธดเธ”เธเธเธ•เธด",
  },
];

function App() {
  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [started, setStarted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const answeredQuestionsRef = useRef(new Set());
  const questionOpenRef = useRef(false);

  const sessionIdRef = useRef("");
  const editTokenRef = useRef("");
  const scoreRef = useRef(0);
  const completedRef = useRef(false);

  async function startLesson(event) {
    event.preventDefault();
    setErrorMessage("");

    const cleanCode = studentCode.trim();
    const cleanName = fullName.trim();

    if (!cleanCode || !cleanName) {
      setErrorMessage("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธซเธฑเธชเธเธดเธชเธดเธ•เนเธฅเธฐเธเธทเนเธญโ€“เธเธฒเธกเธชเธเธธเธฅ");
      return;
    }

    if (YOUTUBE_VIDEO_ID === "เนเธชเน_VIDEO_ID_เธ•เธฃเธเธเธตเน") {
      setErrorMessage("เธเธฃเธธเธ“เธฒเนเธชเน YouTube Video ID เนเธเนเธเธฅเน App.jsx");
      return;
    }

    setSaving(true);

    const sessionId = crypto.randomUUID();
    const editToken = crypto.randomUUID();

    const { error } = await supabase
      .from("learning_results")
      .insert({
        session_id: sessionId,
        edit_token: editToken,
        student_code: cleanCode,
        full_name: cleanName,
        score: 0,
        completed: false,
      });

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMessage(
  `เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธฃเธดเนเธกเธเธ—เน€เธฃเธตเธขเธเนเธ”เน: ${error.message}`
);
      return;
    }

    sessionIdRef.current = sessionId;
    editTokenRef.current = editToken;
    setStarted(true);
  }

  useEffect(() => {
    if (!started) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: YOUTUBE_VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          playsinline: 0,
          rel: 0,
        },
        events: {
          onReady: () => {
            beginTimeChecking();
          },
          onStateChange: (event) => {
            if (
              event.data === window.YT.PlayerState.ENDED &&
              !completedRef.current
            ) {
              finishLesson();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [started]);

  function beginTimeChecking() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const player = playerRef.current;

      if (
        !player ||
        typeof player.getCurrentTime !== "function" ||
        questionOpenRef.current
      ) {
        return;
      }

      const currentTime = player.getCurrentTime();

      const nextQuestion = questions.find(
        (question) =>
          currentTime >= question.time &&
          !answeredQuestionsRef.current.has(question.id)
      );

      if (nextQuestion) {
        player.pauseVideo();
        questionOpenRef.current = true;
        setActiveQuestion(nextQuestion);
      }
    }, 500);
  }

  async function submitAnswer(answer) {
    if (!activeQuestion) return;

    setSaving(true);
    setErrorMessage("");

    const correct = answer === activeQuestion.correctAnswer;
    const newScore = scoreRef.current + (correct ? 1 : 0);

    const questionNumber = activeQuestion.id;

    const updateData = {
      [`q${questionNumber}_answer`]: answer,
      [`q${questionNumber}_correct`]: correct,
      score: newScore,
    };

    const { error } = await supabase
      .from("learning_results")
      .update(updateData)
      .eq("session_id", sessionIdRef.current)
      .eq("edit_token", editTokenRef.current);

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMessage(
        "เธเธฑเธเธ—เธถเธเธเธณเธ•เธญเธเนเธกเนเธชเธณเน€เธฃเนเธ เธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธเธญเธดเธเน€เธ—เธญเธฃเนเน€เธเนเธ•เนเธฅเนเธงเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธ"
      );
      return;
    }

    answeredQuestionsRef.current.add(questionNumber);
    scoreRef.current = newScore;
    setScore(newScore);

    setActiveQuestion(null);
    questionOpenRef.current = false;

    playerRef.current?.playVideo();
  }

  async function finishLesson() {
    completedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const { error } = await supabase
      .from("learning_results")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        score: scoreRef.current,
      })
      .eq("session_id", sessionIdRef.current)
      .eq("edit_token", editTokenRef.current);

    if (error) {
      console.error(error);
      setErrorMessage(
        "เธ”เธนเธเธฅเธดเธเธเธเนเธฅเนเธง เนเธ•เนเธเธฑเธเธ—เธถเธเธชเธ–เธฒเธเธฐเนเธกเนเธชเธณเน€เธฃเนเธ เธเธฃเธธเธ“เธฒเนเธเนเธเธเธนเนเธชเธญเธ"
      );
    }

    setCompleted(true);
  }

  if (!started) {
    return (
      <main className="page">
        <section className="card login-card">
          <div className="badge">เธเธ—เน€เธฃเธตเธขเธเธเนเธญเธเน€เธเนเธฒเธเธฑเนเธเน€เธฃเธตเธขเธ</div>

          <h1>เธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธเธเธนเนเธเนเธงเธขเธ—เธตเนเธชเธเธชเธฑเธขเธ เธฒเธงเธฐ IICP</h1>

          <p className="description">
            เธชเธณเธซเธฃเธฑเธเธเธดเธชเธดเธ•เธเธขเธฒเธเธฒเธฅเธเธฑเนเธเธเธตเธ—เธตเน 2
          </p>

          <form onSubmit={startLesson}>
            <label htmlFor="studentCode">เธฃเธซเธฑเธชเธเธดเธชเธดเธ•</label>
            <input
              id="studentCode"
              type="text"
              value={studentCode}
              onChange={(event) =>
                setStudentCode(event.target.value)
              }
              placeholder="เธเธฃเธญเธเธฃเธซเธฑเธชเธเธดเธชเธดเธ•"
              autoComplete="off"
            />

            <label htmlFor="fullName">เธเธทเนเธญโ€“เธเธฒเธกเธชเธเธธเธฅ</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="เธเธฃเธญเธเธเธทเนเธญโ€“เธเธฒเธกเธชเธเธธเธฅ"
              autoComplete="name"
            />

            {errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ..." : "เน€เธฃเธดเนเธกเน€เธฃเธตเธขเธ"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card lesson-card">
        <div className="lesson-header">
          <div>
            <div className="badge">Interactive Video</div>
            <h1>เธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธเธเธนเนเธเนเธงเธขเธ—เธตเนเธชเธเธชเธฑเธขเธ เธฒเธงเธฐ IICP</h1>
            <p>
              {studentCode} โ€” {fullName}
            </p>
          </div>

          <div className="score-box">
            เธ•เธญเธเนเธฅเนเธง {answeredQuestionsRef.current.size}/4
          </div>
        </div>

        {!completed ? (
          <>
            <div className="video-wrapper">
              <div id="youtube-player"></div>
            </div>

            <p className="instruction">
              เธฃเธฐเธซเธงเนเธฒเธเธ”เธนเธเธฅเธดเธ เธงเธดเธ”เธตเนเธญเธเธฐเธซเธขเธธเธ”เน€เธเธทเนเธญเนเธซเนเธ•เธญเธเธเธณเธ–เธฒเธก
              เธเธฃเธธเธ“เธฒเธ•เธญเธเธเนเธญเธเธเธถเธเธเธฐเธ”เธนเธ•เนเธญเนเธ”เน
            </p>
          </>
        ) : (
          <section className="completion-box">
            <h2>เน€เธฃเธตเธขเธเธเธเนเธฅเนเธง</h2>
            <p>เธฃเธฐเธเธเธเธฑเธเธ—เธถเธเธเธฅเธเธฒเธฃเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง</p>
            <div className="final-score">
              เธเธฐเนเธเธ {score}/4
            </div>
          </section>
        )}

        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
      </section>

      {activeQuestion && (
        <div className="modal-overlay">
          <section
            className="question-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="question-number">
              เธเธณเธ–เธฒเธกเธเนเธญเธ—เธตเน {activeQuestion.id} เธเธฒเธ 4
            </div>

            <h2>{activeQuestion.text}</h2>

            <div className="choice-list">
              {activeQuestion.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className="choice-button"
                  disabled={saving}
                  onClick={() => submitAnswer(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>

            {saving && <p>เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธเธเธณเธ•เธญเธ...</p>}

            {errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;