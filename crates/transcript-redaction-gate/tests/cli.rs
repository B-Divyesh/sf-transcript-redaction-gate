use std::{fs, process::Command};
use tempfile::tempdir;

fn trg() -> Command {
    Command::new(env!("CARGO_BIN_EXE_trg"))
}

#[test]
fn check_returns_two_and_json_receipt() {
    let dir = tempdir().unwrap();
    let input = dir.path().join("transcript.log");
    fs::write(&input, "token=gl7Qx9Wm2Kp8Vr5Nt3Ys6Bc4Df1Hj0La\n").unwrap();
    let output = trg()
        .args(["check", input.to_str().unwrap(), "--json"])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(2));
    let body = String::from_utf8(output.stdout).unwrap();
    assert!(body.contains("\"blocked\": true"));
    assert!(!body.contains("gl7Qx9"));
}

#[test]
fn redact_writes_copy_and_receipt_without_leaking_value() {
    let dir = tempdir().unwrap();
    let input = dir.path().join("session.log");
    let safe = dir.path().join("session.safe.log");
    let receipt = dir.path().join("receipt.json");
    fs::write(
        &input,
        "Authorization: Bearer this_is_a_demo_token_1234567890\nnext line stays\n",
    )
    .unwrap();
    let output = trg()
        .args([
            "redact",
            input.to_str().unwrap(),
            "--output",
            safe.to_str().unwrap(),
            "--receipt",
            receipt.to_str().unwrap(),
        ])
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        fs::read_to_string(&safe)
            .unwrap()
            .contains("[REDACTED:authorization]")
    );
    assert!(
        fs::read_to_string(&safe)
            .unwrap()
            .contains("next line stays")
    );
    assert!(
        !fs::read_to_string(&receipt)
            .unwrap()
            .contains("this_is_a_demo")
    );
}

#[test]
fn invalid_jsonl_fails_closed() {
    let dir = tempdir().unwrap();
    let input = dir.path().join("broken.jsonl");
    fs::write(&input, "{not-json}\n").unwrap();
    let output = trg()
        .args(["check", input.to_str().unwrap(), "--format", "jsonl"])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(1));
    assert!(
        String::from_utf8(output.stderr)
            .unwrap()
            .contains("invalid JSONL on line 1")
    );
}

#[test]
fn claim_cli_demo_writes_bundled_sample_in_a_temporary_directory() {
    let output = trg().arg("demo").output().unwrap();
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("Demo redacted 2 finding(s)."));
    let receipt_line = stdout
        .lines()
        .find(|line| line.starts_with("Receipt: "))
        .unwrap();
    let receipt = receipt_line.trim_start_matches("Receipt: ");
    let receipt_body = fs::read_to_string(receipt).unwrap();
    assert!(receipt_body.contains("authorization"));
    assert!(!receipt_body.contains("demo_token_value"));
}
