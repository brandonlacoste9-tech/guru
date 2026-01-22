import crypto from 'crypto';

export class SolutionHasher {
  /**
   * Generates a stable hash for an error to look up cached solutions.
   * Focuses on the error message and the first few lines of the stack trace
   * to ignore transient data (like line numbers if the file changed slightly).
   */
  static hashError(error: Error): string {
    const message = error.message;
    const stack = error.stack || '';
    
    // Take the first 3 lines of the stack trace (usually the most relevant part of the call site)
    const relevantStack = stack.split('\n').slice(0, 3).join('\n');
    
    return crypto
      .createHash('sha256')
      .update(`${message}|${relevantStack}`)
      .digest('hex');
  }
}
