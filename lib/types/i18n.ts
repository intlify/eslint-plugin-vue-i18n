export type I18nLocaleMessageValue = string | I18nLocaleMessageDictionary

export type I18nLocaleMessageDictionary = {
  [property: string]: I18nLocaleMessageValue
  [property: number]: I18nLocaleMessageValue
}
