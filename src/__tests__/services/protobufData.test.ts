import {ProtobufDataUtils} from "@services/protobufDataUtils";
import {ContentType} from "@services/cacheConfigUtils";

describe('ProtobufData tests', () => {
  test('from protobuf type to ContentType', () => {
    expect(ProtobufDataUtils.fromProtobufType('string')).toStrictEqual(ContentType.StringContentType);
    expect(ProtobufDataUtils.fromProtobufType('float')).toStrictEqual(ContentType.FloatContentType);
    expect(ProtobufDataUtils.fromProtobufType('double')).toStrictEqual(ContentType.DoubleContentType);
    expect(ProtobufDataUtils.fromProtobufType('int32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataUtils.fromProtobufType('int64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataUtils.fromProtobufType('uint32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataUtils.fromProtobufType('uint64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataUtils.fromProtobufType('sint32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataUtils.fromProtobufType('sint64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataUtils.fromProtobufType('fixed32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataUtils.fromProtobufType('fixed64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataUtils.fromProtobufType('sfixed32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataUtils.fromProtobufType('sfixed64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataUtils.fromProtobufType('bool')).toStrictEqual(ContentType.BooleanContentType);
  });
});
