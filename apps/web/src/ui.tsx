import type { Outcome } from './state.ts';
import type { Question, QuestionAggregate, OwnResponse, Snapshot } from './api.ts';

const RATING_LABELS: Record<number, string> = {
  1: '1 ยังไม่มั่นใจ',
  2: '2',
  3: '3',
  4: '4',
  5: '5 มั่นใจมาก',
};

export function JoinView(props: {
  joinCode: string;
  nickname: string;
  error: string | null;
  pending: boolean;
  onJoinCode: (value: string) => void;
  onNickname: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="screen">
      <h1>เข้าร่วมเวิร์กช็อป</h1>
      <section className="card" aria-label="วิธีเข้าร่วม">
        <h2>ลิงก์สำหรับผู้เข้าร่วม</h2>
        <p className="mono">[ที่อยู่ระบบ]/join</p>
        <h2>รหัสห้องสำหรับผู้เข้าร่วม</h2>
        <p className="mono">ROOM-01</p>
        <p>เปิดลิงก์ → กรอกรหัสห้อง → ไม่ต้องสมัครบัญชี</p>
      </section>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <label htmlFor="join-code">รหัสห้อง</label>
        <input
          id="join-code"
          value={props.joinCode}
          onChange={(event) => props.onJoinCode(event.target.value)}
          autoComplete="off"
          required
        />
        <label htmlFor="nickname">ชื่อเล่น (ไม่บังคับ)</label>
        <input
          id="nickname"
          value={props.nickname}
          onChange={(event) => props.onNickname(event.target.value)}
          autoComplete="off"
        />
        {props.error ? (
          <p className="error" role="alert">
            {props.error}
          </p>
        ) : null}
        <button type="submit" disabled={props.pending}>
          {props.pending ? 'กำลังเข้าร่วม…' : 'เข้าร่วมกิจกรรม'}
        </button>
        <p className="hint">ไม่ต้องสมัครบัญชี และไม่ต้องใช้ชื่อจริง</p>
      </form>
    </main>
  );
}

export function ParticipantView(props: {
  participantLabel: string;
  question: Question | null;
  rating: number | null;
  optionId: string | null;
  comment: string;
  countLabel: string;
  outcome: Outcome;
  errorMessage: string | null;
  questionClosed: boolean;
  canFreshAttempt: boolean;
  sending: boolean;
  onRating: (value: number) => void;
  onOption: (value: string) => void;
  onComment: (value: string) => void;
  onSubmit: () => void;
  onReconcile: () => void;
  onFreshAttempt: () => void;
  ownResponse: OwnResponse | null;
}) {
  const question = props.question;
  return (
    <main className="screen">
      <header className="room-header">
        <h1>คำถามสำหรับผู้เข้าร่วม</h1>
        <p className="hint">เข้าร่วมในชื่อ “{props.participantLabel}”</p>
      </header>
      {!question ? (
        <section className="card">
          <p>ยังไม่มีคำถามที่เปิดอยู่</p>
        </section>
      ) : (
        <section className="card" aria-label="คำถามปัจจุบัน">
          <p className="eyebrow">ข้อ {String(question.seq).padStart(2, '0')}</p>
          <h2>{question.label}</h2>
          {question.help_text ? <p className="hint">{question.help_text}</p> : null}
          {props.questionClosed ? <p className="notice">คำถามนี้ปิดรับคำตอบแล้ว</p> : null}

          {question.type === 'rating' ? (
            <fieldset disabled={props.questionClosed || props.outcome === 'saved' || props.sending}>
              <legend>เลือกคะแนน</legend>
              <div className="scale">
                {(question.options ?? []).length === 0
                  ? ratingValues(question).map((value) => (
                      <label key={value} className={props.rating === value ? 'pill selected' : 'pill'}>
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          checked={props.rating === value}
                          onChange={() => props.onRating(value)}
                        />
                        {RATING_LABELS[value] ?? String(value)}
                      </label>
                    ))
                  : null}
              </div>
            </fieldset>
          ) : (
            <fieldset disabled={props.questionClosed || props.outcome === 'saved' || props.sending}>
              <legend>เลือกหนึ่งข้อ</legend>
              {(question.options ?? []).map((option) => (
                <label key={option.id} className={props.optionId === option.id ? 'option selected' : 'option'}>
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={props.optionId === option.id}
                    onChange={() => props.onOption(option.id)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          )}

          <label htmlFor="comment">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</label>
          <textarea
            id="comment"
            rows={4}
            value={props.comment}
            disabled={props.questionClosed || props.outcome === 'saved' || props.sending}
            onChange={(event) => props.onComment(event.target.value)}
            placeholder="พิมพ์ข้อความได้หลายบรรทัด กด Enter เพื่อขึ้นบรรทัดใหม่"
          />
          <p className={props.countLabel.startsWith('~') ? 'count approximate' : 'count'}>{props.countLabel}</p>

          {props.errorMessage ? (
            <p className={props.outcome === 'terminal_non_save' ? 'error' : 'notice'} role="alert" data-outcome={props.outcome}>
              {props.errorMessage}
            </p>
          ) : null}

          {props.outcome === 'sending' ? <p className="hint">กำลังส่งคำตอบและข้อความ…</p> : null}
          {props.outcome === 'saved' ? (
            <p className="saved">
              บันทึกคำตอบและข้อความแล้ว
              {props.ownResponse?.comment ? <span className="own-comment"> — “{props.ownResponse.comment}”</span> : null}
            </p>
          ) : null}
          {props.outcome === 'unknown' ? (
            <div>
              <p className="notice">ยังไม่ทราบผลการบันทึก — ข้อความของคุณยังอยู่ครบ</p>
              <button type="button" onClick={props.onReconcile}>
                ตรวจสถานะอีกครั้ง
              </button>
            </div>
          ) : null}
          {props.outcome === 'terminal_non_save' ? (
            <div className="actions">
              <button type="button" onClick={props.onFreshAttempt} disabled={!props.canFreshAttempt}>
                เริ่มส่งคำตอบใหม่
              </button>
              <button type="button" className="secondary" onClick={props.onFreshAttempt} disabled={!props.canFreshAttempt}>
                แก้คำตอบก่อนส่งใหม่
              </button>
              <p className="hint">ใช้คำตอบเดิมได้ ไม่ต้องพิมพ์ใหม่</p>
            </div>
          ) : null}
          {!props.questionClosed && props.outcome !== 'saved' && props.outcome !== 'unknown' && props.outcome !== 'terminal_non_save' ? (
            <button type="button" onClick={props.onSubmit} disabled={props.sending || (!props.rating && !props.optionId)}>
              {props.sending ? 'กำลังส่ง…' : 'ส่งคำตอบ'}
            </button>
          ) : null}
        </section>
      )}
    </main>
  );
}

function ratingValues(question: Question): number[] {
  const min = question.rating_min ?? 1;
  const max = question.rating_max ?? 5;
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function FacilitatorView(props: {
  hasToken: boolean;
  token: string;
  snapshot: Snapshot | null;
  live: boolean;
  loading: boolean;
  error: string | null;
  pending: string | null;
  onToken: (value: string) => void;
  onConnect: () => void;
  onOpen: (questionId: string) => void;
  onClose: (questionId: string) => void;
  onEnd: () => void;
}) {
  return (
    <main className="screen wide">
      <header>
        <h1>ผู้ควบคุมกิจกรรม</h1>
        {props.snapshot ? (
          <p className="hint">
            ห้อง {props.snapshot.revision >= 0 ? '' : ''}
            {props.snapshot.questions.length} คำถาม · ผู้เข้าร่วม {props.snapshot.participant_count} คน
          </p>
        ) : null}
        <p className={props.live ? 'live' : 'stale'} data-testid="live-status">
          {props.live ? 'Live' : 'ข้อมูลเก่า · ไม่ใช่ Live'}
        </p>
      </header>
      {!props.hasToken ? (
        <section className="card">
          <label htmlFor="facilitator-token">โทเค็นผู้ควบคุม (เฉพาะเครื่องนี้)</label>
          <input
            id="facilitator-token"
            value={props.token}
            onChange={(event) => props.onToken(event.target.value)}
            autoComplete="off"
          />
          <button type="button" onClick={props.onConnect} disabled={props.loading}>
            {props.loading ? 'กำลังเชื่อมต่อ…' : 'เชื่อมต่อ'}
          </button>
          <p className="hint">โทเค็น local fixture อยู่ใน .local/fixtures.json และไม่ถูกแสดงบนหน้านี้ซ้ำ</p>
        </section>
      ) : null}
      {props.error ? (
        <p className="error" role="alert">
          {props.error}
        </p>
      ) : null}
      {!props.snapshot && props.hasToken ? <p>ยังไม่ได้รับ snapshot ที่ยืนยันแล้ว</p> : null}
      {props.snapshot ? (
        <section className="grid" aria-label="ผลรวมคำตอบ">
          {props.snapshot.questions.map((question) => (
            <article className="card" key={question.question_id}>
              <p className="eyebrow">ข้อ {String(question.seq).padStart(2, '0')}</p>
              <h2>{question.label}</h2>
              {props.snapshot?.active_question_id === question.question_id && !question.receiving ? (
                <p className="notice">คำถามปัจจุบันยังไม่ยืนยัน — ผลล่าสุดยังเป็นข้อมูลเก่า</p>
              ) : null}
              <AggregateChart question={question} />
              <p className="hint">
                {question.type === 'rating'
                  ? `เฉลี่ย ${question.average ?? '-'} จาก ${question.total} คำตอบ`
                  : `${question.total} คำตอบ · ${question.counts[Object.keys(question.counts)[0] ?? ''] ?? 0}`}
              </p>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => props.onOpen(question.question_id)}
                  disabled={!props.live || props.pending !== null}
                >
                  {question.receiving ? 'เปิดอยู่' : 'เปิดคำถาม'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => props.onClose(question.question_id)}
                  disabled={!props.live || props.pending !== null || !question.receiving}
                >
                  ปิดรับคำตอบ
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {props.snapshot ? (
        <button type="button" className="danger" onClick={props.onEnd} disabled={!props.live || props.pending !== null || props.snapshot.session_status === 'ended'}>
          จบกิจกรรม
        </button>
      ) : null}
    </main>
  );
}

export function AggregateChart(props: { question: QuestionAggregate }) {
  const entries =
    props.question.type === 'rating'
      ? ratingValues({
          id: props.question.question_id,
          seq: props.question.seq,
          type: 'rating',
          label: props.question.label,
          help_text: null,
          options: null,
          rating_min: props.question.rating_min,
          rating_max: props.question.rating_max,
          receiving: props.question.receiving,
          closed_at: props.question.closed_at,
        }).map((value) => [String(value), props.question.counts[String(value)] ?? 0] as const)
      : (props.question.options ?? []).map((option) => [option.label, props.question.counts[option.id] ?? 0] as const);
  const max = Math.max(1, ...entries.map(([, count]) => count));
  return (
    <ul className="chart">
      {entries.map(([label, count]) => (
        <li key={label}>
          <span className="bar-label">{label}</span>
          <span className="bar" style={{ width: `${Math.round((count / max) * 100)}%` }} aria-hidden="true" />
          <span className="bar-value">{count}</span>
        </li>
      ))}
    </ul>
  );
}
