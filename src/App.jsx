import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

/*
  เปลี่ยนเป็น Video ID ของคลิปจริง
  ตัวอย่างลิงก์:
  https://www.youtube.com/watch?v=AbCdEf12345
  ให้ใส่เฉพาะ AbCdEf12345
*/
const YOUTUBE_VIDEO_ID = "pYxyH56v8rQ";

/*
  time มีหน่วยเป็นวินาที
  120 = นาที 2:00
  270 = นาที 4:30
  420 = นาที 7:00
  570 = นาที 9:30
*/
const questions = [
  {
    id: 1,
    time: 120,
    text: "การประเมิน GCS ประกอบด้วยองค์ประกอบใด",
    choices: [
      "Eye, Verbal และ Motor",
      "Pupil, Motor power และ Vital signs",
    ],
    correctAnswer: "Eye, Verbal และ Motor",
  },
  {
    id: 2,
    time: 270,
    text: "การตรวจรูม่านตาที่ถูกต้องควรทำอย่างไร",
    choices: [
      "ตรวจเฉพาะข้างที่สงสัยว่าผิดปกติ",
      "ตรวจขนาดและการตอบสนองต่อแสงทั้งสองข้าง",
    ],
    correctAnswer:
      "ตรวจขนาดและการตอบสนองต่อแสงทั้งสองข้าง",
  },
  {
    id: 3,
    time: 420,
    text: "การประเมิน Motor power ควรประเมินบริเวณใด",
    choices: [
      "แขนและขาทั้งสองข้าง",
      "เฉพาะด้านที่ผู้ป่วยอ่อนแรง",
    ],
    correctAnswer: "แขนและขาทั้งสองข้าง",
  },
  {
    id: 4,
    time: 570,
    text: "การประเมินลักษณะการหายใจควรบันทึกข้อมูลใด",
    choices: [
      "ความสม่ำเสมอและลักษณะที่ปกติหรือผิดปกติ",
      "บันทึกเฉพาะค่า SpO₂",
    ],
    correctAnswer:
      "ความสม่ำเสมอและลักษณะที่ปกติหรือผิดปกติ",
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
      setErrorMessage("กรุณากรอกรหัสนิสิตและชื่อ–นามสกุล");
      return;
    }

    if (YOUTUBE_VIDEO_ID === "ใส่_VIDEO_ID_ตรงนี้") {
      setErrorMessage("กรุณาใส่ YouTube Video ID ในไฟล์ App.jsx");
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
  `ไม่สามารถเริ่มบทเรียนได้: ${error.message}`
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
          playsinline: 1,
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
        "บันทึกคำตอบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง"
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
        "ดูคลิปจบแล้ว แต่บันทึกสถานะไม่สำเร็จ กรุณาแจ้งผู้สอน"
      );
    }

    setCompleted(true);
  }

  if (!started) {
    return (
      <main className="page">
        <section className="card login-card">
          <div className="badge">บทเรียนก่อนเข้าชั้นเรียน</div>

          <h1>การประเมินผู้ป่วยที่สงสัยภาวะ IICP</h1>

          <p className="description">
            สำหรับนิสิตพยาบาลชั้นปีที่ 2
          </p>

          <form onSubmit={startLesson}>
            <label htmlFor="studentCode">รหัสนิสิต</label>
            <input
              id="studentCode"
              type="text"
              value={studentCode}
              onChange={(event) =>
                setStudentCode(event.target.value)
              }
              placeholder="กรอกรหัสนิสิต"
              autoComplete="off"
            />

            <label htmlFor="fullName">ชื่อ–นามสกุล</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="กรอกชื่อ–นามสกุล"
              autoComplete="name"
            />

            {errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "เริ่มเรียน"}
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
            <h1>การประเมินผู้ป่วยที่สงสัยภาวะ IICP</h1>
            <p>
              {studentCode} — {fullName}
            </p>
          </div>

          <div className="score-box">
            ตอบแล้ว {answeredQuestionsRef.current.size}/4
          </div>
        </div>

        {!completed ? (
          <>
            <div className="video-wrapper">
              <div id="youtube-player"></div>
            </div>

            <p className="instruction">
              ระหว่างดูคลิป วิดีโอจะหยุดเพื่อให้ตอบคำถาม
              กรุณาตอบก่อนจึงจะดูต่อได้
            </p>
          </>
        ) : (
          <section className="completion-box">
            <h2>เรียนจบแล้ว</h2>
            <p>ระบบบันทึกผลการเรียนเรียบร้อยแล้ว</p>
            <div className="final-score">
              ตอบคำถามครบทั้งหมด {answeredCount}/4 ข้อ
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
              คำถามข้อที่ {activeQuestion.id} จาก 4
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

            {saving && <p>กำลังบันทึกคำตอบ...</p>}

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