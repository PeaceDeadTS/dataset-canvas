import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Languages, Info } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation('common');
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: t('settings.themeLight'),
      description: t('settings.themeLightDescription'),
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: t('settings.themeDark'),
      description: t('settings.themeDarkDescription'),
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: t('settings.themeSystem'),
      description: t('settings.themeSystemDescription'),
      icon: Monitor,
    },
  ];

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('settings.title')}</DialogTitle>
          <DialogDescription>
            {t('settings.preferences')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">{t('settings.appearance')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.themeDescription')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-medium">{t('settings.theme')}</Label>
              <RadioGroup value={theme} onValueChange={setTheme} className="gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`
                        relative flex items-start space-x-3 rounded-lg border-2 p-4 transition-all
                        hover:bg-accent/50 cursor-pointer
                        ${
                          theme === option.value
                            ? 'border-primary bg-accent/30'
                            : 'border-border'
                        }
                      `}
                      onClick={() => setTheme(option.value)}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <Label
                            htmlFor={option.value}
                            className="text-base font-medium cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          {/* Language Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">{t('settings.language')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.languageDescription')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <RadioGroup
                value={i18n.language}
                onValueChange={(value) => i18n.changeLanguage(value)}
                className="gap-4"
              >
                {languageOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`
                      relative flex items-start space-x-3 rounded-lg border-2 p-4 transition-all
                      hover:bg-accent/50 cursor-pointer
                      ${
                        i18n.language === option.value
                          ? 'border-primary bg-accent/30'
                          : 'border-border'
                      }
                    `}
                    onClick={() => i18n.changeLanguage(option.value)}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`lang-${option.value}`}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.flag}</span>
                        <Label
                          htmlFor={`lang-${option.value}`}
                          className="text-base font-medium cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">{t('settings.about')}</h3>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Dataset Canvas</span>
                <span className="text-sm text-muted-foreground">{t('settings.version')} 1.0.0</span>
              </div>
              <p className="text-xs text-muted-foreground">
                A modern dataset management platform
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

