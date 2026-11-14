// Read-only aggregate snapshot queried from the actual VDO-X Supabase project on 2026-11-14.
// No user IDs, prompts, messages, payment rows, URLs, or secrets are included here.
window.VDOX_SNAPSHOT = {
  source: 'Supabase · videos + daily_metrics',
  retrieved_at: '2026-11-14',
  window: { from: '2026-11-07', through: '2026-11-13' },
  finding: {
    title: 'Image-to-video failures spiked on Nov 8.',
    sentence: 'On Nov 8, vivix-ai / vivix-w1-fast-i2v failed 41 of 49 recorded runs (83.7%). Across the next five days, the same route failed 13 of 84 (15.5%). That is 5.4× the later rate; it coincided with the provider label changing from vivix to vivix-ai.',
    caveat: 'This is a historical association, not proof that the provider change caused the spike. The failure rate fell over the next five days.',
    references: [
      'videos · Nov 8 · provider=vivix-ai · model=vivix-w1-fast-i2v · 41 failed / 49 total',
      'videos · Nov 9–13 · same provider/model · 13 failed / 84 total',
      'videos · Nov 7 · provider=vivix · same model · 0 failed / 19 total',
    ],
  },
  decision: {
    title: 'Review the Nov 8 route change; keep today’s route unless the spike returns.',
    sentence: 'Compare provider health, routing/config changes, and error classes for Nov 8 against Nov 9–13. If the failure rate rises again, run a controlled fallback test and compare completion rate and credits refunded before switching traffic.',
    measure: 'Failure rate · completion rate · refunded credits',
  },
  metric_reconciliation: {
    daily_metrics: { started: 562, completed: 429, failed: 133 },
    videos_rows: { total: 550, completed: 424, failed: 126 },
    note: 'The aggregate counters differ by 12 starts, 5 completions, and 7 failures over the same seven-day window. Confirm whether retries or tracking definitions explain the gap before using these tables as one funnel.',
  },
  behavior: {
    event_rows: 4708,
    sessions: 1342,
    transitions: { fail_then_start: 73, complete_then_start: 278 },
    missing: ['pricing plan exposure', 'plan selection', 'credit balance', 'paywall view/dismiss', 'checkout/purchase outcome'],
  },
};
