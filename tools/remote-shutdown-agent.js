const os = require('os');
const { execFile } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const VERSION = '0.1.0';
const env = loadEnv(join(process.cwd(), '.remote-agent.env'));
const config = {
  workbenchUrl: trimSlash(env.WORKBENCH_URL || 'https://vic-workbench.pages.dev'),
  deviceId: env.DEVICE_ID || 'vic-windows-pc',
  token: env.DEVICE_AGENT_TOKEN || '',
  pollSeconds: Math.max(5, Number(env.POLL_SECONDS || 10)),
  dryRun: String(env.DRY_RUN || 'true').toLowerCase() !== 'false'
};

if (!config.token) {
  console.error('Missing DEVICE_AGENT_TOKEN in .remote-agent.env');
  process.exit(1);
}

console.log(`[remote-agent] ${config.deviceId} -> ${config.workbenchUrl} (${config.dryRun ? 'dry run' : 'live'})`);

let lastCommandId = '';
poll();
setInterval(poll, config.pollSeconds * 1000);

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .reduce((values, line) => {
      const index = line.indexOf('=');
      values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
      return values;
    }, {});
}

function trimSlash(value) {
  return String(value).replace(/\/+$/, '');
}

async function poll() {
  try {
    const telemetry = await collectTelemetry();
    const response = await fetch(`${config.workbenchUrl}/api/device/poll`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        hostname: os.hostname(),
        version: VERSION,
        dryRun: config.dryRun,
        telemetry
      })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || `HTTP ${response.status}`);
    if (data.command && data.command.id !== lastCommandId) {
      lastCommandId = data.command.id;
      await runCommand(data.command);
    }
  } catch (error) {
    console.error(`[remote-agent] ${new Date().toISOString()} ${error.message}`);
  }
}

async function collectTelemetry() {
  const temperature = await readWindowsTemperature();
  return {
    platform: os.platform(),
    arch: os.arch(),
    uptimeSeconds: Math.round(os.uptime()),
    loadAverage: os.loadavg(),
    freeMemoryBytes: os.freemem(),
    totalMemoryBytes: os.totalmem(),
    temperature
  };
}

async function readWindowsTemperature() {
  if (process.platform !== 'win32') {
    return { available: false, message: 'Temperature probe is only configured for Windows.' };
  }

  const probes = [readWindowsAcpiTemperature, readWindowsCounterTemperature];
  const messages = [];
  for (const probe of probes) {
    const result = await probe();
    if (result.available) return result;
    if (result.message) messages.push(result.message);
  }

  return { available: false, message: messages.join(' | ') || 'No Windows temperature reading is available.' };
}

async function readWindowsAcpiTemperature() {
  try {
    const output = await exec('powershell.exe', [
      '-NoProfile',
      '-Command',
      'Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop | Select-Object -First 1 -ExpandProperty CurrentTemperature'
    ]);
    const raw = Number(String(output).trim().split(/\s+/)[0]);
    if (!Number.isFinite(raw) || raw <= 0) {
      return { available: false, message: 'No ACPI thermal zone reading.' };
    }
    return {
      available: true,
      celsius: Math.round((raw / 10 - 273.15) * 10) / 10,
      source: 'MSAcpi_ThermalZoneTemperature'
    };
  } catch (error) {
    return { available: false, message: error.message };
  }
}

async function readWindowsCounterTemperature() {
  try {
    const output = await exec('powershell.exe', [
      '-NoProfile',
      '-Command',
      "Get-Counter '\\Thermal Zone Information(*)\\Temperature' -ErrorAction Stop | Select-Object -ExpandProperty CounterSamples | Where-Object { $_.CookedValue -gt 0 } | Select-Object -ExpandProperty CookedValue"
    ]);
    const values = String(output)
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) {
      return { available: false, message: 'No thermal zone performance counter reading.' };
    }
    const readings = values.map((value) => Math.round((value - 273.15) * 10) / 10);
    return {
      available: true,
      celsius: Math.max(...readings),
      readings,
      source: 'Thermal Zone Information'
    };
  } catch (error) {
    return { available: false, message: error.message };
  }
}

async function runCommand(command) {
  const graceSeconds = Math.min(300, Math.max(0, Number(command.graceSeconds || 0)));
  const action = String(command.action || '').toLowerCase();

  try {
    if (config.dryRun) {
      console.log(`[remote-agent] dry-run ${action} (${graceSeconds}s)`);
      await acknowledge(command, 'executed', 'Dry run: command received but not executed.');
      return;
    }

    if (action === 'cancel') {
      await exec('shutdown.exe', ['/a']);
      await acknowledge(command, 'canceled', 'Shutdown timer canceled.');
      return;
    }

    if (action === 'shutdown') {
      await exec('shutdown.exe', ['/s', '/t', String(graceSeconds)]);
      await acknowledge(command, 'executed', `Shutdown scheduled in ${graceSeconds}s.`);
      return;
    }

    if (action === 'restart') {
      await exec('shutdown.exe', ['/r', '/t', String(graceSeconds)]);
      await acknowledge(command, 'executed', `Restart scheduled in ${graceSeconds}s.`);
      return;
    }

    if (action === 'sleep') {
      const wakeAfterMinutes = Math.min(480, Math.max(0, Number(command.wakeAfterMinutes || 0)));
      if (wakeAfterMinutes > 0) {
        await scheduleWakeTimer(wakeAfterMinutes);
      }
      await exec('powershell.exe', [
        '-NoProfile',
        '-Command',
        'Add-Type -Name Win32Power -Namespace Native -MemberDefinition \'[DllImport("powrprof.dll", SetLastError=true)] public static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);\'; [Native.Win32Power]::SetSuspendState($false, $false, $false)'
      ]);
      await acknowledge(command, 'executed', wakeAfterMinutes > 0 ? `Sleep requested. Wake timer set for ${wakeAfterMinutes} minutes.` : 'Sleep requested.');
      return;
    }

    await acknowledge(command, 'ignored', `Unsupported action: ${action}`);
  } catch (error) {
    await acknowledge(command, 'failed', error.message);
  }
}

async function scheduleWakeTimer(minutes) {
  const script = [
    `$runAt = (Get-Date).AddMinutes(${minutes})`,
    `$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c exit'`,
    `$trigger = New-ScheduledTaskTrigger -Once -At $runAt`,
    `$settings = New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries`,
    `Register-ScheduledTask -TaskName 'VicWorkbenchWake' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null`
  ].join('; ');

  await exec('powershell.exe', ['-NoProfile', '-Command', script]);
}

async function acknowledge(command, status, message) {
  const response = await fetch(`${config.workbenchUrl}/api/device/ack`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId: config.deviceId,
      commandId: command.id,
      status,
      message
    })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || `ACK HTTP ${response.status}`);
}

function exec(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(String(stderr || error.message).trim()));
        return;
      }
      resolve(stdout);
    });
  });
}
