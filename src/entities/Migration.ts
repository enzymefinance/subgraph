import { MigrationSignaled } from '../generated/DispatcherContract';
import { Migration } from '../generated/schema';
import { logCritical } from '../utils/logCritical';
import { useFund } from './Fund';
import { ensureRelease } from './Release';

export function useMigration(id: string): Migration {
  let migration = Migration.load(id) as Migration;
  if (migration == null) {
    logCritical('Failed to load migration {}.', [id]);
  }

  return migration;
}

export function ensureMigration(event: MigrationSignaled): Migration {
  let id = generateMigrationId(
    event.params.vaultProxy.toHex(),
    event.params.prevFundDeployer.toHex(),
    event.params.nextFundDeployer.toHex(),
    event.block.timestamp.toString(),
  );

  let migration = Migration.load(id) as Migration;
  if (migration) {
    return migration;
  }

  migration = new Migration(id);
  migration.prevRelease = ensureRelease(event.params.prevFundDeployer.toHex(), event).id;
  migration.nextRelease = ensureRelease(event.params.nextFundDeployer.toHex(), event).id;
  migration.fund = useFund(event.params.vaultProxy.toHex()).id;
  migration.executableTimestamp = event.block.timestamp;
  migration.cancelled = false;
  migration.executed = false;
  migration.nextAccessor = event.params.nextVaultAccessor.toHex();
  migration.save();

  return migration;
}

// Uniquely identifies a signaled migration.
export function generateMigrationId(
  vaultProxy: string,
  prevFundDeployer: string,
  nextFundDeployer: string,
  timestamp: string,
): string {
  let arr: string[] = [vaultProxy, prevFundDeployer, nextFundDeployer, timestamp];
  return arr.join('/');
}
