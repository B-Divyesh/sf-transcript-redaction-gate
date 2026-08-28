//! Deterministic, offline transcript redaction.
//!
//! ```
//! use transcript_redaction_gate::{redact, Options};
//!
//! let result = redact("Authorization: Bearer demo_token_value_1234567890", &Options::default())?;
//! assert!(!result.output.contains("demo_token_value"));
//! assert_eq!(result.receipt.findings.len(), 1);
//! # Ok::<(), transcript_redaction_gate::Error>(())
//! ```

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, fmt};

const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Accepted transcript representation.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    #[default]
    Auto,
    Text,
    Jsonl,
}

/// A project-specific regular expression. The full match is redacted.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    pub name: String,
    pub regex: String,
}

/// Shannon entropy detector controls.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct EntropyOptions {
    pub enabled: bool,
    pub min_length: usize,
    pub threshold: f64,
}

impl Default for EntropyOptions {
    fn default() -> Self {
        Self {
            enabled: true,
            min_length: 24,
            threshold: 4.2,
        }
    }
}

/// Redaction options used by both the library and CLI.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Options {
    pub format: Format,
    pub patterns: Vec<Pattern>,
    pub entropy: EntropyOptions,
}

/// A non-sensitive description of one redaction.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Finding {
    pub detector: String,
    pub line: usize,
    pub column: usize,
    pub length: usize,
}

/// Safe-to-share proof of what the gate did.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Receipt {
    pub schema: String,
    pub engine_version: String,
    pub format: Format,
    pub blocked: bool,
    pub finding_count: usize,
    pub detectors: BTreeMap<String, usize>,
    pub findings: Vec<Finding>,
}

/// Redacted text and its receipt.
#[derive(Debug, Clone)]
pub struct RedactionResult {
    pub output: String,
    pub receipt: Receipt,
}

#[derive(Debug)]
pub enum Error {
    InvalidPattern { name: String, message: String },
    InvalidJsonl { line: usize, message: String },
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidPattern { name, message } => {
                write!(f, "invalid pattern {name:?}: {message}")
            }
            Self::InvalidJsonl { line, message } => {
                write!(f, "invalid JSONL on line {line}: {message}")
            }
        }
    }
}

impl std::error::Error for Error {}

#[derive(Debug)]
struct Match {
    start: usize,
    end: usize,
    detector: String,
}

struct Detector {
    name: &'static str,
    regex: Regex,
    secret_group: Option<&'static str>,
}

fn builtins() -> Vec<Detector> {
    vec![
        Detector { name: "private-key", regex: Regex::new(r"(?s)-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----.*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----").unwrap(), secret_group: None },
        Detector { name: "aws-access-key", regex: Regex::new(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b").unwrap(), secret_group: None },
        Detector { name: "github-token", regex: Regex::new(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b|\bgithub_pat_[A-Za-z0-9_]{22,255}\b").unwrap(), secret_group: None },
        Detector { name: "slack-token", regex: Regex::new(r"\bxox[baprs]-[A-Za-z0-9-]{10,200}\b").unwrap(), secret_group: None },
        Detector { name: "google-api-key", regex: Regex::new(r"\bAIza[0-9A-Za-z_-]{35}\b").unwrap(), secret_group: None },
        Detector { name: "jwt", regex: Regex::new(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b").unwrap(), secret_group: None },
        Detector { name: "authorization", regex: Regex::new(r#"(?i)(?:authorization\s*[:=]\s*|--header\s+['"]?authorization:\s*)(?:bearer|basic)\s+(?P<secret>[A-Za-z0-9._~+/=-]{12,})"#).unwrap(), secret_group: Some("secret") },
        Detector { name: "secret-assignment", regex: Regex::new(r#"(?i)(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret)\s*[:=]\s*["']?(?P<secret>[A-Za-z0-9._~+/@$%=-]{8,})"#).unwrap(), secret_group: Some("secret") },
        Detector { name: "database-url", regex: Regex::new(r"\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis)://[^\s:/]+:(?P<secret>[^\s@]{4,})@").unwrap(), secret_group: Some("secret") },
    ]
}

/// Redact sensitive spans without network access.
pub fn redact(input: &str, options: &Options) -> Result<RedactionResult, Error> {
    let format = resolve_format(input, options.format);
    if format == Format::Jsonl {
        validate_jsonl(input)?;
    }

    let mut matches = Vec::new();
    for detector in builtins() {
        for captures in detector.regex.captures_iter(input) {
            let hit = detector
                .secret_group
                .and_then(|name| captures.name(name))
                .or_else(|| captures.get(0))
                .expect("regex capture");
            matches.push(Match {
                start: hit.start(),
                end: hit.end(),
                detector: detector.name.into(),
            });
        }
    }

    for pattern in &options.patterns {
        validate_name(&pattern.name)?;
        let regex = Regex::new(&pattern.regex).map_err(|error| Error::InvalidPattern {
            name: pattern.name.clone(),
            message: error.to_string(),
        })?;
        for hit in regex.find_iter(input) {
            if !hit.is_empty() {
                matches.push(Match {
                    start: hit.start(),
                    end: hit.end(),
                    detector: format!("policy:{}", pattern.name),
                });
            }
        }
    }

    if options.entropy.enabled {
        let token_re = Regex::new(r"[A-Za-z0-9_+/.=-]{16,}").unwrap();
        for hit in token_re.find_iter(input) {
            let value = hit.as_str();
            if value.len() >= options.entropy.min_length
                && shannon_entropy(value) >= options.entropy.threshold
                && value.chars().any(|c| c.is_ascii_alphabetic())
                && value.chars().any(|c| c.is_ascii_digit())
            {
                matches.push(Match {
                    start: hit.start(),
                    end: hit.end(),
                    detector: "high-entropy".into(),
                });
            }
        }
    }

    matches.sort_by_key(|m| (m.start, std::cmp::Reverse(m.end - m.start)));
    let mut accepted: Vec<Match> = Vec::new();
    for candidate in matches {
        if accepted
            .last()
            .is_none_or(|prior| candidate.start >= prior.end)
        {
            accepted.push(candidate);
        }
    }

    let mut output = String::with_capacity(input.len());
    let mut cursor = 0;
    let mut findings = Vec::with_capacity(accepted.len());
    let mut detectors = BTreeMap::new();
    for hit in accepted {
        output.push_str(&input[cursor..hit.start]);
        output.push_str(&format!("[REDACTED:{}]", hit.detector));
        let (line, column) = line_column(input, hit.start);
        let value = &input[hit.start..hit.end];
        findings.push(Finding {
            detector: hit.detector.clone(),
            line,
            column,
            length: value.len(),
        });
        *detectors.entry(hit.detector).or_insert(0) += 1;
        cursor = hit.end;
    }
    output.push_str(&input[cursor..]);

    Ok(RedactionResult {
        receipt: Receipt {
            schema: "trg.receipt/v1".into(),
            engine_version: VERSION.into(),
            format,
            blocked: !findings.is_empty(),
            finding_count: findings.len(),
            detectors,
            findings,
        },
        output,
    })
}

fn validate_name(name: &str) -> Result<(), Error> {
    if !name.is_empty()
        && name.len() <= 48
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_'))
    {
        Ok(())
    } else {
        Err(Error::InvalidPattern {
            name: name.into(),
            message: "use 1–48 letters, digits, hyphens, or underscores".into(),
        })
    }
}

fn resolve_format(input: &str, requested: Format) -> Format {
    if requested != Format::Auto {
        return requested;
    }
    let non_empty: Vec<_> = input
        .lines()
        .filter(|line| !line.trim().is_empty())
        .take(8)
        .collect();
    if !non_empty.is_empty()
        && non_empty
            .iter()
            .all(|line| serde_json::from_str::<serde_json::Value>(line).is_ok())
    {
        Format::Jsonl
    } else {
        Format::Text
    }
}

fn validate_jsonl(input: &str) -> Result<(), Error> {
    for (index, line) in input.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        serde_json::from_str::<serde_json::Value>(line).map_err(|error| Error::InvalidJsonl {
            line: index + 1,
            message: error.to_string(),
        })?;
    }
    Ok(())
}

fn line_column(input: &str, offset: usize) -> (usize, usize) {
    let before = &input[..offset];
    let line = before.bytes().filter(|b| *b == b'\n').count() + 1;
    let column = before
        .rsplit_once('\n')
        .map_or(before.len(), |(_, tail)| tail.len())
        + 1;
    (line, column)
}

fn shannon_entropy(value: &str) -> f64 {
    let mut counts = [0usize; 256];
    for byte in value.bytes() {
        counts[byte as usize] += 1;
    }
    let len = value.len() as f64;
    counts
        .into_iter()
        .filter(|count| *count > 0)
        .map(|count| {
            let p = count as f64 / len;
            -p * p.log2()
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_documented_bearer_example() {
        let result = redact(
            "Authorization: Bearer demo_token_value_1234567890",
            &Options::default(),
        )
        .unwrap();
        assert_eq!(
            result.output,
            "Authorization: Bearer [REDACTED:authorization]"
        );
        assert_eq!(result.receipt.finding_count, 1);
        assert!(
            !serde_json::to_string(&result.receipt)
                .unwrap()
                .contains("demo_token")
        );
    }

    #[test]
    fn custom_policy_redacts_only_match() {
        let options = Options {
            patterns: vec![Pattern {
                name: "customer-id".into(),
                regex: r"CUST-[0-9]{8}".into(),
            }],
            ..Options::default()
        };
        let result = redact("customer=CUST-12345678 status=failed", &options).unwrap();
        assert_eq!(
            result.output,
            "customer=[REDACTED:policy:customer-id] status=failed"
        );
    }

    #[test]
    fn jsonl_is_validated_and_preserves_lines() {
        let options = Options {
            format: Format::Jsonl,
            ..Options::default()
        };
        let input =
            "{\"type\":\"info\",\"message\":\"ok\"}\n{\"token\":\"AKIAIOSFODNN7EXAMPLE\"}\n";
        let result = redact(input, &options).unwrap();
        assert_eq!(result.output.lines().count(), 2);
        assert!(result.output.contains("[REDACTED:aws-access-key]"));
        assert!(matches!(
            redact("{broken}", &options),
            Err(Error::InvalidJsonl { line: 1, .. })
        ));
    }

    #[test]
    fn entropy_detects_random_tokens_but_preserves_diagnostics() {
        let input =
            "build completed in 1325 milliseconds\nsession_id=9fK2mQ8xV7pL4nR6tY3wC1aZ0bD5eH7j\n";
        let result = redact(input, &Options::default()).unwrap();
        assert!(
            result
                .output
                .starts_with("build completed in 1325 milliseconds")
        );
        assert!(!result.output.contains("9fK2mQ8x"));
    }

    #[test]
    fn receipts_do_not_include_paths_or_values() {
        let result = redact("password=hunter1234", &Options::default()).unwrap();
        let receipt = serde_json::to_string(&result.receipt).unwrap();
        assert!(!receipt.contains("hunter1234"));
        assert!(!receipt.contains("path"));
    }

    #[test]
    fn seeded_200_item_corpus_meets_detection_and_preservation_target() {
        let mut corpus = String::new();
        for index in 0..50 {
            corpus.push_str(&format!("aws=AKIA{index:016X}\n"));
            corpus.push_str(&format!("github=ghp_{index:036}\n"));
            corpus.push_str(&format!("password=fakeSecret{index:04}AaBbCcDdEe\n"));
            corpus.push_str(&format!("customer=CUST-{index:08}\n"));
            corpus.push_str(&format!(
                "diagnostic-{index:03}: worker finished normally\n"
            ));
        }
        let options = Options {
            patterns: vec![Pattern {
                name: "customer-id".into(),
                regex: r"CUST-[0-9]{8}".into(),
            }],
            ..Options::default()
        };
        let result = redact(&corpus, &options).unwrap();
        assert_eq!(result.receipt.finding_count, 200);
        for index in 0..50 {
            assert!(
                result
                    .output
                    .contains(&format!("diagnostic-{index:03}: worker finished normally"))
            );
        }
    }
}
