"use client";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function ScoreBar({ label, score, maxScore = 10 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="group flex items-center gap-4 py-1.5 hover:bg-zinc-50/50 -mx-2 px-2 rounded-lg transition-premium">
      <span className="text-[12px] text-zinc-500 w-[160px] shrink-0">{label}</span>
      <div className="flex-1 h-[6px] bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full score-bar bg-[#6C2BD9]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[13px] font-semibold w-10 text-right tabular-nums text-zinc-900">
        {score}<span className="text-zinc-300 font-normal">/10</span>
      </span>
    </div>
  );
}

interface ScoreCircleProps {
  score: number;
  size?: number;
}

export function ScoreCircle({ score, size = 110 }: ScoreCircleProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6C2BD9"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold text-zinc-900 tabular-nums tracking-tight">{score}</span>
        <span className="text-[10px] text-zinc-300 -mt-1">/10</span>
      </div>
    </div>
  );
}
