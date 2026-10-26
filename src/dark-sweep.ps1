$ErrorActionPreference = 'Stop'
$f = 'C:\Users\Administrator\Desktop\raqib\src\components\landing\LandingPage.tsx'
$t = Get-Content $f -Raw

# 1) opaque whites (menus) first
$t = $t -replace 'bg-white/95\b', 'bg-[#0b0e08]/95'
$t = $t -replace 'bg-white/90\b', 'bg-[#0b0e08]/90'
$t = $t -replace 'bg-\[#f7faf7\]/95', 'bg-[#0b0e08]/95'
# 2) glass opacities (longest tokens first)
$t = $t -replace 'bg-white/80\b', 'bg-white/[0.13]'
$t = $t -replace 'bg-white/75\b', 'bg-white/[0.11]'
$t = $t -replace 'bg-white/72\b', 'bg-white/[0.1]'
$t = $t -replace 'bg-white/70\b', 'bg-white/[0.09]'
$t = $t -replace 'bg-white/65\b', 'bg-white/[0.09]'
$t = $t -replace 'bg-white/60\b', 'bg-white/[0.07]'
$t = $t -replace 'bg-white/55\b', 'bg-white/[0.06]'
$t = $t -replace 'bg-white/52\b', 'bg-white/[0.055]'
$t = $t -replace 'bg-white/50\b', 'bg-white/[0.05]'
$t = $t -replace 'bg-white/45\b', 'bg-white/[0.05]'
$t = $t -replace 'bg-white/40\b', 'bg-white/[0.045]'
$t = $t -replace 'bg-white/38\b', 'bg-white/[0.04]'
$t = $t -replace 'bg-white/25\b', 'bg-white/[0.03]'
# 3) borders
$t = $t -replace 'border-white/80\b', 'border-white/10'
$t = $t -replace 'border-white/75\b', 'border-white/10'
$t = $t -replace 'border-white/70\b', 'border-white/10'
$t = $t -replace 'border-white/60\b', 'border-white/[0.08]'
$t = $t -replace 'border-ink-950/\[0\.06\]', 'border-white/[0.06]'
$t = $t -replace 'border-ink-950/\[0\.08\]', 'border-white/[0.08]'
# 4) light shadows -> dark
$t = $t -replace 'rgba\(19,56,44', 'rgba(0,0,0'
$t = $t -replace 'rgba\(28,44,10', 'rgba(0,0,0'
$t = $t -replace 'rgba\(8,22,17', 'rgba(0,0,0'

Set-Content -Path $f -Value $t -Encoding utf8 -NoNewline
"SWEEP-DONE"
