use clap::{Args, Parser, Subcommand, ValueEnum};
use serde::Deserialize;
use std::{
    fs,
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process::ExitCode,
};
use transcript_redaction_gate::{EntropyOptions, Format, Options, Pattern, Receipt, redact};

#[derive(Parser)]
#[command(
    name = "trg",
    version,
    about = "Block secrets before a transcript crosses an external boundary",
    long_about = "Transcript Redaction Gate scans terminal text and JSONL entirely offline. It produces a redacted copy and a receipt that never includes matched values or file paths.\n\nExit codes: 0 success, 1 input/policy/output error, 2 check found sensitive content."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Write a safe transcript plus a non-sensitive findings receipt
    Redact(RedactArgs),
    /// Inspect without writing a redacted copy; exits 2 when findings exist
    Check(CheckArgs),
}

#[derive(Clone, Copy, ValueEnum)]
enum CliFormat {
    Auto,
    Text,
    Jsonl,
}

impl From<CliFormat> for Format {
    fn from(value: CliFormat) -> Self {
        match value {
            CliFormat::Auto => Self::Auto,
            CliFormat::Text => Self::Text,
            CliFormat::Jsonl => Self::Jsonl,
        }
    }
}

#[derive(Args)]
struct CommonArgs {
    /// Input transcript, or - for stdin
    #[arg(value_name = "INPUT")]
    input: PathBuf,
    /// Input representation; auto safely recognizes JSONL
    #[arg(long, value_enum, default_value_t = CliFormat::Auto)]
    format: CliFormat,
    /// JSON policy containing patterns and entropy controls
    #[arg(long, value_name = "FILE")]
    policy: Option<PathBuf>,
}

#[derive(Args)]
struct RedactArgs {
    #[command(flatten)]
    common: CommonArgs,
    /// Safe output path; defaults beside the input. Use - for stdout
    #[arg(short, long, value_name = "FILE")]
    output: Option<PathBuf>,
    /// Receipt path; defaults to <output>.receipt.json. Use - for stdout
    #[arg(long, value_name = "FILE")]
    receipt: Option<PathBuf>,
    /// Replace existing output files (never the input)
    #[arg(long)]
    force: bool,
    /// Suppress the human summary
    #[arg(long)]
    quiet: bool,
}

#[derive(Args)]
struct CheckArgs {
    #[command(flatten)]
    common: CommonArgs,
    /// Print the complete non-sensitive receipt instead of a human summary
    #[arg(long)]
    json: bool,
    /// Also save the receipt to this path
    #[arg(long, value_name = "FILE")]
    receipt: Option<PathBuf>,
}

#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
struct Policy {
    patterns: Vec<Pattern>,
    entropy: EntropyOptions,
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(code) => code,
        Err(message) => {
            eprintln!("trg: {message}");
            ExitCode::from(1)
        }
    }
}

fn run(cli: Cli) -> Result<ExitCode, String> {
    match cli.command {
        Command::Redact(args) => run_redact(args),
        Command::Check(args) => run_check(args),
    }
}

fn run_redact(args: RedactArgs) -> Result<ExitCode, String> {
    let input = read_input(&args.common.input)?;
    let options = load_options(&args.common)?;
    let result = redact(&input, &options).map_err(|error| error.to_string())?;
    let output = args
        .output
        .unwrap_or_else(|| default_output(&args.common.input));
    let receipt = args.receipt.unwrap_or_else(|| default_receipt(&output));

    ensure_distinct(&args.common.input, &output)?;
    if receipt != Path::new("-") {
        ensure_distinct(&args.common.input, &receipt)?;
    }
    if output == receipt {
        return Err("output and receipt must use different paths".into());
    }

    write_body(&output, result.output.as_bytes(), args.force)?;
    write_receipt(&receipt, &result.receipt, args.force)?;
    if !args.quiet {
        eprintln!(
            "{} finding(s) redacted; receipt is safe to share",
            result.receipt.finding_count
        );
    }
    Ok(ExitCode::SUCCESS)
}

fn run_check(args: CheckArgs) -> Result<ExitCode, String> {
    let input = read_input(&args.common.input)?;
    let options = load_options(&args.common)?;
    let result = redact(&input, &options).map_err(|error| error.to_string())?;
    if let Some(path) = args.receipt {
        ensure_distinct(&args.common.input, &path)?;
        write_receipt(&path, &result.receipt, false)?;
    }
    if args.json {
        print_receipt(&result.receipt)?;
    } else if result.receipt.blocked {
        println!(
            "BLOCKED — {} finding(s) across {} detector(s)",
            result.receipt.finding_count,
            result.receipt.detectors.len()
        );
    } else {
        println!("PASS — no configured sensitive patterns detected");
    }
    Ok(if result.receipt.blocked {
        ExitCode::from(2)
    } else {
        ExitCode::SUCCESS
    })
}

fn load_options(args: &CommonArgs) -> Result<Options, String> {
    let policy = match &args.policy {
        Some(path) => {
            let body = fs::read_to_string(path)
                .map_err(|error| format!("could not read policy: {error}"))?;
            serde_json::from_str::<Policy>(&body)
                .map_err(|error| format!("invalid policy JSON: {error}"))?
        }
        None => Policy::default(),
    };
    Ok(Options {
        format: args.format.into(),
        patterns: policy.patterns,
        entropy: policy.entropy,
    })
}

fn read_input(path: &Path) -> Result<String, String> {
    if path == Path::new("-") {
        let mut body = String::new();
        io::stdin()
            .read_to_string(&mut body)
            .map_err(|error| format!("could not read stdin: {error}"))?;
        Ok(body)
    } else {
        fs::read_to_string(path).map_err(|error| format!("could not read input: {error}"))
    }
}

fn default_output(input: &Path) -> PathBuf {
    if input == Path::new("-") {
        return PathBuf::from("-");
    }
    let stem = input
        .file_stem()
        .and_then(|part| part.to_str())
        .unwrap_or("transcript");
    let extension = input.extension().and_then(|part| part.to_str());
    let name = extension.map_or_else(
        || format!("{stem}.redacted"),
        |ext| format!("{stem}.redacted.{ext}"),
    );
    input.with_file_name(name)
}

fn default_receipt(output: &Path) -> PathBuf {
    if output == Path::new("-") {
        PathBuf::from("transcript.receipt.json")
    } else {
        PathBuf::from(format!("{}.receipt.json", output.display()))
    }
}

fn ensure_distinct(input: &Path, output: &Path) -> Result<(), String> {
    if input == Path::new("-") || output == Path::new("-") {
        return Ok(());
    }
    let input_abs = absolute(input)?;
    let output_abs = absolute(output)?;
    if input_abs == output_abs {
        Err("refusing to overwrite the input transcript".into())
    } else {
        Ok(())
    }
}

fn absolute(path: &Path) -> Result<PathBuf, String> {
    if path.is_absolute() {
        Ok(path.to_path_buf())
    } else {
        std::env::current_dir()
            .map(|dir| dir.join(path))
            .map_err(|error| error.to_string())
    }
}

fn write_body(path: &Path, body: &[u8], force: bool) -> Result<(), String> {
    if path == Path::new("-") {
        io::stdout()
            .write_all(body)
            .map_err(|error| format!("could not write stdout: {error}"))
    } else {
        write_new(path, body, force)
            .map_err(|error| format!("could not write redacted output: {error}"))
    }
}

fn write_receipt(path: &Path, receipt: &Receipt, force: bool) -> Result<(), String> {
    let mut body = serde_json::to_vec_pretty(receipt).map_err(|error| error.to_string())?;
    body.push(b'\n');
    if path == Path::new("-") {
        io::stdout()
            .write_all(&body)
            .map_err(|error| format!("could not write receipt: {error}"))
    } else {
        write_new(path, &body, force).map_err(|error| format!("could not write receipt: {error}"))
    }
}

fn print_receipt(receipt: &Receipt) -> Result<(), String> {
    serde_json::to_writer_pretty(io::stdout(), receipt).map_err(|error| error.to_string())?;
    println!();
    Ok(())
}

fn write_new(path: &Path, body: &[u8], force: bool) -> io::Result<()> {
    use std::fs::OpenOptions;
    let mut options = OpenOptions::new();
    options.write(true);
    if force {
        options.create(true).truncate(true);
    } else {
        options.create_new(true);
    }
    let mut file = options.open(path)?;
    file.write_all(body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derives_safe_output_names() {
        assert_eq!(
            default_output(Path::new("agent.jsonl")),
            PathBuf::from("agent.redacted.jsonl")
        );
        assert_eq!(
            default_output(Path::new("session")),
            PathBuf::from("session.redacted")
        );
    }

    #[test]
    fn refuses_same_input_and_output() {
        assert!(ensure_distinct(Path::new("x.log"), Path::new("./x.log")).is_err());
    }
}
