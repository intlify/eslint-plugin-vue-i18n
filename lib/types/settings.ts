/**
 * How to determine the locale for localization messages.
 * - `'file'` ... Determine the locale name from the filename. The resource file should only contain messages for that locale.
 *                Use this option if you use `vue-cli-plugin-i18n`. This method is also used when String option is specified.
 * - `'path'` ... Determine the locale name from the path of resource. In this case, the locale must be had structured with your rule on the path.
 *                It can be captured with the regular expression named capture. The resource file should only contain messages for that locale.
 * - `'key'`  ... Determine the locale name from the root key name of the file contents. The value of that key should only contain messages for that locale.
 *                Used when the resource file is in the format given to the `messages` option of the `VueI18n` constructor option.
 */
export type LocaleKeyType = 'file' | 'path' | 'key'
/**
 * Type of `settings['vue-i18n'].localeDir`
 */
export type SettingsVueI18nLocaleDir =
  | SettingsVueI18nLocaleDirGlob
  | SettingsVueI18nLocaleDirObject
  | (SettingsVueI18nLocaleDirGlob | SettingsVueI18nLocaleDirObject)[]
/**
 * A glob for specifying files that store localization messages of project.
 */
export type SettingsVueI18nLocaleDirGlob = string
/**
 * Specifies a glob and messages format type.
 */
export interface SettingsVueI18nLocaleDirObject {
  /**
   * A glob for specifying files that store localization messages of project.
   */
  pattern: string
  /**
   * Specifies how to determine the locale for localization messages.
   */
  localeKey: LocaleKeyType
  /**
   * Specifies how to determine pattern the locale for localization messages.
   *
   * This option means, when `localeKey` is `'path'`, you will need to capture the locale using a regular expression.
   * You need to use the locale capture as a named capture `?<locale>`, so it’s be able to capture from the path of the locale resources.
   * If you omit it, it will be captured from the resource path with the same regular expression pattern as `vue-cli-plugin-i18n`.
   */
  localePattern?: string | RegExp
}
