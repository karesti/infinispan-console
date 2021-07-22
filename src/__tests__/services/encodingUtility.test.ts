import { EncodingUtility} from '@services/encoding/encodingUtility';
import {ContentType} from "@services/cacheConfigUtils";

describe('Encoding Utility tests', () => {
  test('from ContentType to string', () => {
    expect(EncodingUtility.fromContentType(ContentType.StringContentType)).toBe(
      'application/x-java-object;type=java.lang.String'
    );
    expect(EncodingUtility.fromContentType(ContentType.IntegerContentType)).toBe(
      'application/x-java-object;type=java.lang.Integer'
    );
    expect(EncodingUtility.fromContentType(ContentType.DoubleContentType)).toBe(
      'application/x-java-object;type=java.lang.Double'
    );
    expect(EncodingUtility.fromContentType(ContentType.BooleanContentType)).toBe(
      'application/x-java-object;type=java.lang.Boolean'
    );
    expect(EncodingUtility.fromContentType(ContentType.LongContentType)).toBe(
      'application/x-java-object;type=java.lang.Long'
    );
    expect(EncodingUtility.fromContentType(ContentType.JSON)).toBe('application/json');
    expect(EncodingUtility.fromContentType(ContentType.XML)).toBe('application/xml');
  });

  test('from string to ContentType', () => {
    expect(EncodingUtility.toContentType('unknown')).toBe(ContentType.StringContentType);
    expect(EncodingUtility.toContentType(null)).toBe(ContentType.StringContentType);
    expect(EncodingUtility.toContentType(undefined)).toBe(ContentType.StringContentType);
    expect(EncodingUtility.toContentType(null, ContentType.JSON)).toBe(ContentType.JSON);
    expect(
      EncodingUtility.toContentType('application/x-java-object;type=java.lang.String')
    ).toBe(ContentType.StringContentType);
    expect(
      EncodingUtility.toContentType('application/x-java-object;type=java.lang.Long')
    ).toBe(ContentType.LongContentType);
    expect(
      EncodingUtility.toContentType('application/x-java-object;type=java.lang.Integer')
    ).toBe(ContentType.IntegerContentType);
    expect(
      EncodingUtility.toContentType('application/x-java-object;type=java.lang.Boolean')
    ).toBe(ContentType.BooleanContentType);
    expect(
      EncodingUtility.toContentType('application/x-java-object;type=java.lang.Double')
    ).toBe(ContentType.DoubleContentType);
    expect(EncodingUtility.toContentType('application/json')).toBe(ContentType.JSON);
    expect(EncodingUtility.toContentType('application/xml')).toBe(ContentType.XML);
  });
});
