# Demo sandbox

- Browser URL: `/demo/`; the first-screen **Try it with sample data** link opens it.
- CLI command: `trg demo`.
- Sample: `examples/support-session.log` contains a support export retry with a bearer token and customer reference.
- Browser storage: the demo uses only the `demo:trg:` session-storage namespace for a sample-mode marker. It never reads or writes real-data keys. **Reset demo** clears that namespace and restores the bundled sample. **Start for real** returns home.
- CLI isolation: `trg demo` creates a fresh `trg-demo-<pid>` directory under the operating system temporary directory, writes the bundled sample there, and prints the redacted transcript and receipt paths.
