# setup-backup.ps1 — registers a daily Task Scheduler job for VerMillion CRM backup

$TaskName   = "VerMillion CRM Backup"
$ScriptPath = "C:\Users\97254\Desktop\vermillioncrm\scripts\backup-db.js"
$NodeExe    = (Get-Command node -ErrorAction Stop).Source

Write-Host "[backup-setup] node.exe: $NodeExe"
Write-Host "[backup-setup] Script:   $ScriptPath"

# Remove existing task silently if it exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action  = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -Daily -At "03:00"
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $Action `
    -Trigger   $Trigger `
    -Settings  $Settings `
    -RunLevel  Limited `
    -Force | Out-Null

Write-Host "[backup-setup] Task registered successfully."
Write-Host ""
Get-ScheduledTask -TaskName $TaskName | Format-List TaskName, State
Get-ScheduledTaskInfo -TaskName $TaskName | Format-List LastRunTime, NextRunTime, LastTaskResult
