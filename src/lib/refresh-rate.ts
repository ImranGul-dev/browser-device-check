export type RefreshEstimate = {
  hz: number;
  medianInterval: number;
  jitter: number;
  longFrames: number;
  sampleCount: number;
};

export function estimateRefreshRate(timestamps: number[]): RefreshEstimate | null {
  if (timestamps.length < 20) return null;
  const intervals = timestamps.slice(1).map((time, index) => time - timestamps[index]!).filter((value) => value > 0 && value < 250);
  if (intervals.length < 15) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const deviations = intervals.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
  const medianDeviation = deviations[Math.floor(deviations.length / 2)]!;
  return {
    hz: Math.round((1000 / median) * 10) / 10,
    medianInterval: Math.round(median * 100) / 100,
    jitter: Math.round(medianDeviation * 100) / 100,
    longFrames: intervals.filter((value) => value > median * 1.5).length,
    sampleCount: intervals.length,
  };
}
