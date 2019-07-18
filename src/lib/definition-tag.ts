import { Tag, TagType } from "swf-tree";
import {
  DefineBinaryData,
  DefineBitmap,
  DefineButton,
  DefineCffFont,
  DefineDynamicText,
  DefineFont,
  DefineGlyphFont,
  DefineMorphShape,
  DefineShape,
  DefineSound,
  DefineSprite,
  DefineText,
} from "swf-tree/tags";

export type DefinitionTag =
  DefineBinaryData
  | DefineBitmap
  | DefineButton
  | DefineCffFont
  | DefineDynamicText
  | DefineFont
  | DefineGlyphFont
  | DefineMorphShape
  | DefineShape
  | DefineSound
  | DefineSprite
  | DefineText;

const DEFINITION_TAGS: ReadonlySet<TagType> = new Set([
  TagType.DefineBinaryData,
  TagType.DefineBitmap,
  TagType.DefineButton,
  TagType.DefineCffFont,
  TagType.DefineDynamicText,
  TagType.DefineFont,
  TagType.DefineGlyphFont,
  TagType.DefineMorphShape,
  TagType.DefineShape,
  TagType.DefineSound,
  TagType.DefineSprite,
  TagType.DefineText,
]);

export function isDefinitionTag(tag: Tag): tag is DefinitionTag {
  return DEFINITION_TAGS.has(tag.type);
}
