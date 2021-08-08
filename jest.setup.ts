import { Settings } from 'luxon';

// FIXME: upgrade @types/luxon to 2.0
(Settings.defaultZone as any) = 'Asia/Hong_Kong';
Settings.defaultLocale = 'en-GB';
