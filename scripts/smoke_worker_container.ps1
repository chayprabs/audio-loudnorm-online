$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$imageName = "audio-suite-worker-smoke"
$containerName = "audio-suite-worker-smoke"
$baseUrl = "http://127.0.0.1:18000"

function Wait-ForHealth {
  param(
    [string]$Url,
    [int]$Retries = 30
  )

  for ($attempt = 0; $attempt -lt $Retries; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri "$Url/health" -Method Get
      if ($response.status -eq "ok") {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Worker did not become healthy at $Url."
}

function Assert {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

Push-Location $repoRoot
try {
  docker info | Out-Null
  docker rm -f $containerName | Out-Null 2>$null
  docker build -t $imageName -f apps/worker/Dockerfile .
  docker run --rm -d --name $containerName -p 18000:8000 $imageName | Out-Null

  Wait-ForHealth -Url $baseUrl

  $samples = Invoke-RestMethod -Uri "$baseUrl/v1/samples" -Method Get
  Assert ($samples.Count -ge 5) "Expected at least five samples in the worker manifest."

  $probe = Invoke-RestMethod -Uri "$baseUrl/v1/probe" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=podcast-demo"
  Assert ($probe.codec -ne $null) "Probe did not return an audio codec."

  $extract = Invoke-RestMethod -Uri "$baseUrl/v1/extract" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=music-demo&output_format=mp3&downmix=stereo&sample_rate=44100"
  Assert ($extract.format -eq "mp3") "Extract did not return the requested format."

  $loudnorm = Invoke-RestMethod -Uri "$baseUrl/v1/loudnorm" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=podcast-demo&preset=apple&mode=two-pass"
  Assert ($loudnorm.preset -eq "apple") "Loudnorm did not apply the Apple preset."

  $peaks = Invoke-RestMethod -Uri "$baseUrl/v1/peaks" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=music-demo"
  Assert ($peaks.levels.Count -ge 3) "Peaks did not return multiple zoom levels."

  $fingerprint = Invoke-RestMethod -Uri "$baseUrl/v1/fingerprint" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=near-duplicate-a&sample_id_b=near-duplicate-b&compare_mode=true"
  Assert ($fingerprint.score -gt 0.9) "Fingerprint compare score was lower than expected for the near-duplicate pair."

  $silence = Invoke-RestMethod -Uri "$baseUrl/v1/silence" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "sample_id=voiceover-demo&threshold_db=-38&min_duration_sec=0.5&trim=true"
  Assert ($silence.ranges.Count -ge 2) "Silence detection did not find the expected silent ranges."

  Write-Host "Worker container smoke test passed."
} finally {
  docker rm -f $containerName | Out-Null 2>$null
  Pop-Location
}
