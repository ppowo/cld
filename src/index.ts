import { init } from './commands/init';
import { list } from './commands/list';
import { setup } from './commands/setup';
import { set } from './commands/set';
import { debug } from './commands/debug';

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
cld - Claude Code Provider Switcher

Usage:
  cld init                      Initialize shell integration (eval this)
  cld list                      List available providers
  cld setup <provider> <key>    Configure API key for a provider
  cld set <provider|none>       Switch active provider (or disable with 'none')
  cld debug                     Show current state for debugging

Shell Setup:
  Add to ~/.bashrc or ~/.zshrc:

    eval "$(cld init)"

    # Shell function for seamless switching
    cld() {
      if [[ "$1" == "set" ]]; then
        eval "$(command cld "$@")"
      else
        command cld "$@"
      fi
    }
`);
}

switch (command) {
  case 'init':
    init();
    break;

  case 'list':
    list();
    break;

  case 'setup': {
    const provider = args[1];
    const key = args[2];
    if (!provider || !key) {
      console.error('Usage: cld setup <provider> <key>');
      process.exit(1);
    }
    setup(provider, key);
    break;
  }

  case 'set': {
    const provider = args[1];
    if (!provider) {
      console.error('Usage: cld set <provider|none>');
      process.exit(1);
    }
    set(provider);
    break;
  }

  case 'debug':
    debug();
    break;

  case '--help':
  case '-h':
  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
