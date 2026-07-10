import 'server-only';

/** RFC 9457 Problem Details 風のエラーレスポンス（docs/08 §2）。 */
export type Problem = {
  type: 'validation_error' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'internal';
  title: string;
  status: number;
  errors?: { path: string; message: string }[];
};

export function problem(
  type: Problem['type'],
  title: string,
  status: number,
  errors?: Problem['errors'],
): Problem {
  return errors ? { type, title, status, errors } : { type, title, status };
}
