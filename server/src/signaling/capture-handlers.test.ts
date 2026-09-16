// ©️ Mewn

import { describe, it, expect } from 'vitest';
import { isCaptureIdForRoom } from './capture-handlers';

describe('isCaptureIdForRoom', () => {
  it('matches IDs generated as `${roomId}-${timestamp}`', () => {
    expect(isCaptureIdForRoom('AbcDef1234-1757890000000', 'AbcDef1234')).toBe(true);
  });

  it('matches room IDs that themselves contain dashes', () => {
    expect(isCaptureIdForRoom('ab-cd-ef12-1757890000000', 'ab-cd-ef12')).toBe(true);
  });

  it('rejects other rooms and non-matching IDs', () => {
    expect(isCaptureIdForRoom('OtherRoom1-1757890000000', 'AbcDef1234')).toBe(false);
    expect(isCaptureIdForRoom('AbcDef1234', 'AbcDef1234')).toBe(false);
    expect(isCaptureIdForRoom('AbcDef12345-1757890000000', 'AbcDef1234')).toBe(false);
  });
});
