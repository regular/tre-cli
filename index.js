const {spawn} = require('child_process')
const minimist = require('minimist')
const debug = require('debug')('tre-cli')

const COMMANDS = {
  'init': {bin: 'tre-cli-init', desc: 'create a new ssb network (.trerc file)'},
  'import-files': {bin: 'tre-cli-import-files', desc: 'publish messages, assets and prototypes'},
  'compile': {bin: 'tre-compile', desc: 'bundles an application for distribution via ssb'},
  'apps': {module: 'tre-cli-apps', bin: 'tre-apps', desc: 'list and deploy webapps and create invite codes'},
  'server': {bin: 'tre-cli-server', desc: 'start an ssb server and optionally run a shell command'},
  'import': {bin: 'tre-import', desc: 'read a JSON stream and publish its content as ssb messages'},
  'export': {bin: 'tre-export', desc: 'extract data from a set of ssb messages'},
  'about': {bin: 'tre-cli-about', desc: 'set icons, names and descriptions for identities, applications and networks'}
}

module.exports = function(argv, cerr, cb) {
  const parsed = minimist(argv)
  if (parsed._.length == 0) {
    if (parsed.version) return version(cb)
    help(cb)
  } else {
    const command = COMMANDS[argv[0]]
    if (!command) {
      return cb(new Error(`Unknown command: ${argv[0]}`))
    }
    return runCommand(command.bin, argv.slice(1), cb)
  }

  function version(cb) {
    cerr(`tre-cli ${require(__dirname + '/package.json').version}`)
    for(let [key, {module, bin}] of Object.entries(COMMANDS)) {
      if (!module) module = bin
      const {version} = require(`${module}/package.json`)
      cerr(`${module} ${version}`)
    }
    cb()
  }

  function help(cb) {
    cerr('Usage: tre COMMAND [SUBCOMMAND] [OPTIONS]')
    cerr('\nCOMMANDS')
    for(let [key, {desc}] of Object.entries(COMMANDS)) {
      cerr(`${key} - ${desc}`)
    }
    cerr('\nOPTIONS')
    cerr('--help show command-specific help')
    cerr('--version show versions')
    cb()
  }

  function runCommand(bin, argv, cb) {
    debug(`Running ${bin} ${argv.join(' ')}`)
    const child = spawn(`${__dirname}/node_modules/.bin/${bin}`,
      argv.concat(['--run-by-tre-cli']), {
        env: process.env,
        stdio: 'inherit'
      }
    )
    child.on('exit', code => {
      if (code == 0) return cb()
      cb(new Error(`${bin} exited with code ${code}`))
    })
  }
}
