"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A playable shift, in real time. No questions anywhere in it.
//
// The two things the brief asked for are not the same measurement, and the
// design treats them separately:
//
//   FIT is what you reach for. Under load nobody has time to perform, so the
//   order things get handled is an honest read of what a person thinks matters
//   — the angry customer, the big account, or the quick win. That is a
//   disposition, not a score, and it is what makes one role suit somebody and
//   another grind them down.
//
//   POTENTIAL is the slope, not the height. The same loop runs three times
//   with more load each round. Round one measures experience, which an
//   eighteen-year-old does not have and cannot be blamed for. The gap between
//   round one and round three measures how fast they learn a job — which is
//   the only thing worth knowing about somebody with no track record, and the
//   thing no one-shot sitting can see.
//
// Real time is also, incidentally, the strongest AI defence we have looked at:
// there is no pause to consult anything, and the board is different every
// second. That is a side effect here rather than the point.

type Kind = {
  id: string;
  label: string;
  detail: string;
  /** What it costs the business to miss. */
  weight: number;
  /** Seconds before it walks. */
  patience: number;
  tint: string;
};

const KINDS: Kind[] = [
  {
    id: "shipment",
    label: "11 × delayed shipment",
    detail: "One has posted publicly",
    weight: 5,
    patience: 14,
    tint: "border-rose-300 bg-rose-50",
  },
  {
    id: "double",
    label: "Charged twice — ₹4,800",
    detail: "Rent due Wednesday",
    weight: 4,
    patience: 12,
    tint: "border-amber-300 bg-amber-50",
  },
  {
    id: "account",
    label: "Mehta Textiles — renewal",
    detail: "Largest account, ends in 3 weeks",
    weight: 5,
    patience: 22,
    tint: "border-teal-300 bg-teal-50",
  },
  {
    id: "angry",
    label: "“I'll leave a review”",
    detail: "₹300 order, arrived late",
    weight: 2,
    patience: 9,
    tint: "border-orange-300 bg-orange-50",
  },
  {
    id: "reset",
    label: "Password reset stuck",
    detail: "Locked out entirely",
    weight: 1,
    patience: 20,
    tint: "border-slate-300 bg-slate-50",
  },
];

type Item = {
  uid: number;
  kind: Kind;
  /** Seconds of patience left. */
  left: number;
  bornAt: number;
};

type RoundStat = {
  handledWeight: number;
  missedWeight: number;
  handled: number;
  missed: number;
  delegated: number;
  /** Sum of seconds an item waited before being handled. */
  waitTotal: number;
  firstKinds: string[];
};

const ROUNDS = 3;
const ROUND_SECONDS = 30;
const HANDLE_SECONDS = 2.4;
const SPAWN = [3.6, 2.8, 2.2]; // seconds between arrivals, per round
const DELEGATES_PER_ROUND = 2;
const TICK = 100;

function emptyStat(): RoundStat {
  return {
    handledWeight: 0,
    missedWeight: 0,
    handled: 0,
    missed: 0,
    delegated: 0,
    waitTotal: 0,
    firstKinds: [],
  };
}

export function ShiftGame() {
  const [phase, setPhase] = useState<"intro" | "play" | "between" | "done">(
    "intro",
  );
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<{ uid: number; left: number } | null>(null);
  const [delegates, setDelegates] = useState(DELEGATES_PER_ROUND);
  const [stats, setStats] = useState<RoundStat[]>([]);

  const stat = useRef<RoundStat>(emptyStat());
  const uid = useRef(0);
  const sinceSpawn = useRef(0);

  const spawn = useCallback(() => {
    const kind = KINDS[Math.floor((uid.current * 7919) % KINDS.length)];
    uid.current += 1;
    setItems((cur) =>
      cur.length >= 6
        ? cur
        : [
            ...cur,
            { uid: uid.current, kind, left: kind.patience, bornAt: Date.now() },
          ],
    );
  }, []);

  // One clock drives arrivals, patience, the handling bar and the round timer.
  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => {
      const dt = TICK / 1000;

      setTimeLeft((s) => {
        const next = s - dt;
        if (next <= 0) {
          setPhase((p) => (p === "play" ? "between" : p));
          return 0;
        }
        return next;
      });

      sinceSpawn.current += dt;
      if (sinceSpawn.current >= SPAWN[Math.min(round, SPAWN.length - 1)]) {
        sinceSpawn.current = 0;
        spawn();
      }

      setBusy((b) => {
        if (!b) return null;
        const left = b.left - dt;
        if (left > 0) return { ...b, left };
        // Finished handling: bank it.
        setItems((cur) => {
          const done = cur.find((i) => i.uid === b.uid);
          if (done) {
            stat.current.handled += 1;
            stat.current.handledWeight += done.kind.weight;
            stat.current.waitTotal += (Date.now() - done.bornAt) / 1000;
            if (stat.current.firstKinds.length < 3)
              stat.current.firstKinds.push(done.kind.id);
          }
          return cur.filter((i) => i.uid !== b.uid);
        });
        return null;
      });

      setItems((cur) => {
        const kept: Item[] = [];
        for (const i of cur) {
          const left = i.left - dt;
          if (left <= 0) {
            stat.current.missed += 1;
            stat.current.missedWeight += i.kind.weight;
          } else kept.push({ ...i, left });
        }
        return kept;
      });
    }, TICK);
    return () => clearInterval(t);
  }, [phase, round, spawn]);

  // Close the round out once.
  useEffect(() => {
    if (phase !== "between") return;
    setStats((s) => [...s, stat.current]);
    setItems([]);
    setBusy(null);
  }, [phase]);

  function startRound(n: number) {
    stat.current = emptyStat();
    uid.current = n * 100;
    sinceSpawn.current = 0;
    setRound(n);
    setItems([]);
    setBusy(null);
    setDelegates(DELEGATES_PER_ROUND);
    setTimeLeft(ROUND_SECONDS);
    setPhase("play");
  }

  function handle(item: Item) {
    if (busy) return;
    setBusy({ uid: item.uid, left: HANDLE_SECONDS });
  }

  function delegate(item: Item) {
    if (delegates <= 0) return;
    setDelegates((d) => d - 1);
    stat.current.delegated += 1;
    stat.current.handled += 1;
    // A buddy handles it, but not as well: half the value is banked.
    stat.current.handledWeight += item.kind.weight / 2;
    setItems((cur) => cur.filter((i) => i.uid !== item.uid));
    if (busy?.uid === item.uid) setBusy(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      {phase === "intro" && <Intro onStart={() => startRound(0)} />}

      {phase === "play" && (
        <>
          <Bar
            round={round}
            timeLeft={timeLeft}
            delegates={delegates}
            queue={items.length}
          />
          <div className="space-y-2 p-3 sm:p-4">
            {items.length === 0 && (
              <p className="py-8 text-center text-[0.82rem] text-slate-400">
                Quiet for a second…
              </p>
            )}
            {items.map((i) => (
              <Card
                key={i.uid}
                item={i}
                busy={busy?.uid === i.uid}
                busyLeft={busy?.uid === i.uid ? busy.left : 0}
                blocked={busy !== null && busy.uid !== i.uid}
                canDelegate={delegates > 0}
                onHandle={() => handle(i)}
                onDelegate={() => delegate(i)}
              />
            ))}
          </div>
        </>
      )}

      {phase === "between" && (
        <Between
          stats={stats}
          round={round}
          onNext={() =>
            round + 1 < ROUNDS ? startRound(round + 1) : setPhase("done")
          }
        />
      )}

      {phase === "done" && <Readout stats={stats} />}
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-brand-ink">
        Thirty seconds of a Monday. Three times.
      </h3>
      <ul className="mt-3 space-y-1.5 text-[0.85rem] leading-relaxed text-slate-700">
        <li>Things arrive faster than you can handle them. That is the job.</li>
        <li>One at a time — handling takes a couple of seconds.</li>
        <li>
          Two hand-offs to Priya per round. She is quicker, but it lands half as
          well.
        </li>
        <li>Anything you leave too long walks away.</li>
      </ul>
      <p className="mt-3 text-[0.82rem] text-slate-500">
        There is no score to chase. What is read is what you reach for, and
        whether round three goes better than round one.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-[0.88rem] font-semibold text-white"
      >
        Clock in
      </button>
    </div>
  );
}

function Bar({
  round,
  timeLeft,
  delegates,
  queue,
}: {
  round: number;
  timeLeft: number;
  delegates: number;
  queue: number;
}) {
  const pct = Math.max(0, (timeLeft / ROUND_SECONDS) * 100);
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
      <div className="flex items-center justify-between text-[0.72rem] font-semibold text-slate-600">
        <span>Round {round + 1} of {ROUNDS}</span>
        <span>
          {queue} waiting · {delegates} hand-off{delegates === 1 ? "" : "s"} left
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-ink transition-[width] duration-100 ease-linear motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Card({
  item,
  busy,
  busyLeft,
  blocked,
  canDelegate,
  onHandle,
  onDelegate,
}: {
  item: Item;
  busy: boolean;
  busyLeft: number;
  blocked: boolean;
  canDelegate: boolean;
  onHandle: () => void;
  onDelegate: () => void;
}) {
  const patience = Math.max(0, (item.left / item.kind.patience) * 100);
  return (
    <div className={`rounded-xl border-2 p-3 ${item.kind.tint}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.85rem] font-bold leading-snug text-brand-ink">
            {item.kind.label}
          </p>
          <p className="text-[0.75rem] leading-snug text-slate-600">
            {item.kind.detail}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
          {item.kind.weight}
        </span>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/70">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear motion-reduce:transition-none ${
            patience < 35 ? "bg-rose-500" : "bg-slate-500"
          }`}
          style={{ width: `${patience}%` }}
        />
      </div>

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onHandle}
          disabled={blocked || busy}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand-ink px-3 text-[0.8rem] font-semibold text-white disabled:opacity-30"
        >
          {busy ? `Handling… ${busyLeft.toFixed(1)}s` : "Handle"}
        </button>
        <button
          type="button"
          onClick={onDelegate}
          disabled={!canDelegate}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-3 text-[0.8rem] font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 disabled:opacity-30"
        >
          Priya
        </button>
      </div>
    </div>
  );
}

function Between({
  stats,
  round,
  onNext,
}: {
  stats: RoundStat[];
  round: number;
  onNext: () => void;
}) {
  const s = stats[round];
  if (!s) return null;
  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-brand-ink">
        End of round {round + 1}
      </h3>
      <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-700">
        You got to {s.handled}. {s.missed > 0
          ? `${s.missed} walked away.`
          : "Nothing walked away."}
      </p>
      {s.delegated > 0 && (
        <p className="mt-1 text-[0.84rem] text-slate-600">
          Priya took {s.delegated}.
        </p>
      )}
      <button
        type="button"
        onClick={onNext}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-[0.88rem] font-semibold text-white"
      >
        {round + 1 < ROUNDS ? "Next round — it gets busier" : "See your shift"}
      </button>
    </div>
  );
}

function Readout({ stats }: { stats: RoundStat[] }) {
  const first = stats[0]?.handledWeight ?? 0;
  const last = stats[stats.length - 1]?.handledWeight ?? 0;
  const slope = last - first;
  const totalDelegated = stats.reduce((n, s) => n + s.delegated, 0);
  const allFirst = stats.flatMap((s) => s.firstKinds);
  const lean =
    allFirst.length === 0
      ? null
      : KINDS.find(
          (k) =>
            k.id ===
            allFirst
              .slice()
              .sort(
                (a, b) =>
                  allFirst.filter((x) => x === b).length -
                  allFirst.filter((x) => x === a).length,
              )[0],
        );

  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-display text-xl font-bold text-brand-ink">
        Your shift
      </h3>
      <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-600">
        No mark. Two readings — one about what suits you, one about how fast you
        pick things up.
      </p>

      <div className="mt-4 rounded-xl border-2 border-brand-teal/30 bg-teal-50/40 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-teal-900">
          Potential · the slope
        </p>
        <div className="mt-2 flex items-end gap-2">
          {stats.map((s, i) => {
            const max = Math.max(...stats.map((x) => x.handledWeight), 1);
            return (
              <div key={i} className="flex-1 text-center">
                <div
                  className="mx-auto w-full rounded-t bg-brand-teal"
                  style={{
                    height: `${Math.max(6, (s.handledWeight / max) * 64)}px`,
                  }}
                />
                <p className="mt-1 text-[0.65rem] text-slate-500">R{i + 1}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 text-[0.84rem] leading-relaxed text-slate-800">
          {slope > 0
            ? `You handled more by the last round than the first, with more coming at you. That gap is the part worth showing an employer — it is how fast you learn a job, not how much you already knew.`
            : slope === 0
              ? `You held steady as the load rose, which is its own answer: the pace did not break you.`
              : `Round three went worse than round one. Common, and honest — this is where load starts to tell, and it is a thing to practise rather than a verdict.`}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">
          Fit · what you reached for
        </p>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-slate-800">
          {lean
            ? `Under pressure you went for “${lean.label}” first, more than anything else. Nobody has time to perform at this speed, so that is a fair read of what you think matters — and it is the sort of instinct that makes one role sit right and another wear you down.`
            : "Not enough handled to read an instinct yet. Worth another go."}
        </p>
        {totalDelegated > 0 ? (
          <p className="mt-2 text-[0.84rem] leading-relaxed text-slate-800">
            You handed {totalDelegated} to Priya. Knowing what to pass on is a
            skill in itself, and it is the one most people take longest to learn.
          </p>
        ) : (
          <p className="mt-2 text-[0.84rem] leading-relaxed text-slate-800">
            You never handed anything to Priya. Worth noticing — the offer was
            there, and taking help is not the same as needing it.
          </p>
        )}
      </div>
    </div>
  );
}
