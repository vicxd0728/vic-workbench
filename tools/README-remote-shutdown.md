# Remote Power Agent

This agent lets Vic Workbench queue shutdown, restart, hibernate, and cancel commands through Cloudflare Pages.

## Test Mode

`.remote-agent.env` is currently set to `DRY_RUN=true`, so the agent reports that it received commands without actually shutting down the PC.

Run it from the project folder:

```powershell
node .\tools\remote-shutdown-agent.js
```

When testing is finished, change `DRY_RUN=false` in `.remote-agent.env` and restart the agent.

## Temperature

The agent tries Windows ACPI thermal readings through WMI. Some desktops and laptops do not expose CPU temperature there; in that case the dashboard will show that the reading is unavailable instead of inventing a value.

## Wake

Shutdown cannot be reversed remotely after the PC is fully off. Waking from sleep or hibernate needs BIOS/NIC Wake-on-LAN support plus a LAN relay or router rule. This agent can request hibernate, but it cannot wake itself while suspended.
