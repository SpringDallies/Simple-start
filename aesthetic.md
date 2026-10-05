$logPath = "C:\Users\straightheart\.gemini\antigravity-ide\brain\b92f7d70-e9e4-4495-9311-0ee4d804dc09\.system_generated\logs\transcript_full.jsonl"
$reader = [System.IO.File]::OpenText($logPath)
while (-not $reader.EndOfStream) {
    $line = $reader.ReadLine()
    if ($line.Contains('"name":"replace_file_content"') -or $line.Contains('"name":"write_to_file"') -or $line.Contains('"name":"multi_replace_file_content"')) {
        if ($line.Contains("aesthetic.md")) {
            $json = ConvertFrom-Json $line
            Write-Output "Step: $($json.step_index), Tool: $($json.tool_calls[0].name)"
        }
    }
}
$reader.Close()
