export abstract class TransactionManager {
  /** Runs work atomically; nested calls join the outer transaction. */
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
