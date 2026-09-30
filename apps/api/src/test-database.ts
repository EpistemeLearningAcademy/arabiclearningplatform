export function assertDisposableTestDatabase(connectionString: string): void {
  if (process.env.GREENFIELD_DISPOSABLE_DATABASE !== "1") {
    throw new Error("Set GREENFIELD_DISPOSABLE_DATABASE=1 only when using a disposable test database.");
  }

  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  if ((url.hostname !== "localhost" && url.hostname !== "127.0.0.1") || !/^greenfield_test_[a-z0-9_]+$/.test(databaseName)) {
    throw new Error("Database integration tests require a localhost database named greenfield_test_*.");
  }
}