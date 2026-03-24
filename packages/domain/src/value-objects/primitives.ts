export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type EmailAddress = Brand<string, "EmailAddress">;
export type EntityCode = Brand<string, "EntityCode">;
export type LocaleCode = Brand<string, "LocaleCode">;
export type TimezoneName = Brand<string, "TimezoneName">;
export type UrlString = Brand<string, "UrlString">;
