# lib/logging

Reserved for structured application logging (ASCEND-ENG-015 §5, §13).

Target: logs carrying request, user, attempt, job and model identifiers so a
failed submission or AI job can be traced end to end. Today the codebase uses
plain `console.error` / `console.warn`.
