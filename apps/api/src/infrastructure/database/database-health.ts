export abstract class DatabaseHealth {
  abstract ping(): Promise<boolean>;
}
