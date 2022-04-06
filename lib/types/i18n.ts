export type I18nLocaleMessageValue =
  | string
  | null
  | undefined
  | number
  | boolean
  | symbol
  | bigint
  | I18nLocaleMessageDictionary

export type I18nLocaleMessageDictionary = {
  [property: string]: I18nLocaleMessageValue
  [property: number]: I18nLocaleMessageValue
}
