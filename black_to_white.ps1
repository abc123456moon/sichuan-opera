param(
    [Parameter(Mandatory=$true)][string]$InPath,
    [Parameter(Mandatory=$true)][string]$OutPath,
    [int]$Threshold = 60
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile($InPath)
$w = $src.Width
$h = $src.Height

# Lock bits for fast pixel access (Format32bppArgb)
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = [Math]::Abs($stride) * $h
$buffer = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buffer, 0, $bytes)

# BGRA layout. Replace near-black pixels with white.
for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = $buffer[$i]
    $g = $buffer[$i + 1]
    $r = $buffer[$i + 2]
    if ($b -le $Threshold -and $g -le $Threshold -and $r -le $Threshold) {
        $buffer[$i]     = 255
        $buffer[$i + 1] = 255
        $buffer[$i + 2] = 255
        $buffer[$i + 3] = 255
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($buffer, 0, $data.Scan0, $bytes)
$src.UnlockBits($data)

$src.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$src.Dispose()
Write-Output ("OK: {0} -> {1} ({2}x{3}, threshold={4})" -f $InPath, $OutPath, $w, $h, $Threshold)
