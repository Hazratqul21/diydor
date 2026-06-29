# P01 — Dizayn tizimi (theme + token + shared widgetlar)

> Kontekst: `01_MASTER.md` §4 va `03_DESIGN_TOKENS.json`. P00 tugagan bo'lsin.

## Promt

```
Diydor dizayn tizimini Flutter'da qur. Manba: docs/flutter/01_MASTER.md §4 va docs/flutter/03_DESIGN_TOKENS.json. Barcha qiymat TOKENDAN olinadi — hech qayerda hardcode HEX/size bo'lmasin.

Vazifa:
1. lib/app/theme/app_colors.dart — JSON'dagi barcha ranglar (light). Qo'shimcha: AppColors.dark (MASTER §4.1 dark eslatmasi). ColorScheme.light va .dark (M3) quril: primary=#A73833, surface=#FCF8FB, error=#BA1A1A, tertiary=#005BC1, va h.k.
2. app_typography.dart — Manrope (google_fonts), MASTER §4.2 type-scale ni TextTheme ga map (headlineLarge=34/700/-0.02, ... labelSmall=13/500). label-caps uchun alohida style (uppercase, ls 0.05).
3. app_spacing.dart — spacing (8/12/16/24/34), radius (4/8/12/16/24/28/full), shadow (ambient/lift/card/glow/primaryCta) const'lar.
4. app_theme.dart — AppTheme.light/dark: ColorScheme + TextTheme + komponent temalar (FilledButton h56 radius16, Card radius24, BottomSheet radius28, Chip). useMaterial3: true.
5. shared/widgets:
   - DiydorButton (variant: primary/secondary/ghost; size; loading; leadingIcon; onTap → HapticFeedback.lightImpact + scale 0.96 press anim).
   - DiydorCard (radius24, ambient shadow).
   - SegmentedTabs (pill track surface-subtle, faol pill surface-warm+shadow) — Discover header uchun.
   - AppBarBlur (BackdropFilter blur + surface 70% — glassmorphism).
   - InterestChip (ikonka+matn; 'onGlass' rejimi: white20 + blur, karta ustida).
   - ShimmerBox (flutter_animate shimmer; MASTER §6 shimmer 1400ms).
   - EmptyState (doira ikonka + sarlavha + matn).
   - DiydorBottomSheet (drag handle, radius28, spring slide-up).
6. Material Symbols / Icons: React 'Material Symbols Outlined' ishlatgan. Flutter'da material_symbols_icons paketi (yoki Icons) bilan moslashtir; 'fill' varianti uchun filled ikonka.
7. Demo "Style Gallery" ekrani (/dev/styles, faqat debug) — barcha widget+ranglar+typografiyani ko'rsatadi (vizual tekshiruv uchun).

Acceptance:
- flutter analyze toza; Style Gallery'da light/dark ikkalasi to'g'ri ko'rinadi (theme toggle).
- Hech bir widgetda raw Color(0x..)/raw double size yo'q — hammasi AppColors/AppSpacing/Theme dan.
- Manrope yuklanadi; type-scale MASTER bilan mos.
```
