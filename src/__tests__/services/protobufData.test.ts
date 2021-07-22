import {ProtobufDataTransformer} from "@services/encoding/protobufDataTransformer";
import {ContentType} from "@services/cacheConfigUtils";

describe('ProtobufData tests', () => {
  test('from protobuf type to ContentType', () => {
    expect(ProtobufDataTransformer.fromProtobufType('string')).toStrictEqual(ContentType.StringContentType);
    expect(ProtobufDataTransformer.fromProtobufType('float')).toStrictEqual(ContentType.FloatContentType);
    expect(ProtobufDataTransformer.fromProtobufType('double')).toStrictEqual(ContentType.DoubleContentType);
    expect(ProtobufDataTransformer.fromProtobufType('int32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataTransformer.fromProtobufType('int64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataTransformer.fromProtobufType('uint32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataTransformer.fromProtobufType('uint64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataTransformer.fromProtobufType('sint32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataTransformer.fromProtobufType('sint64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataTransformer.fromProtobufType('fixed32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataTransformer.fromProtobufType('fixed64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataTransformer.fromProtobufType('sfixed32')).toStrictEqual(ContentType.IntegerContentType);
    expect(ProtobufDataTransformer.fromProtobufType('sfixed64')).toStrictEqual(ContentType.LongContentType);
    expect(ProtobufDataTransformer.fromProtobufType('bool')).toStrictEqual(ContentType.BooleanContentType);
  });
});
