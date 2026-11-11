import type { Outcome } from './state.ts';
import type { Question, QuestionAggregate, OwnResponse, Snapshot, HrQuestionSummary, HrSummary } from './api.ts';

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

export type HrViewState = 'loading' | 'unauthorized' | 'not_ended' | 'error' | 'ready';

function coverageText(question: HrQuestionSummary): string {
  if (question.joined_base <= 0) return `ตอบ ${question.n} คน (ยังไม่ทราบจำนวนผู้เข้าร่วม)`;
  const percent =
    question.coverage_ratio === null ? null : Math.round(question.coverage_ratio * 1000) / 10;
  return `ตอบ ${question.n} จาก ${question.joined_base} คน · ไม่ตอบ ${question.unanswered} คน${
    percent === null ? '' : ` · ความครอบคลุม ${percent}%`
  }`;
}

export function HrSummaryView(props: {
  hasToken: boolean;
  token: string;
  state: HrViewState;
  summary: HrSummary | null;
  errorMessage: string | null;
  pending: boolean;
  onToken: (value: string) => void;
  onOpen: () => void;
}) {
  const summary = props.summary;
  const allEmpty = summary !== null && summary.questions.every((question) => question.n === 0);
  return (
    <main className="screen hr-screen">
      <header className="hr-header">
        <h1>สรุปผลหลังจบกิจกรรม (HR)</h1>
        <p className="hint">อ่านได้เฉพาะผู้มีสิทธิ์ HR ของกิจกรรมนี้ · ข้อมูลรวมเท่านั้น</p>
      </header>

      {!props.hasToken ? (
        <section className="card" aria-label="เข้าถึงสรุปผล HR">
          <label htmlFor="hr-token">โทเค็น HR (เฉพาะเครื่องนี้)</label>
          <input
            id="hr-token"
            type="password"
            value={props.token}
            autoComplete="off"
            onChange={(event) => props.onToken(event.target.value)}
          />
          <button type="button" onClick={props.onOpen} disabled={props.pending || props.token.trim().length === 0}>
            {props.pending ? 'กำลังเปิด…' : 'เปิดสรุปผล'}
          </button>
          <p className="hint">
            วางโทเค็นที่สร้างจากเครื่องนี้ในช่องนี้เท่านั้น ไม่ต้องใส่ใน URL และไม่ควรแสดงบนหน้าจอขณะบันทึกวิดีโอ
          </p>
        </section>
      ) : null}

      {props.hasToken && props.state === 'loading' ? (
        <section className="card" aria-live="polite">
          <p>กำลังโหลดสรุปผล…</p>
        </section>
      ) : null}
      {props.state === 'unauthorized' ? (
        <section className="card" role="alert">
          <p className="error">โทเค็นไม่ถูกต้อง หมดอายุ หรือถูกเพิกถอน</p>
          <p className="hint">ตรวจสิทธิ์ HR ของกิจกรรมนี้กับผู้ดูแลระบบในเครื่อง</p>
        </section>
      ) : null}
      {props.state === 'not_ended' ? (
        <section className="card" role="status">
          <p className="notice">กิจกรรมนี้ยังไม่จบ — สรุปผลจะแสดงหลังจบกิจกรรม</p>
        </section>
      ) : null}
      {props.state === 'error' ? (
        <section className="card" role="alert">
          <p className="error">โหลดสรุปผลไม่สำเร็จ{props.errorMessage ? `: ${props.errorMessage}` : ''}</p>
          <p className="hint">การเชื่อมต่อขัดข้องไม่ใช่ข้อมูลศูนย์ กรุณาลองใหม่</p>
        </section>
      ) : null}

      {props.state === 'ready' && summary ? (
        <>
          <section className="card hr-meta" aria-label="ข้อมูลกิจกรรม">
            <p>
              ผู้เข้าร่วมที่เข้าร่วมทั้งหมด <strong>{summary.session.joined_base}</strong> คน · คำถาม{' '}
              <strong>{summary.session.question_count}</strong> ข้อ
            </p>
            {summary.session.ended_at ? (
              <p className="hint">จบกิจกรรมเมื่อ {new Date(summary.session.ended_at).toLocaleString('th-TH')}</p>
            ) : null}
            {allEmpty ? (
              <p className="notice" role="status">
                ยังไม่มีคำตอบในกิจกรรมนี้ — แสดงจำนวนผู้เข้าร่วมโดยไม่สร้างค่าเฉลี่ยหรือข้อมูลสมมติ
              </p>
            ) : null}
          </section>

          {summary.questions.map((question) => {
            const isRating = question.type === 'rating';
            const ratingValues = isRating
              ? Array.from(
                  { length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 },
                  (_, index) => String((question.rating_min ?? 1) + index),
                )
              : (question.options ?? []).map((option) => option.id);
            return (
              <section className="card hr-question" key={question.id} aria-label={`คำถามข้อ ${question.seq}`}>
                <p className="eyebrow">ข้อ {String(question.seq).padStart(2, '0')}</p>
                <h2>{question.label}</h2>
                {question.help_text ? <p className="hint">{question.help_text}</p> : null}
                <p className="hr-coverage">{coverageText(question)}</p>
                {question.n === 0 ? (
                  <p className="notice" role="status">
                    ยังไม่มีคำตอบสำหรับข้อนี้ — ไม่แสดงค่าเฉลี่ยหรือร้อยละ
                  </p>
                ) : (
                  <>
                    <table className="hr-table">
                      <caption>{isRating ? 'จำนวนผู้เลือกแต่ละระดับ' : 'จำนวนผู้เลือกแต่ละตัวเลือก'}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{isRating ? 'ระดับ' : 'ตัวเลือก'}</th>
                          <th scope="col">จำนวน</th>
                          <th scope="col">ร้อยละของผู้ตอบข้อนี้</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratingValues.map((value) => {
                          const count = question.counts[value] ?? 0;
                          const label = isRating
                            ? value === String(question.rating_min)
                              ? `${value} ยังไม่มั่นใจ`
                              : value === String(question.rating_max)
                                ? `${value} มั่นใจมาก`
                                : value
                            : (question.options ?? []).find((option) => option.id === value)?.label ?? value;
                          const percent = Math.round((count / question.n) * 1000) / 10;
                          return (
                            <tr key={value}>
                              <th scope="row">{label}</th>
                              <td>{count}</td>
                              <td>
                                {percent}% <span className="hint">(n={question.n})</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {isRating && question.mean !== null ? (
                      <p>
                        ค่าเฉลี่ยคำตอบ: <strong>{question.mean}</strong> <span className="hint">จากผู้ตอบ n={question.n}</span>
                      </p>
                    ) : null}
                  </>
                )}
                <p className="hint">
                  ความคิดเห็นที่ให้: {question.comment_count} ข้อความ (ไม่แสดงเนื้อหาและไม่นับเป็นคำตอบที่ขาด)
                </p>
              </section>
            );
          })}

          <section className="card hr-insights" aria-label="ข้อสรุปจากผลรวม">
            <h2>ข้อสรุปจากผลรวม</h2>
            {summary.insights.feedback_confidence ? (
              <p>
                <strong>ความมั่นใจในการให้ feedback:</strong> {summary.insights.feedback_confidence}
              </p>
            ) : (
              <p className="hint">ยังไม่มีคำตอบเพียงพอสำหรับข้อสรุปด้านความมั่นใจ</p>
            )}
            {summary.insights.reported_blockers.length > 0 ? (
              <div>
                <p>
                  <strong>อุปสรรคที่ถูกรายงาน:</strong>
                </p>
                <ul>
                  {summary.insights.reported_blockers.map((blocker) => (
                    <li key={blocker.option_id}>
                      {blocker.label} — {blocker.count} คน
                      {blocker.share === null ? '' : ` (${Math.round(blocker.share * 1000) / 10}% ของผู้ตอบ n=${summary.questions.find((q) => q.type === 'poll')?.n ?? 0})`}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="hint">ยังไม่มีคำตอบเพียงพอสำหรับข้อสรุปด้านอุปสรรค</p>
            )}
          </section>

          <section className="card hr-caveats" aria-label="ข้อควรระวังในการตีความ">
            <h2>ข้อควรระวังในการตีความ</h2>
            <ul>
              {summary.caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
            <p className="hint">
              ตัวเลขทั้งหมดอ้างอิงคำตอบที่บันทึกจริงในฐานข้อมูล ไม่ได้ปรับให้ครบตามเป้าหมายจำนวนผู้เข้าร่วม
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
