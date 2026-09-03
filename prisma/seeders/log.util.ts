const startTimes = new Map<string, number>();

export function logSection(title: string) {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(40));
}

export function logStart(label: string) {
  startTimes.set(label, Date.now());
}

export function logDone(label: string, detail: string) {
  const elapsed = startTimes.has(label) ? Date.now() - startTimes.get(label)! : 0;
  console.log(`  ✓ ${detail}${elapsed > 0 ? ` (${elapsed}ms)` : ''}`);
}

export function logSummary(title: string, totalElapsedMs: number) {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  ${title}`);
  console.log(`  ⏳ Completed in ${(totalElapsedMs / 1000).toFixed(1)}s`);
  console.log('─'.repeat(40) + '\n');
}