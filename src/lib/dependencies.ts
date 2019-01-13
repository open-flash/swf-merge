import { Uint16 } from "semantic-types";
import { FillStyle, FillStyleType, MorphFillStyle, ShapeRecordType, Tag, TagType } from "swf-tree";
import { MorphShapeStyles } from "swf-tree/morph-shape-styles";
import { ShapeStyles } from "swf-tree/shape-styles";
import { DefineButton, DefineMorphShape, DefineShape, DefineSprite, PlaceObject, RemoveObject } from "swf-tree/tags";

export function getDependencies(tag: Tag): Set<Uint16> {
  return new Set(getTagDependencies(tag));
}

function* getTagDependencies(tag: Tag): Iterable<Uint16> {
  switch (tag.type) {
    case TagType.DefineButton:
      yield* getDefineButtonDependencies(tag);
      break;
    case TagType.DefineMorphShape:
      yield* new Set(getDefineMorphShapeDependencies(tag));
      break;
    case TagType.DefineShape:
      yield* new Set(getDefineShapeDependencies(tag));
      break;
    case TagType.DefineSprite:
      yield* getDefineSpriteDependencies(tag);
      break;
    case TagType.PlaceObject:
      yield* getPlaceObjectDependencies(tag);
      break;
    case TagType.RemoveObject:
      yield* getRemoveObjectDependencies(tag);
      break;
    default:
      break;
  }
}

function* getDefineButtonDependencies(tag: DefineButton): Iterable<Uint16> {
  for (const record of tag.characters) {
    yield record.characterId;
  }
}

function* getDefineMorphShapeDependencies(tag: DefineMorphShape): Iterable<Uint16> {
  const dependencies: Set<Uint16> = new Set();
  yield* getMorphShapeStylesDependencies(tag.shape.initialStyles);
  for (const record of tag.shape.records) {
    if (record.type === ShapeRecordType.StyleChange && record.newStyles !== undefined) {
      yield* getMorphShapeStylesDependencies(record.newStyles);
    }
  }
  return dependencies;
}

function* getMorphShapeStylesDependencies(styles: MorphShapeStyles): Iterable<Uint16> {
  for (const fillStyle of styles.fill) {
    yield* getMorphFillStyleDependencies(fillStyle);
  }
  for (const lineStyle of styles.line) {
    yield* getMorphFillStyleDependencies(lineStyle.fill);
  }
}

function* getMorphFillStyleDependencies(style: MorphFillStyle): Iterable<Uint16> {
  if (style.type === FillStyleType.Bitmap) {
    yield style.bitmapId;
  }
}

function* getDefineShapeDependencies(tag: DefineShape): Iterable<Uint16> {
  const dependencies: Set<Uint16> = new Set();
  yield* getShapeStylesDependencies(tag.shape.initialStyles);
  for (const record of tag.shape.records) {
    if (record.type === ShapeRecordType.StyleChange && record.newStyles !== undefined) {
      yield* getShapeStylesDependencies(record.newStyles);
    }
  }
  return dependencies;
}

function* getShapeStylesDependencies(styles: ShapeStyles): Iterable<Uint16> {
  for (const fillStyle of styles.fill) {
    yield* getFillStyleDependencies(fillStyle);
  }
  for (const lineStyle of styles.line) {
    yield* getFillStyleDependencies(lineStyle.fill);
  }
}

function* getFillStyleDependencies(style: FillStyle): Iterable<Uint16> {
  if (style.type === FillStyleType.Bitmap) {
    yield style.bitmapId;
  }
}

function* getDefineSpriteDependencies(tag: DefineSprite): Iterable<Uint16> {
  for (const childTag of tag.tags) {
    yield* getTagDependencies(childTag);
  }
}

function* getPlaceObjectDependencies(tag: PlaceObject): Iterable<Uint16> {
  if (tag.characterId !== undefined) {
    yield tag.characterId;
  }
}

function* getRemoveObjectDependencies(tag: RemoveObject): Iterable<Uint16> {
  if (tag.characterId !== undefined) {
    yield tag.characterId;
  }
}
