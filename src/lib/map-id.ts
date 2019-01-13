import { Uint16 } from "semantic-types";
import { FillStyle, FillStyleType, MorphFillStyle, ShapeRecordType, SpriteTag, Tag, TagType } from "swf-tree";
import { MorphShapeStyles } from "swf-tree/morph-shape-styles";
import { ShapeStyles } from "swf-tree/shape-styles";
import {
  DefineButton,
  DefineMorphShape,
  DefineShape,
  DefineSprite,
  ExportAssets,
  PlaceObject,
  RemoveObject,
} from "swf-tree/tags";

export function mapId(tag: SpriteTag, fn: (id: Uint16) => Uint16): SpriteTag;
export function mapId(tag: Tag, fn: (id: Uint16) => Uint16): Tag;
export function mapId(tag: Tag, fn: (id: Uint16) => Uint16): Tag {
  switch (tag.type) {
    case TagType.DefineBinaryData:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineBitmap:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineButton:
      return mapDefineButton(tag, fn);
    case TagType.DefineCffFont:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineDynamicText:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineFont:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineMorphShape:
      return mapDefineMorphShape(tag, fn);
    case TagType.DefinePartialFont:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineShape:
      return mapDefineShape(tag, fn);
    case TagType.DefineSound:
      return {...tag, id: fn(tag.id)};
    case TagType.DefineSprite:
      return mapDefineSprite(tag, fn);
    case TagType.DefineText:
      return {...tag, id: fn(tag.id)};
    case TagType.ExportAssets:
      return mapExportAssets(tag, fn);
    case TagType.PlaceObject:
      return mapPlaceObject(tag, fn);
    case TagType.RemoveObject:
      return mapRemoveObject(tag, fn);
    default:
      return tag;
  }
}

function mapDefineButton(tag: DefineButton, fn: (id: Uint16) => Uint16): DefineButton {
  return {
    ...tag,
    id: fn(tag.id),
    characters: tag.characters.map(c => ({...c, id: fn(c.characterId)})),
  };
}

function mapDefineMorphShape(tag: DefineMorphShape, fn: (id: Uint16) => Uint16): DefineMorphShape {
  return {
    ...tag,
    id: fn(tag.id),
    shape: {
      ...tag.shape,
      initialStyles: mapMorphShapeStylesDependencies(tag.shape.initialStyles, fn),
      records: tag.shape.records.map(record => {
        return record.type === ShapeRecordType.StyleChange && record.newStyles !== undefined
          ? {...record, newStyles: mapMorphShapeStylesDependencies(record.newStyles, fn)}
          : record;
      }),
    },
  };
}

function mapMorphShapeStylesDependencies(styles: MorphShapeStyles, fn: (id: Uint16) => Uint16): MorphShapeStyles {
  return {
    ...styles,
    fill: styles.fill.map(s => mapMorphFillStyle(s, fn)),
    line: styles.line.map(s => ({...s, fill: mapMorphFillStyle(s.fill, fn)})),
  };
}

function mapMorphFillStyle(style: MorphFillStyle, fn: (id: Uint16) => Uint16): MorphFillStyle {
  return style.type === FillStyleType.Bitmap ? {...style, bitmapId: fn(style.bitmapId)} : style;
}

function mapDefineShape(tag: DefineShape, fn: (id: Uint16) => Uint16): DefineShape {
  return {
    ...tag,
    id: fn(tag.id),
    shape: {
      ...tag.shape,
      initialStyles: mapShapeStylesDependencies(tag.shape.initialStyles, fn),
      records: tag.shape.records.map(record => {
        return record.type === ShapeRecordType.StyleChange && record.newStyles !== undefined
          ? {...record, newStyles: mapShapeStylesDependencies(record.newStyles, fn)}
          : record;
      }),
    },
  };
}

function mapShapeStylesDependencies(styles: ShapeStyles, fn: (id: Uint16) => Uint16): ShapeStyles {
  return {
    ...styles,
    fill: styles.fill.map(s => mapFillStyle(s, fn)),
    line: styles.line.map(s => ({...s, fill: mapFillStyle(s.fill, fn)})),
  };
}

function mapFillStyle(style: FillStyle, fn: (id: Uint16) => Uint16): FillStyle {
  return style.type === FillStyleType.Bitmap ? {...style, bitmapId: fn(style.bitmapId)} : style;
}

function mapDefineSprite(tag: DefineSprite, fn: (id: Uint16) => Uint16): DefineSprite {
  return {
    ...tag,
    id: fn(tag.id),
    tags: tag.tags.map(childTag => mapId(childTag, fn)),
  };
}

function mapExportAssets(tag: ExportAssets, fn: (id: Uint16) => Uint16): ExportAssets {
  return {
    ...tag,
    assets: tag.assets.map(asset => ({...asset, id: fn(asset.id)})),
  };
}

function mapPlaceObject(tag: PlaceObject, fn: (id: Uint16) => Uint16): PlaceObject {
  return {
    ...tag,
    characterId: tag.characterId !== undefined ? fn(tag.characterId) : undefined,
  };
}

function mapRemoveObject(tag: RemoveObject, fn: (id: Uint16) => Uint16): RemoveObject {
  return {
    ...tag,
    characterId: tag.characterId !== undefined ? fn(tag.characterId) : undefined,
  };
}
