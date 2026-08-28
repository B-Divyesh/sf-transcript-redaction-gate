export type Finding = {
  detector: string;
  line: number;
  column: number;
  length: number;
};

export type BrowserReceipt = {
  schema: "trg.browser-receipt/v1";
  engine_version: "browser-demo-0.1.0";
  blocked: boolean;
  finding_count: number;
  detectors: Record<string, number>;
  findings: Finding[];
};

type Hit = { start: number; end: number; detector: string };

const detectors: Array<[string, RegExp]> = [
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["github-token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b|\bgithub_pat_[A-Za-z0-9_]{22,255}\b/g],
  ["google-api-key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["jwt", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["authorization", /(?<=\b(?:bearer|basic)\s+)[A-Za-z0-9._~+/=-]{12,}/gi],
  ["secret-assignment", /(?<=(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret|token)\s*[:=]\s*["']?)[A-Za-z0-9._~+/@$%=-]{8,}/gi]
];

function lineColumn(input: string, offset: number): [number, number] {
  const prefix = input.slice(0, offset);
  const pieces = prefix.split("\n");
  return [pieces.length, pieces.at(-1)!.length + 1];
}

export function redactInBrowser(input: string, pattern = ""): { output: string; receipt: BrowserReceipt } {
  const hits: Hit[] = [];
  for (const [detector, expression] of detectors) {
    expression.lastIndex = 0;
    for (const match of input.matchAll(expression)) {
      hits.push({ start: match.index, end: match.index + match[0].length, detector });
    }
  }
  if (pattern.trim()) {
    let policy: RegExp;
    try {
      policy = new RegExp(pattern, "g");
    } catch {
      throw new Error("That advisory pattern is not valid. Check its brackets and escapes, then try again.");
    }
    for (const match of input.matchAll(policy)) {
      if (match[0]) hits.push({ start: match.index, end: match.index + match[0].length, detector: "policy:demo-pattern" });
    }
  }

  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted: Hit[] = [];
  for (const hit of hits) {
    if (!accepted.length || hit.start >= accepted.at(-1)!.end) accepted.push(hit);
  }
  let cursor = 0;
  let output = "";
  const detectorCounts: Record<string, number> = {};
  const findings = accepted.map((hit) => {
    output += input.slice(cursor, hit.start) + `[REDACTED:${hit.detector}]`;
    cursor = hit.end;
    detectorCounts[hit.detector] = (detectorCounts[hit.detector] ?? 0) + 1;
    const [line, column] = lineColumn(input, hit.start);
    return { detector: hit.detector, line, column, length: hit.end - hit.start };
  });
  output += input.slice(cursor);
  return {
    output,
    receipt: {
      schema: "trg.browser-receipt/v1",
      engine_version: "browser-demo-0.1.0",
      blocked: findings.length > 0,
      finding_count: findings.length,
      detectors: detectorCounts,
      findings
    }
  };
}
