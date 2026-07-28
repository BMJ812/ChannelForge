import { isString } from 'lodash-es';

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}
